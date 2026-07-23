import "server-only";
import JSZip from "jszip";
import { xml2js, type Element } from "xml-js";

// Pure-JS reader for Strategy/Idea-Bank.docx, matched against how build_idea_bank.py /
// ideaBankGenerator.ts lay the doc out: a title, an intro line, then "Open ideas" and "Used ideas"
// headings each followed by one paragraph per idea (or a muted placeholder when empty), then a
// footer note. Walks paragraphs in document order rather than assuming fixed indices, so a doc a
// human has lightly hand-edited (extra blank lines, reordered ideas within a section) still parses.

export type IdeaBank = { openIdeas: string[]; usedIdeas: string[] };

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

function collectText(el: Element | undefined): string {
  return descendants(el, "w:t")
    .map((t) => (t.elements ?? []).filter((c) => c.type === "text").map((c) => String(c.text ?? "")).join(""))
    .join("");
}

export async function parseIdeaBank(fileBuffer: Buffer): Promise<IdeaBank> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const documentXml = await zip.file("word/document.xml")?.async("text");
  if (!documentXml) throw new Error("Not a valid .docx file (missing word/document.xml).");

  const docTree = xml2js(documentXml, { compact: false }) as Element;
  const body = firstChild(firstChild(docTree, "w:document"), "w:body");

  const openIdeas: string[] = [];
  const usedIdeas: string[] = [];
  let section: "none" | "open" | "used" = "none";

  for (const p of directChildren(body, "w:p")) {
    const txt = collectText(p).trim();
    if (!txt) continue;

    if (txt.startsWith("Open ideas")) {
      section = "open";
      continue;
    }
    if (txt.startsWith("Used ideas")) {
      section = "used";
      continue;
    }
    if (txt.startsWith("Keep as .docx")) {
      section = "none";
      continue;
    }
    if (section === "none") continue;
    if (/^\(none yet/i.test(txt)) continue;

    const idea = txt.replace(/^[•●]\s*/, "");
    (section === "open" ? openIdeas : usedIdeas).push(idea);
  }

  return { openIdeas, usedIdeas };
}
