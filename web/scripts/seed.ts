// One-time, idempotent migration: clients/*.md + format-bank/*.md -> Supabase.
// Run with: npm run seed
// Does NOT touch or delete the source markdown files — this is one-directional
// (files -> Supabase). The 6 skills' own SKILL.md files are untouched by this
// script; only client data + the format bank are migrated.

import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CLIENTS_DIR = path.join(REPO_ROOT, "clients");
const FORMAT_BANK_DIR = path.join(REPO_ROOT, "format-bank");

type DocType = "snapshot" | "bullseye" | "content_analysis";

const DOC_FILES: { file: string; docType: DocType }[] = [
  { file: "Snapshot.md", docType: "snapshot" },
  { file: "Bullseye.md", docType: "bullseye" },
  { file: "Content-Analysis.md", docType: "content_analysis" },
];

function extractSandcastlesFields(snapshotContent: string) {
  const workspaceMatch = snapshotContent.match(/\*\*Workspace:\*\*\s*`([^`]+)`\s*\(`([^`]+)`\)/);
  const primaryMatch = snapshotContent.match(
    /\*\*Primary channel:\*\*\s*([^`\n]+?)\s*`[^`]*`[^\n]*?UUID\s*`([^`]+)`/
  );
  const secondaryMatch = snapshotContent.match(
    /\*\*Secondary\/mirror:\*\*\s*([^`\n]+?)\s*`[^`]*`[^\n]*?UUID\s*`([^`]+)`/
  );

  return {
    sandcastles_workspace_name: workspaceMatch?.[1]?.trim() ?? null,
    sandcastles_workspace_uuid: workspaceMatch?.[2]?.trim() ?? null,
    primary_channel_platform: primaryMatch?.[1]?.trim() ?? null,
    primary_channel_uuid: primaryMatch?.[2]?.trim() ?? null,
    secondary_channel_platform: secondaryMatch?.[1]?.trim() ?? null,
    secondary_channel_uuid: secondaryMatch?.[2]?.trim() ?? null,
  };
}

async function seedClients() {
  const entries = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true });
  const clientFolders = entries.filter((d) => d.isDirectory()).map((d) => d.name);
  const strayFiles = entries.filter((d) => !d.isDirectory()).map((d) => d.name);

  if (strayFiles.length) {
    console.warn(
      `[seed] Stray files at clients/ root (not inside a client folder, NOT migrated — review manually): ${strayFiles.join(", ")}`
    );
  }

  for (const name of clientFolders) {
    const clientDir = path.join(CLIENTS_DIR, name);
    const snapshotPath = path.join(clientDir, "Snapshot.md");

    let sandcastlesFields = {
      sandcastles_workspace_name: null as string | null,
      sandcastles_workspace_uuid: null as string | null,
      primary_channel_platform: null as string | null,
      primary_channel_uuid: null as string | null,
      secondary_channel_platform: null as string | null,
      secondary_channel_uuid: null as string | null,
    };

    if (fs.existsSync(snapshotPath)) {
      const snapshotContent = fs.readFileSync(snapshotPath, "utf-8");
      sandcastlesFields = extractSandcastlesFields(snapshotContent);
      if (!sandcastlesFields.sandcastles_workspace_uuid) {
        console.warn(
          `[seed] ${name}: could not parse a Sandcastles workspace UUID from Snapshot.md — left blank, backfill manually via Admin later.`
        );
      }
    } else {
      console.warn(`[seed] ${name}: no Snapshot.md found.`);
    }

    const { data: clientRow, error: clientError } = await supabaseAdmin
      .from("clients")
      .upsert({ name, ...sandcastlesFields }, { onConflict: "name" })
      .select("id")
      .single();

    if (clientError || !clientRow) {
      console.error(`[seed] Failed to upsert client "${name}":`, clientError);
      continue;
    }

    for (const { file, docType } of DOC_FILES) {
      const docPath = path.join(clientDir, file);
      if (!fs.existsSync(docPath)) continue;
      const content = fs.readFileSync(docPath, "utf-8");
      const { error: docError } = await supabaseAdmin
        .from("client_documents")
        .upsert({ client_id: clientRow.id, doc_type: docType, content }, { onConflict: "client_id,doc_type" });
      if (docError) {
        console.error(`[seed] Failed to upsert ${docType} for "${name}":`, docError);
      }
    }

    console.log(`[seed] Seeded client "${name}"`);
  }
}

const CATEGORY_MAP: Record<string, "games_challenges" | "educational" | "skits"> = {
  Games: "games_challenges",
  Educational: "educational",
  Skits: "skits",
};

function parseIndexTables(indexContent: string) {
  const rows: { number: number; name: string; beats: string; file: string; category: string }[] = [];
  let currentCategory: string | null = null;

  for (const line of indexContent.split("\n")) {
    if (line.startsWith("## ")) {
      if (line.includes("Games")) currentCategory = CATEGORY_MAP.Games;
      else if (line.includes("Educational")) currentCategory = CATEGORY_MAP.Educational;
      else if (line.includes("Skits")) currentCategory = CATEGORY_MAP.Skits;
      continue;
    }
    const rowMatch = line.match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (rowMatch && currentCategory) {
      const [, numStr, name, beats, fileRaw] = rowMatch;
      const fileMatch = fileRaw.match(/^([\w.-]+\.md)/);
      const file = fileMatch ? fileMatch[1] : fileRaw.trim();
      rows.push({ number: parseInt(numStr, 10), name: name.trim(), beats: beats.trim(), file, category: currentCategory });
    }
  }

  return rows;
}

function parseBrickComment(content: string) {
  const commentMatch = content.match(/<!--([\s\S]*?)-->/);
  let origin: string | null = null;
  let vettedBy: string | null = null;

  if (commentMatch) {
    const body = commentMatch[1];
    const originMatch = body.match(/origin:\s*([^·]+)/i);
    if (originMatch) origin = originMatch[1].trim();
    const vettedMatch = body.match(/vetted-by:\s*([^·\n]+)/i);
    if (vettedMatch) vettedBy = vettedMatch[1].trim();
  }

  return { origin, vettedBy };
}

async function seedFormatBank() {
  const indexPath = path.join(FORMAT_BANK_DIR, "INDEX.md");
  if (!fs.existsSync(indexPath)) {
    console.warn("[seed] format-bank/INDEX.md not found — skipping format bank seed.");
    return;
  }
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  const preamble = indexContent.split(/\n##\s/)[0];
  const { error: metaError } = await supabaseAdmin
    .from("format_bank_meta")
    .upsert({ key: "index_preamble", value: preamble }, { onConflict: "key" });
  if (metaError) console.error("[seed] Failed to upsert format_bank_meta:", metaError);

  const rows = parseIndexTables(indexContent);
  for (const row of rows) {
    const filePath = path.join(FORMAT_BANK_DIR, row.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[seed] format #${row.number} (${row.name}): file "${row.file}" not found — skipping.`);
      continue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const { origin, vettedBy } = parseBrickComment(content);
    const slug = row.file.replace(/^format-\d+-/, "").replace(/\.md$/, "");

    const { error } = await supabaseAdmin.from("format_bank").upsert(
      {
        number: row.number,
        slug,
        name: row.name,
        category: row.category,
        beats: row.beats,
        origin,
        vetted_by: vettedBy,
        content,
      },
      { onConflict: "number" }
    );

    if (error) {
      console.error(`[seed] Failed to upsert format #${row.number} (${row.name}):`, error);
    } else {
      console.log(`[seed] Seeded format #${row.number} — ${row.name}`);
    }
  }
}

async function main() {
  console.log(`[seed] Reading from ${CLIENTS_DIR} and ${FORMAT_BANK_DIR}`);
  await seedClients();
  await seedFormatBank();
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
