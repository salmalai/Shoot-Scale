import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import {
  uploadMarkdownToDrive,
  readMarkdownFromDrive,
  listFilesInDriveFolder,
  listClientFolderNames,
  readDriveFileContent,
} from "@/lib/googleDrive";

const DOC_FILENAMES: Record<DocType, string> = {
  snapshot: "Snapshot.md",
  bullseye: "Bullseye.md",
  content_analysis: "Content-Analysis.md",
};

// Every active team member can see and act on every client — access is gated by being an active
// member at all (requireMember), not by a per-client assignment. The shared Drive's clients/ folder
// is the source of truth for which clients exist: mirror any folder found there into the `clients`
// table (upsert by name, skipping existing rows so their other fields aren't clobbered), then return
// the full synced roster. This never invents a client that has no Drive folder behind it.
export async function listClientsFor() {
  const driveNames = await listClientFolderNames();
  if (driveNames.length) {
    const { error: syncError } = await supabaseAdmin
      .from("clients")
      .upsert(
        driveNames.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: true }
      );
    if (syncError) throw new Error(syncError.message);
  }

  const { data, error } = await supabaseAdmin.from("clients").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const DOC_TYPES = ["snapshot", "bullseye", "content_analysis"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export async function readClientDoc(member: CurrentMember, clientId: string, docType: DocType) {
  const { data, error } = await supabaseAdmin
    .from("client_documents")
    .select("content, version, updated_at")
    .eq("client_id", clientId)
    .eq("doc_type", docType)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data;

  // Nothing in the database yet — check whether this doc is already sitting in the client's Drive
  // folder (mirrored from the original repo, or placed there manually) before reporting it missing.
  const { data: clientRow } = await supabaseAdmin.from("clients").select("name").eq("id", clientId).single();
  if (!clientRow) return { content: null, version: 0, updated_at: null };

  const found = await readMarkdownFromDrive(["clients", clientRow.name], DOC_FILENAMES[docType]);
  if (!found) return { content: null, version: 0, updated_at: null };

  const now = new Date().toISOString();
  await supabaseAdmin.from("client_documents").upsert(
    {
      client_id: clientId,
      doc_type: docType,
      content: found.content,
      version: 1,
      updated_by: member.id,
      updated_at: now,
      drive_url: `https://drive.google.com/file/d/${found.fileId}/view`,
      drive_file_id: found.fileId,
    },
    { onConflict: "client_id,doc_type" }
  );

  return { content: found.content, version: 1, updated_at: now };
}

// Everything sitting in this client's Drive folder, minus the 3 known living docs — the pool of
// onboarding material /snapshot's Step 1 asks the model to "look for" instead of asking the user to paste.
export async function listClientFolderFiles(_member: CurrentMember, clientId: string) {
  const { data: clientRow } = await supabaseAdmin.from("clients").select("name").eq("id", clientId).single();
  if (!clientRow) return { files: [] as { name: string; mimeType: string }[] };

  const knownNames = new Set(Object.values(DOC_FILENAMES));
  const files = await listFilesInDriveFolder(["clients", clientRow.name]);
  return {
    files: files
      .filter((f) => !knownNames.has(f.name) && f.mimeType !== "application/vnd.google-apps.folder")
      .map((f) => ({ name: f.name, mimeType: f.mimeType })),
  };
}

export async function readClientFolderFile(_member: CurrentMember, clientId: string, filename: string) {
  const { data: clientRow } = await supabaseAdmin.from("clients").select("name").eq("id", clientId).single();
  // Matches listClientFolderFiles' handling of the same condition (a stale/invalid clientId) —
  // both report "not found" gracefully rather than one throwing and the sibling reporting empty.
  if (!clientRow) return { found: false as const };

  const files = await listFilesInDriveFolder(["clients", clientRow.name]);
  const match = files.find((f) => f.name === filename);
  if (!match) return { found: false as const };

  const content = await readDriveFileContent(match.id, match.mimeType);
  return { found: true as const, content };
}

type SandcastlesFields = Partial<{
  sandcastles_workspace_name: string;
  sandcastles_workspace_uuid: string;
  primary_channel_platform: string;
  primary_channel_uuid: string;
  secondary_channel_platform: string;
  secondary_channel_uuid: string;
}>;

export async function writeClientDoc(
  member: CurrentMember,
  clientId: string,
  docType: DocType,
  content: string,
  sandcastlesFields?: SandcastlesFields
) {
  const { data: clientRow, error: clientLookupError } = await supabaseAdmin
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();
  if (clientLookupError || !clientRow) throw new Error("Client not found.");

  const { data: existing } = await supabaseAdmin
    .from("client_documents")
    .select("id, version, drive_file_id")
    .eq("client_id", clientId)
    .eq("doc_type", docType)
    .maybeSingle();

  const nextVersion = (existing?.version ?? 0) + 1;

  // Mirrors this client's real Drive folder (already synced with the repo's clients/<Name>/
  // structure) — same doc, updated in place, so it's the same file a human already has open.
  const { fileId, driveUrl } = await uploadMarkdownToDrive(content, DOC_FILENAMES[docType], {
    existingFileId: existing?.drive_file_id ?? undefined,
    folderPath: ["clients", clientRow.name],
  });

  const { error } = await supabaseAdmin.from("client_documents").upsert(
    {
      client_id: clientId,
      doc_type: docType,
      content,
      version: nextVersion,
      updated_by: member.id,
      updated_at: new Date().toISOString(),
      drive_url: driveUrl,
      drive_file_id: fileId,
    },
    { onConflict: "client_id,doc_type" }
  );
  if (error) throw new Error(error.message);

  if (existing) {
    await supabaseAdmin.from("client_document_revisions").insert({
      client_document_id: existing.id,
      content,
      version: existing.version,
      created_by: member.id,
    });
  }

  const cleanSandcastlesFields = sandcastlesFields
    ? Object.fromEntries(Object.entries(sandcastlesFields).filter(([, v]) => v !== undefined && v !== ""))
    : {};

  if (docType === "snapshot" && Object.keys(cleanSandcastlesFields).length) {
    const { error: clientError } = await supabaseAdmin.from("clients").update(cleanSandcastlesFields).eq("id", clientId);
    if (clientError) throw new Error(clientError.message);
  }

  return { version: nextVersion, drive_url: driveUrl };
}
