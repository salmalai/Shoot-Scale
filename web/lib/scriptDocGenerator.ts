import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  BorderStyle,
  Document,
  ExternalHyperlink,
  HighlightColor,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
  type IShadingAttributesProperties,
  type ITableCellBorders,
} from "docx";
import type { ScriptDocPayload } from "@/lib/scriptDocSchema";

// Pure-JS reimplementation of the skill's build_script_doc.py, byte-for-byte matched section by
// section against that script. Runs anywhere Node runs (incl. serverless) — no Python, no
// child_process. build_script_doc.py itself is left untouched for anyone still invoking it by hand.
const ASSETS_DIR = path.join(process.cwd(), "assets", "script-doc");
const LOGO = fs.readFileSync(path.join(ASSETS_DIR, "logo.png"));
const COMMENT_HELP = fs.readFileSync(path.join(ASSETS_DIR, "comment_help.png"));

// Native pixel size of each asset, measured once from the PNG itself — used to scale to a target
// width while preserving aspect ratio (docx, unlike python-docx, requires an explicit height).
const LOGO_NATIVE = { width: 403, height: 188 };
const COMMENT_HELP_NATIVE = { width: 620, height: 230 };

const RED = "FF0000";
const BLACK = "000000";
const LABEL_GRAY = "333333";
const LABEL_FILL = "EDEDED";
const NOTE_FILL = "F4F7FB";
const BORDER_COLOR = "C7C7C7";
const LINK_BLUE = "0563C1";

const twip = (inches: number) => Math.round(inches * 1440);
const spacingPt = (pts: number) => pts * 20; // w:spacing values are twentieths of a point
const halfPt = (pts: number) => pts * 2; // w:sz values are half-points
const pxAtWidth = (native: { width: number; height: number }, widthIn: number) => {
  const width = Math.round(widthIn * 96);
  const height = Math.round((width * native.height) / native.width);
  return { width, height };
};

function shade(hex: string): IShadingAttributesProperties {
  return { fill: hex, color: "auto", type: ShadingType.CLEAR };
}

function cellBorders(color = BORDER_COLOR, size = 6): ITableCellBorders {
  const edge = { style: BorderStyle.SINGLE, size, color };
  return { top: edge, bottom: edge, left: edge, right: edge };
}

function fixedTable(rows: TableRow[], widthsIn: number[]) {
  return new Table({
    rows,
    layout: "fixed" as const,
    width: { size: twip(widthsIn.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
    columnWidths: widthsIn.map(twip),
  });
}

function hyperlinkRun(url: string, text: string) {
  return new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({
        text,
        bold: true,
        color: LINK_BLUE,
        size: halfPt(11),
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
  });
}

type Run = { text: string; bold?: boolean; color?: string; highlight?: string };

function instructionLine(runs: Run[], opts: { spaceAfter?: number; bullet?: boolean } = {}) {
  const { spaceAfter = 3, bullet = false } = opts;
  return new Paragraph({
    spacing: { after: spacingPt(spaceAfter), before: spacingPt(2) },
    indent: bullet ? { left: twip(0.18) } : undefined,
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold ?? false,
          size: halfPt(10),
          color: r.color,
          highlight: r.highlight as (typeof HighlightColor)[keyof typeof HighlightColor] | undefined,
        })
    ),
  });
}

function spacer(pts = 6) {
  return new Paragraph({ spacing: { after: spacingPt(pts), before: spacingPt(0) } });
}

function labelValueCell(label: string, opts: { widthIn: number; fill: string }) {
  return new TableCell({
    width: { size: twip(opts.widthIn), type: WidthType.DXA },
    shading: shade(opts.fill),
    borders: cellBorders(),
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { after: spacingPt(2), before: spacingPt(2) },
        children: [new TextRun({ text: label, bold: true, size: halfPt(9.5), color: LABEL_GRAY })],
      }),
    ],
  });
}

function fieldsGrid(topic: string, format: string, formatLink: string | undefined, textHook: string) {
  const rows = [
    { label: "TOPIC", value: topic, link: undefined as string | undefined },
    { label: "FORMAT", value: format, link: formatLink },
    { label: "TEXT HOOK", value: textHook, link: undefined as string | undefined },
  ];

  const tableRows = rows.map(({ label, value, link }) => {
    const valueChildren: (TextRun | ExternalHyperlink)[] = [];
    if (value) valueChildren.push(new TextRun({ text: value, size: halfPt(11) }));
    if (link) {
      if (value) valueChildren.push(new TextRun({ text: "  ", size: halfPt(11) }));
      valueChildren.push(hyperlinkRun(link, "HERE"));
    }
    const valueCell = new TableCell({
      width: { size: twip(5.25), type: WidthType.DXA },
      shading: shade("FFFFFF"),
      borders: cellBorders(),
      children: [new Paragraph({ spacing: { after: spacingPt(2), before: spacingPt(2) }, children: valueChildren })],
    });
    return new TableRow({ children: [labelValueCell(label, { widthIn: 1.25, fill: LABEL_FILL }), valueCell] });
  });

  return fixedTable(tableRows, [1.25, 5.25]);
}

type ScriptLine = ScriptDocPayload["videos"][number]["script"] extends (infer L)[] | undefined ? L : never;

function scriptLineParagraph(item: ScriptLine) {
  const runs: Run[] =
    "runs" in item
      ? item.runs.map((r) => ({ text: r.t, color: r.who === "interviewer" ? RED : BLACK }))
      : [{ text: item.t, color: item.who === "interviewer" ? RED : BLACK }];

  return new Paragraph({
    indent: { left: twip(0.18) },
    spacing: { after: spacingPt(4) },
    children: [
      new TextRun({ text: "●  ", size: halfPt(11), color: BLACK }),
      ...runs.map((r) => new TextRun({ text: r.text, size: halfPt(11), color: r.color })),
    ],
  });
}

function boxedSection(title: string, opts: { text?: string | null; lines?: ScriptLine[] | null; blank?: number }) {
  const { text, lines, blank = 2 } = opts;

  const headerCell = new TableCell({
    width: { size: twip(6.5), type: WidthType.DXA },
    shading: shade(LABEL_FILL),
    borders: cellBorders(),
    children: [
      new Paragraph({
        spacing: { after: spacingPt(2), before: spacingPt(2) },
        children: [new TextRun({ text: title, bold: true, size: halfPt(9.5), color: LABEL_GRAY })],
      }),
    ],
  });

  let bodyChildren: Paragraph[];
  if (lines && lines.length) {
    bodyChildren = lines.map(scriptLineParagraph);
  } else if (text) {
    bodyChildren = [new Paragraph({ spacing: { after: spacingPt(3) }, children: [new TextRun({ text, size: halfPt(11) })] })];
  } else {
    bodyChildren = Array.from({ length: Math.max(blank, 1) }, () => new Paragraph({ spacing: { after: spacingPt(3) } }));
  }

  const bodyCell = new TableCell({
    width: { size: twip(6.5), type: WidthType.DXA },
    borders: cellBorders(),
    children: bodyChildren,
  });

  return fixedTable([new TableRow({ children: [headerCell] }), new TableRow({ children: [bodyCell] })], [6.5]);
}

export async function buildScriptDocBuffer(payload: ScriptDocPayload): Promise<Buffer> {
  const logoSize = pxAtWidth(LOGO_NATIVE, 2.0);
  const commentSize = pxAtWidth(COMMENT_HELP_NATIVE, 2.9);

  const children: (Paragraph | Table)[] = [];

  // Top: logo + legend
  const legendCell = new TableCell({
    width: { size: twip(2.2), type: WidthType.DXA },
    shading: shade("FFFFFF"),
    borders: cellBorders(),
    children: [
      new Paragraph({
        spacing: { after: spacingPt(1), before: spacingPt(1) },
        children: [new TextRun({ text: "LEGEND", bold: true, size: halfPt(8), color: LABEL_GRAY })],
      }),
      new Paragraph({
        spacing: { after: spacingPt(1), before: spacingPt(1) },
        children: [
          new TextRun({ text: "Black", bold: true, size: halfPt(8.5) }),
          new TextRun({ text: " = what the client says", size: halfPt(8.5) }),
        ],
      }),
      new Paragraph({
        spacing: { after: spacingPt(1), before: spacingPt(1) },
        children: [
          new TextRun({ text: "Red", bold: true, size: halfPt(8.5), color: RED }),
          new TextRun({ text: " = what the interviewer says", size: halfPt(8.5), color: RED }),
        ],
      }),
    ],
  });
  const logoCell = new TableCell({
    width: { size: twip(4.3), type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new ImageRun({ type: "png", data: LOGO, transformation: logoSize })],
      }),
    ],
  });
  children.push(fixedTable([new TableRow({ children: [logoCell, legendCell] })], [4.3, 2.2]));
  children.push(spacer(2));

  // Cyan header
  for (const [label, value] of [
    ["Shoot Date:", payload.shoot_date],
    ["Client:", payload.client],
    ["IG:", payload.ig ?? ""],
  ]) {
    children.push(
      new Paragraph({
        spacing: { after: spacingPt(0) },
        children: [
          new TextRun({
            text: `${label} ${value}`.trim(),
            bold: true,
            size: halfPt(13),
            highlight: HighlightColor.CYAN,
          }),
        ],
      })
    );
  }
  children.push(spacer(6));

  // Instructions box
  const instructionsHeader = new TableCell({
    width: { size: twip(6.5), type: WidthType.DXA },
    shading: shade(LABEL_FILL),
    borders: cellBorders(),
    children: [
      new Paragraph({
        spacing: { after: spacingPt(2), before: spacingPt(2) },
        children: [new TextRun({ text: "HOW TO REVIEW THIS DOC", bold: true, size: halfPt(10), color: LABEL_GRAY })],
      }),
    ],
  });
  const instructionsBody = new TableCell({
    width: { size: twip(6.5), type: WidthType.DXA },
    shading: shade(NOTE_FILL),
    borders: cellBorders(),
    children: [
      instructionLine([
        { text: "Each video starts " },
        { text: "pending", bold: true },
        { text: " (no highlight). Read it and tweak the wording so it sounds like something " },
        { text: "you'd", bold: true },
        { text: " actually say. Then " },
        { text: "highlight the Video title", bold: true },
        { text: " to tell us your call:" },
      ]),
      instructionLine(
        [
          { text: "● " },
          { text: "Approved", bold: true, color: BLACK, highlight: HighlightColor.GREEN },
          { text: "  — happy with the format, topic, and script." },
        ],
        { bullet: true }
      ),
      instructionLine(
        [
          { text: "● " },
          { text: "Remix", bold: true, color: BLACK, highlight: HighlightColor.YELLOW },
          { text: "  — like part of it; want us to change something (e.g. keep the format, new topic). Tell us in a comment." },
        ],
        { bullet: true }
      ),
      instructionLine(
        [
          { text: "● " },
          { text: "Reject", bold: true, color: BLACK, highlight: HighlightColor.RED },
          { text: "  — scrap it; we'll bring a brand-new idea." },
        ],
        { bullet: true }
      ),
      instructionLine(
        [
          { text: "To request a change or leave any note, highlight the text and click the " },
          { text: "comment button", bold: true },
          { text: " (shown below)." },
        ],
        { spaceAfter: 4 }
      ),
      new Paragraph({
        spacing: { after: spacingPt(4) },
        children: [new ImageRun({ type: "png", data: COMMENT_HELP, transformation: commentSize })],
      }),
    ],
  });
  children.push(
    fixedTable(
      [new TableRow({ children: [instructionsHeader] }), new TableRow({ children: [instructionsBody] })],
      [6.5]
    )
  );

  // One video per page
  payload.videos.forEach((video, index) => {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { before: spacingPt(2), after: spacingPt(6) },
        children: [new TextRun({ text: `Video ${index + 1}`, bold: true, size: halfPt(16) })],
      })
    );
    children.push(fieldsGrid(video.topic, video.format, video.format_link, video.text_hook));
    children.push(spacer(4));
    children.push(boxedSection("EDITOR NOTES", { text: video.editor_notes || null, blank: 2 }));
    children.push(spacer(4));
    children.push(boxedSection("SCRIPT", { lines: video.script ?? null, blank: 6 }));
  });

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: halfPt(11) } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: twip(0.8), bottom: twip(0.8), left: twip(1), right: twip(1) },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
