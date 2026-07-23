import "server-only";
import JSZip from "jszip";
import { xml2js, type Element } from "xml-js";

// Pure-JS reimplementation of the revise skill's scripts/read_review.py, walked section by section
// against that script so the two stay equivalent. Runs anywhere Node runs — no Python, no
// child_process. read_review.py itself is left untouched for anyone still invoking it by hand.

export type ReviewVerdict = "approved" | "change" | "reject" | "pending";

export type ReviewScriptLine =
  | { who: "client" | "interviewer"; t: string }
  | { runs: { who: "client" | "interviewer"; t: string }[] };

export type ReviewVideo = {
  verdict: ReviewVerdict;
  backup: boolean;
  topic: string;
  format: string;
  format_link: string;
  text_hook: string;
  editor_notes: string;
  shot_status: string;
  script: ReviewScriptLine[];
  comments: { text: string }[];
};

export type ScriptDocReview = {
  shoot: string;
  client: string;
  ig: string;
  videos: ReviewVideo[];
  loose_comments: { text: string }[];
  videography_notes: string;
};

const VERDICT: Record<string, ReviewVerdict> = { green: "approved", yellow: "change", red: "reject" };
const RED_HEX = new Set(["FF0000", "C00000", "FF0001"]);

function directChildren(el: Element | undefined, name: string): Element[] {
  return (el?.elements ?? []).filter((e) => e.type === "element" && e.name === name);
}

function firstChild(el: Element | undefined, name: string): Element | undefined {
  return directChildren(el, name)[0];
}

function descendants(el: Element | undefined, name: string): Element[] {
  const out: Element[] = [];
  const walk = (node: Element | undefined) => {
    for (const child of node?.elements ?? []) {
      if (child.type !== "element") continue;
      if (child.name === name) out.push(child);
      walk(child);
    }
  };
  walk(el);
  return out;
}

function attr(el: Element | undefined, name: string): string | undefined {
  const v = el?.attributes?.[name];
  return v === undefined ? undefined : String(v);
}

// Concatenates the text of every descendant <w:t> — matches read_review.py's
// `''.join(t.text or '' for t in el.iter(qn('w:t')))`.
function collectText(el: Element | undefined): string {
  return descendants(el, "w:t")
    .map((t) => (t.elements ?? []).filter((c) => c.type === "text").map((c) => String(c.text ?? "")).join(""))
    .join("");
}

function runHighlight(run: Element): string | undefined {
  const rPr = firstChild(run, "w:rPr");
  return attr(firstChild(rPr, "w:highlight"), "w:val");
}

function runIsRed(run: Element): boolean {
  const rPr = firstChild(run, "w:rPr");
  const color = attr(firstChild(rPr, "w:color"), "w:val");
  return Boolean(color && RED_HEX.has(color.toUpperCase()));
}

export async function parseScriptDocReview(fileBuffer: Buffer): Promise<ScriptDocReview> {
  const zip = await JSZip.loadAsync(fileBuffer);

  const documentXml = await zip.file("word/document.xml")?.async("text");
  if (!documentXml) throw new Error("Not a valid .docx file (missing word/document.xml).");
  const commentsXml = await zip.file("word/comments.xml")?.async("text");
  const relsXml = await zip.file("word/_rels/document.xml.rels")?.async("text");

  // comment id -> comment text
  const commentsTxt = new Map<string, string>();
  if (commentsXml) {
    const tree = xml2js(commentsXml, { compact: false }) as Element;
    const root = firstChild(tree, "w:comments");
    for (const c of directChildren(root, "w:comment")) {
      const cid = attr(c, "w:id");
      if (cid) commentsTxt.set(cid, collectText(c).trim());
    }
  }

  // relationship id -> target (for the FORMAT column's hyperlink)
  const relTargets = new Map<string, string>();
  if (relsXml) {
    const tree = xml2js(relsXml, { compact: false }) as Element;
    const root = firstChild(tree, "Relationships");
    for (const rel of directChildren(root, "Relationship")) {
      const id = attr(rel, "Id");
      const target = attr(rel, "Target");
      if (id && target) relTargets.set(id, target);
    }
  }

  const docTree = xml2js(documentXml, { compact: false }) as Element;
  const body = firstChild(firstChild(docTree, "w:document"), "w:body");
  const bodyChildren = body?.elements ?? [];

  const header = { client: "", ig: "", shoot: "" };
  const videos: ReviewVideo[] = [];
  const looseComments: { text: string }[] = [];
  let videographyNotes = "";
  let cur: ReviewVideo | null = null;

  const attachComments = (container: Element) => {
    for (const ref of descendants(container, "w:commentReference")) {
      const cid = attr(ref, "w:id");
      const text = cid ? commentsTxt.get(cid) ?? "" : "";
      (cur ? cur.comments : looseComments).push({ text });
    }
  };

  for (const child of bodyChildren) {
    if (child.type !== "element") continue;

    if (child.name === "w:p") {
      const txt = collectText(child).trim();
      const videoMatch = /^(Video|Backup)\s+(\d+)$/.exec(txt);
      if (videoMatch) {
        let verdict: ReviewVerdict = "pending";
        for (const r of directChildren(child, "w:r")) {
          const hv = runHighlight(r);
          if (hv && hv in VERDICT) {
            verdict = VERDICT[hv];
            break;
          }
        }
        cur = {
          verdict,
          backup: videoMatch[1] === "Backup",
          topic: "",
          format: "",
          format_link: "",
          text_hook: "",
          editor_notes: "",
          shot_status: "",
          script: [],
          comments: [],
        };
        videos.push(cur);
      } else if (txt.startsWith("Client:") && !header.client) {
        header.client = txt.slice("Client:".length).trim();
      } else if (txt.startsWith("IG:") && !header.ig) {
        header.ig = txt.slice("IG:".length).trim();
      } else if (txt.startsWith("Shoot Date:") && !header.shoot && !cur) {
        header.shoot = txt.slice("Shoot Date:".length).trim();
      } else if (/^Shoot\s+\d+/.test(txt) && !header.shoot && !cur) {
        header.shoot = txt;
      }
      // Attach comment refs AFTER title detection so a comment on the title maps to it.
      attachComments(child);
    } else if (child.name === "w:tbl") {
      const rows = directChildren(child, "w:tr");
      if (!rows.length) continue;

      const cellsOf = (row: Element) => directChildren(row, "w:tc");
      const firstRowLabel = collectText(cellsOf(rows[0])[0]).trim().toUpperCase();

      // The per-video SHOT STATUS box (videographer writes, in their own words, what happened).
      if (firstRowLabel.startsWith("SHOT STATUS")) {
        const bodyCell = rows[1] ? cellsOf(rows[1])[0] : undefined;
        if (cur && bodyCell) cur.shot_status = collectText(bodyCell).trim();
        continue;
      }
      // The shoot-phase Videography Notes box (day recap) -> top-level field.
      if (firstRowLabel.startsWith("RECAP OF THE DAY") || firstRowLabel.startsWith("VIDEOGRAPHY NOTES")) {
        const bodyCell = rows[1] ? cellsOf(rows[1])[0] : undefined;
        if (bodyCell) videographyNotes = collectText(bodyCell).trim();
        continue;
      }

      attachComments(child);
      if (!cur) continue;

      const labels = rows.map((r) => collectText(cellsOf(r)[0]).trim().toUpperCase());

      if (labels.includes("TOPIC")) {
        for (const r of rows) {
          const tcs = cellsOf(r);
          if (tcs.length < 2) continue;
          const lab = collectText(tcs[0]).trim().toUpperCase();
          const val = collectText(tcs[1]).trim();
          if (lab === "TOPIC") cur.topic = val;
          else if (lab === "FORMAT") {
            cur.format = val.replace(/\s*HERE\s*$/, "").trim();
            for (const h of descendants(tcs[1], "w:hyperlink")) {
              const rid = attr(h, "r:id");
              if (rid && relTargets.has(rid)) cur.format_link = relTargets.get(rid)!;
            }
          } else if (lab === "TEXT HOOK" || lab === "TEXTHOOK") cur.text_hook = val;
        }
      } else if (firstRowLabel.startsWith("EDITOR NOTES")) {
        const bodyCell = rows[1] ? cellsOf(rows[1])[0] : undefined;
        if (bodyCell) cur.editor_notes = collectText(bodyCell).trim();
      } else if (firstRowLabel === "SCRIPT") {
        const bodyCell = rows[1] ? cellsOf(rows[1])[0] : undefined;
        if (bodyCell) {
          for (const p of directChildren(bodyCell, "w:p")) {
            const runs = directChildren(p, "w:r").filter((r) => directChildren(r, "w:t").length);
            if (!runs.length) continue;
            const segs: { who: "client" | "interviewer"; t: string }[] = [];
            for (const r of runs) {
              const t = directChildren(r, "w:t")
                .map((tEl) => (tEl.elements ?? []).filter((c) => c.type === "text").map((c) => String(c.text ?? "")).join(""))
                .join("");
              if (!t) continue;
              segs.push({ who: runIsRed(r) ? "interviewer" : "client", t });
            }
            if (!segs.length) continue;
            let lineTxt = segs.map((s) => s.t).join("").trim();
            lineTxt = lineTxt.replace(/^[●•]\s*/, "");
            const whos = new Set(segs.map((s) => s.who));
            if (whos.size === 1) cur.script.push({ who: segs[0].who, t: lineTxt });
            else cur.script.push({ runs: segs });
          }
        }
      }
    }
  }

  return {
    shoot: header.shoot,
    client: header.client,
    ig: header.ig,
    videos,
    loose_comments: looseComments,
    videography_notes: videographyNotes,
  };
}
