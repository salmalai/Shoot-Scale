import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import { generateScriptDoc } from "@/lib/scriptDoc";
import { uploadScriptDocToDrive, downloadDriveFileBuffer } from "@/lib/googleDrive";
import { ScriptDocSchema } from "@/lib/scriptDocSchema";
import { parseScriptDocReview } from "@/lib/scriptDocReview";

export async function buildAndUploadScriptDoc(
  member: CurrentMember,
  clientId: string,
  chatSessionId: string,
  rawPayload: unknown,
  existingFileId?: string
) {
  const { data: clientRow, error: clientLookupError } = await supabaseAdmin
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();
  if (clientLookupError || !clientRow) throw new Error("Client not found.");

  const parsed = ScriptDocSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new Error(`Script doc data doesn't match the expected shape: ${parsed.error.message}`);
  }
  const payload = parsed.data;

  const safeClientName = payload.client.replace(/[\\/:*?"<>|]/g, "");
  const safeShoot = payload.shoot.replace(/[\\/:*?"<>|]/g, "");
  const filename = `${safeClientName} - Scripts - ${safeShoot}.docx`;

  const localPath = await generateScriptDoc(payload, filename);

  try {
    // Lands in this client's real Drive folder (clients/<Name>/Content/<Shoot>/Scripts/), the exact
    // same shoot-scoped convention the CLI's produce skill scaffolds — e.g. "Shoot 3" or "Free Trial".
    // When existingFileId is given (the /revise "one living file" rule), this overwrites that SAME
    // file in place instead of creating a new one — the folderPath is ignored in that case.
    const { fileId, driveUrl, downloadUrl } = await uploadScriptDocToDrive(localPath, filename, {
      folderPath: ["clients", clientRow.name, "Content", safeShoot, "Scripts"],
      existingFileId,
    });

    const metadata = { video_count: payload.videos.length, shoot: payload.shoot };
    if (existingFileId) {
      const { error } = await supabaseAdmin
        .from("script_docs")
        .update({ drive_url: driveUrl, filename, metadata, chat_session_id: chatSessionId, created_by: member.id })
        .eq("drive_file_id", existingFileId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("script_docs").insert({
        client_id: clientId,
        drive_url: driveUrl,
        drive_file_id: fileId,
        filename,
        metadata,
        chat_session_id: chatSessionId,
        created_by: member.id,
      });
      if (error) throw new Error(error.message);
    }

    return {
      drive_url: driveUrl,
      download_url: downloadUrl,
      file_id: fileId,
      filename,
      video_count: payload.videos.length,
    };
  } finally {
    await fs.rm(path.dirname(localPath), { recursive: true, force: true });
  }
}

// Step 1 of /revise: "the doc is the one Script Doc in .../Scripts/. If there's more than one file
// there, ask which — never guess." Lets the model see every Script Doc on record for this client
// (optionally narrowed to one shoot) so it can disambiguate instead of guessing.
export async function findScriptDocs(clientId: string, shoot?: string) {
  const { data, error } = await supabaseAdmin
    .from("script_docs")
    .select("drive_file_id, filename, drive_url, metadata, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []).filter((r) => Boolean(r.drive_file_id));
  const matches = shoot
    ? rows.filter((r) => (r.metadata as { shoot?: string } | null)?.shoot?.toLowerCase() === shoot.toLowerCase())
    : rows;

  return {
    script_docs: matches.map((r) => ({
      file_id: r.drive_file_id as string,
      filename: r.filename,
      drive_url: r.drive_url,
      shoot: (r.metadata as { shoot?: string } | null)?.shoot ?? null,
      video_count: (r.metadata as { video_count?: number } | null)?.video_count ?? null,
      created_at: r.created_at,
    })),
  };
}

// Step 2 of /revise: pulls the doc's current bytes from Drive and runs the same parser as
// scripts/read_review.py — verdict per video (from the title's highlight color), the current
// topic/format/text_hook/editor_notes/script (reflecting any wording the client edited themselves),
// and each video's comments.
export async function readScriptDocReview(fileId: string) {
  const buffer = await downloadDriveFileBuffer(fileId);
  return parseScriptDocReview(buffer);
}
