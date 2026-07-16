import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import { assertClientAccess } from "./clientDocs";

export const SANDCASTLES_BUCKET = "sandcastles-exports";

export async function storeSandcastlesExport(member: CurrentMember, clientId: string, file: File) {
  await assertClientAccess(member, clientId);

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON. Export it from Sandcastles as JSON and try again.");
  }

  const videoCount = Array.isArray(parsed)
    ? parsed.length
    : Array.isArray((parsed as { videos?: unknown[] })?.videos)
      ? (parsed as { videos: unknown[] }).videos.length
      : null;

  const storagePath = `${clientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(SANDCASTLES_BUCKET)
    .upload(storagePath, text, { contentType: "application/json", upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabaseAdmin
    .from("sandcastles_exports")
    .insert({ client_id: clientId, storage_path: storagePath, video_count: videoCount, uploaded_by: member.id })
    .select("id, video_count")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to record the export.");

  return data;
}

export async function readSandcastlesExport(member: CurrentMember, clientId: string, exportId?: string) {
  await assertClientAccess(member, clientId);

  const baseQuery = supabaseAdmin
    .from("sandcastles_exports")
    .select("id, storage_path, video_count, uploaded_at")
    .eq("client_id", clientId);

  const query = exportId
    ? baseQuery.eq("id", exportId)
    : baseQuery.order("uploaded_at", { ascending: false }).limit(1);

  const { data: exportRow, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!exportRow) {
    return {
      found: false,
      message:
        "No Sandcastles export has been uploaded for this client yet. Ask the user to export it as JSON from the Sandcastles web app and upload it in chat.",
    };
  }

  const { data: file, error: downloadError } = await supabaseAdmin.storage
    .from(SANDCASTLES_BUCKET)
    .download(exportRow.storage_path);
  if (downloadError || !file) throw new Error(downloadError?.message ?? "Failed to read the export file.");

  const text = await file.text();
  return {
    found: true,
    video_count: exportRow.video_count,
    uploaded_at: exportRow.uploaded_at,
    data: JSON.parse(text),
  };
}
