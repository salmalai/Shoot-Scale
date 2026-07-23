import "server-only";
import { Document, Packer, Paragraph, TextRun } from "docx";

// Pure-JS reimplementation of the onboarding skill's scripts/build_idea_bank.py, matched section by
// section against that script's paragraph shape (title / body / head / muted / foot) so a doc built
// here and one built by the Python script read identically. build_idea_bank.py itself is untouched.

const CYAN = "008CBA";
const GREY = "666666";

export const OPEN_HEADING = "Open ideas (not yet used)";
export const USED_HEADING = "Used ideas (already scripted — do not reuse)";
const FOOTER = "Keep as .docx — don’t convert to a Google Doc.";

function line(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold ?? false,
        italics: opts.italic ?? false,
        size: (opts.size ?? 11) * 2,
        color: opts.color,
      }),
    ],
  });
}

function ideaLine(text: string) {
  return line(`•  ${text}`, { size: 11 });
}

export async function buildIdeaBankBuffer(client: string, openIdeas: string[], usedIdeas: string[]): Promise<Buffer> {
  const children: Paragraph[] = [
    line(`${client} — Idea Bank`, { bold: true, size: 20, color: CYAN }),
    line(
      "Paste new ideas under Open ideas (link + a note). /produce uses each once, then moves it to Used ideas — never reused.",
      {}
    ),
    line(OPEN_HEADING, { bold: true, size: 14 }),
    ...(openIdeas.length ? openIdeas.map(ideaLine) : [line("(none yet — paste them here)", { italic: true, color: GREY })]),
    line(USED_HEADING, { bold: true, size: 14 }),
    ...(usedIdeas.length ? usedIdeas.map(ideaLine) : [line("(none yet)", { italic: true, color: GREY })]),
    line(FOOTER, { italic: true, size: 9, color: GREY }),
  ];

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
