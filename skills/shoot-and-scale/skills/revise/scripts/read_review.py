# -*- coding: utf-8 -*-
"""
Shoot & Scale — review reader for /revise.

Reads a client-annotated Script Doc (.docx) and emits the review as JSON so /revise
can act on it. It pulls, per video:
  - verdict   : from the highlight color on the "Video N" title
                green -> "approved", yellow -> "change", red -> "reject", none -> "pending"
  - topic, format, format_link, text_hook, editor_notes, script (with speaker)
  - comments  : the client's comments anchored to that video (mapped by document order)

Usage:  python read_review.py <script.docx>   ->   prints JSON to stdout

The JSON is round-trip compatible with build_script_doc.py, so /revise can read the
current (possibly client-edited) content, change only what it needs, and rebuild the
SAME doc. Note: this parser is I/O-agnostic — it works on whatever .docx bytes the
runtime hands it (Cowork mount, Drive API download, etc.).
"""
import sys, json, re
from docx import Document
from docx.oxml.ns import qn

VERDICT = {"green": "approved", "yellow": "change", "red": "reject"}
RED_HEX = {"FF0000", "C00000", "FF0001"}

def run_highlight(r):
    rPr = r.find(qn('w:rPr'))
    if rPr is None:
        return None
    h = rPr.find(qn('w:highlight'))
    return h.get(qn('w:val')) if h is not None else None

def run_is_red(r):
    rPr = r.find(qn('w:rPr'))
    if rPr is None:
        return False
    c = rPr.find(qn('w:color'))
    return c is not None and (c.get(qn('w:val')) or "").upper() in RED_HEX

def cell_text(tc):
    return "".join(t.text or "" for t in tc.iter(qn('w:t')))

def para_text(p):
    return "".join(t.text or "" for t in p.iter(qn('w:t')))

def main(path):
    doc = Document(path)
    body = doc.element.body

    # --- map comment id -> comment text (from comments.xml part) ---
    comments_txt = {}
    try:
        cpart = doc.part.package.part_related_by(
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments")
    except Exception:
        cpart = None
    # fallback: dig the part out directly
    from docx.opc.constants import RELATIONSHIP_TYPE as RT
    for rel in doc.part.rels.values():
        if rel.reltype.endswith("/comments"):
            el = rel.target_part.element
            for c in el.findall(qn('w:comment')):
                cid = c.get(qn('w:id'))
                comments_txt[cid] = "".join(t.text or "" for t in c.iter(qn('w:t'))).strip()

    header = {"client": "", "ig": "", "shoot": ""}
    videos = []
    loose_comments = []
    videography_notes = ""
    cur = None
    seen_header = False

    def walk(el, in_video):
        nonlocal cur
        # detect comment references in order and attach to current video (or loose)
        return

    # iterate block-level children (paragraphs + tables) in document order
    for child in body.iterchildren():
        tag = child.tag
        if tag == qn('w:p'):
            txt = para_text(child).strip()
            m = re.match(r"^(Video|Backup)\s+(\d+)$", txt)
            if m:
                # verdict from the title run highlight.
                # review phase: approved/change/reject. shoot phase (same colors): shot/save-for-next/killed.
                verdict = "pending"
                for r in child.iter(qn('w:r')):
                    hv = run_highlight(r)
                    if hv in VERDICT:
                        verdict = VERDICT[hv]; break
                cur = {"verdict": verdict, "backup": (m.group(1) == "Backup"),
                       "shot_status": "", "topic": "", "format": "", "format_link": "",
                       "text_hook": "", "editor_notes": "", "script": [], "comments": []}
                videos.append(cur)
            elif txt.startswith("Client:") and not header["client"]:
                header["client"] = txt.split("Client:", 1)[1].strip()
            elif txt.startswith("IG:") and not header["ig"]:
                header["ig"] = txt.split("IG:", 1)[1].strip()
            elif txt.startswith("Shoot Date:") and not header["shoot"] and cur is None:
                header["shoot"] = txt.split("Shoot Date:", 1)[1].strip()
            elif re.match(r"^Shoot\s+\d+", txt) and not header["shoot"] and cur is None:
                header["shoot"] = txt
            # attach comment refs AFTER title detection so a comment on the title maps to it
            for ref in child.iter(qn('w:commentReference')):
                cid = ref.get(qn('w:id'))
                (cur["comments"] if cur is not None else loose_comments).append(
                    {"text": comments_txt.get(cid, "")})
        elif tag == qn('w:tbl'):
            rows = child.findall(qn('w:tr'))
            if not rows:
                continue
            first = cell_text(rows[0].findall(qn('w:tc'))[0]).strip().upper()
            # the per-video SHOT STATUS box (videographer writes, in their own words, what happened)
            if first.startswith("SHOT STATUS"):
                body_cell = rows[1].findall(qn('w:tc'))[0] if len(rows) > 1 else None
                if cur is not None and body_cell is not None:
                    cur["shot_status"] = cell_text(body_cell).strip()
                continue
            # the shoot-phase Videography Notes box (day recap) -> top-level field
            if first.startswith("RECAP OF THE DAY") or first.startswith("VIDEOGRAPHY NOTES"):
                body_cell = rows[1].findall(qn('w:tc'))[0] if len(rows) > 1 else None
                if body_cell is not None:
                    videography_notes = cell_text(body_cell).strip()
                continue
            # comment refs inside the table
            for ref in child.iter(qn('w:commentReference')):
                cid = ref.get(qn('w:id'))
                entry = {"text": comments_txt.get(cid, "")}
                (cur["comments"] if cur is not None else loose_comments).append(entry)
            if cur is None:
                continue
            # fields grid: rows labelled TOPIC / FORMAT / TEXT HOOK
            labels = [cell_text(r.findall(qn('w:tc'))[0]).strip().upper() for r in rows]
            if "TOPIC" in labels:
                for r in rows:
                    tcs = r.findall(qn('w:tc'))
                    if len(tcs) < 2:
                        continue
                    lab = cell_text(tcs[0]).strip().upper()
                    val = cell_text(tcs[1]).strip()
                    if lab == "TOPIC":
                        cur["topic"] = val
                    elif lab == "FORMAT":
                        cur["format"] = re.sub(r"\s*HERE\s*$", "", val).strip()
                        # hyperlink target
                        for h in tcs[1].iter(qn('w:hyperlink')):
                            rid = h.get(qn('r:id'))
                            if rid and rid in doc.part.rels:
                                cur["format_link"] = doc.part.rels[rid].target_ref
                    elif lab in ("TEXT HOOK", "TEXTHOOK"):
                        cur["text_hook"] = val
            elif first.startswith("EDITOR NOTES"):
                body_cell = rows[1].findall(qn('w:tc'))[0] if len(rows) > 1 else None
                if body_cell is not None:
                    cur["editor_notes"] = cell_text(body_cell).strip()
            elif first == "SCRIPT":
                body_cell = rows[1].findall(qn('w:tc'))[0] if len(rows) > 1 else None
                if body_cell is not None:
                    for p in body_cell.findall(qn('w:p')):
                        runs = [r for r in p.findall(qn('w:r')) if (r.find(qn('w:t')) is not None)]
                        if not runs:
                            continue
                        segs = []
                        for r in runs:
                            t = "".join(x.text or "" for x in r.findall(qn('w:t')))
                            if not t:
                                continue
                            who = "interviewer" if run_is_red(r) else "client"
                            segs.append({"who": who, "t": t})
                        if not segs:
                            continue
                        line_txt = "".join(s["t"] for s in segs).strip()
                        # strip a leading bullet/number marker if present
                        line_txt = re.sub(r"^[●•]\s*", "", line_txt)
                        whos = {s["who"] for s in segs}
                        if len(whos) == 1:
                            cur["script"].append({"who": segs[0]["who"], "t": line_txt, "marker": ""})
                        else:
                            cur["script"].append({"runs": segs, "marker": ""})

    out = {"shoot": header["shoot"], "client": header["client"], "ig": header["ig"],
           "videos": videos, "loose_comments": loose_comments,
           "videography_notes": videography_notes}
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main(sys.argv[1])
