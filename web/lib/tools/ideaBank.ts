import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildIdeaBankBuffer } from "@/lib/ideaBankGenerator";
import { parseIdeaBank } from "@/lib/ideaBankReader";
import { uploadScriptDocToDrive, downloadDriveFileBuffer, findFileIdInFolder } from "@/lib/googleDrive";

const FILENAME = "Idea-Bank.docx";

async function clientName(clientId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.from("clients").select("name").eq("id", clientId).single();
  if (error || !data) throw new Error("Client not found.");
  return data.name;
}

// onboarding's Step 3 / produce's "honor the idea bank": read the client's Strategy/Idea-Bank.docx
// (a living Word doc, never a .md) and split it into Open ideas (not yet used) and Used ideas
// (already scripted). Returns exists:false rather than an error when the client has no idea bank
// yet — create-if-missing means that's a normal, expected state, not a failure.
export async function readIdeaBank(clientId: string) {
  const name = await clientName(clientId);
  const fileId = await findFileIdInFolder(["clients", name, "Strategy"], FILENAME);
  if (!fileId) return { exists: false as const, file_id: null, open_ideas: [], used_ideas: [] };

  const buffer = await downloadDriveFileBuffer(fileId);
  const { openIdeas, usedIdeas } = await parseIdeaBank(buffer);
  return { exists: true as const, file_id: fileId, open_ideas: openIdeas, used_ideas: usedIdeas };
}

// Whole-file rewrite, same "read it, move the used lines, save the same file" rule produce/revise
// use for the Script Doc: the caller passes the COMPLETE new open_ideas/used_ideas lists (having
// already moved a scripted idea from open to used and stamped it "Used — Shoot <N>, <date> ->
// <topic>"), and this rebuilds the doc from scratch and overwrites the same Drive file in place —
// or creates it fresh if this client has never had one (create-if-missing).
export async function updateIdeaBank(clientId: string, openIdeas: string[], usedIdeas: string[]) {
  const name = await clientName(clientId);
  const existingFileId = await findFileIdInFolder(["clients", name, "Strategy"], FILENAME);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "idea-bank-"));
  try {
    const outputPath = path.join(tmpDir, FILENAME);
    const buffer = await buildIdeaBankBuffer(name, openIdeas, usedIdeas);
    await fs.writeFile(outputPath, buffer);

    const { fileId, driveUrl } = await uploadScriptDocToDrive(outputPath, FILENAME, {
      folderPath: ["clients", name, "Strategy"],
      existingFileId,
    });

    return { file_id: fileId, drive_url: driveUrl, open_ideas: openIdeas, used_ideas: usedIdeas };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
