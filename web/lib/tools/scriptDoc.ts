import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import { generateScriptDoc } from "@/lib/scriptDoc";
import { uploadScriptDocToDrive } from "@/lib/googleDrive";
import { ScriptDocSchema } from "@/lib/scriptDocSchema";

export async function buildAndUploadScriptDoc(
  member: CurrentMember,
  clientId: string,
  chatSessionId: string,
  rawPayload: unknown
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
  const filename = `${safeClientName} - Script Doc - ${payload.shoot_date}.docx`;

  const localPath = await generateScriptDoc(payload, filename);

  try {
    // Lands in this client's real Drive folder (clients/<Name>/scripts/), same place the repo's
    // own scripts/ convention already puts them — not the shared-drive root.
    const { fileId, driveUrl, downloadUrl } = await uploadScriptDocToDrive(localPath, filename, {
      folderPath: ["clients", clientRow.name, "scripts"],
    });

    const { error } = await supabaseAdmin.from("script_docs").insert({
      client_id: clientId,
      drive_url: driveUrl,
      drive_file_id: fileId,
      filename,
      metadata: { video_count: payload.videos.length, shoot_date: payload.shoot_date },
      chat_session_id: chatSessionId,
      created_by: member.id,
    });
    if (error) throw new Error(error.message);

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
