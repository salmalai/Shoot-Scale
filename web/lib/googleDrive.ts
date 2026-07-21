import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { google } from "googleapis";

function loadServiceAccountCredentials() {
  const inline = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  if (inline) return JSON.parse(inline);

  // Base64 is the robust way to carry a JSON secret (nested quotes, a multiline PEM key) as one env
  // var line across different .env parsers (Next.js dev vs. Node's --env-file for the npm scripts) —
  // and it's the standard shape most serverless hosts (Vercel included) expect for this kind of secret.
  const inlineBase64 = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64;
  if (inlineBase64) return JSON.parse(Buffer.from(inlineBase64, "base64").toString("utf-8"));

  const relativePath = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_PATH;
  if (!relativePath) {
    throw new Error(
      "No Google Drive service account configured (set GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64, or GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_PATH)."
    );
  }
  const resolved = path.resolve(/* turbopackIgnore: true */ process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(resolved, "utf-8"));
}

let cachedDrive: ReturnType<typeof google.drive> | null = null;

function getDriveClient() {
  if (cachedDrive) return cachedDrive;
  const credentials = loadServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

export async function uploadScriptDocToDrive(
  localFilePath: string,
  filename: string,
  opts?: { folderPath?: string[]; existingFileId?: string }
) {
  const drive = getDriveClient();
  const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  // /revise's "one living file" rule: overwrite the SAME file (same id, same link) rather than
  // creating a new one — matches uploadMarkdownToDrive's existingFileId branch for format bricks.
  if (opts?.existingFileId) {
    await drive.files.update({
      fileId: opts.existingFileId,
      media: { mimeType, body: fs.createReadStream(localFilePath) },
      supportsAllDrives: true,
    });
    const { data } = await drive.files.get({
      fileId: opts.existingFileId,
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    });
    return {
      fileId: opts.existingFileId,
      driveUrl: data.webViewLink ?? "",
      downloadUrl: data.webContentLink ?? "",
    };
  }

  const parentId = opts?.folderPath?.length
    ? await findOrCreateFolderPath(opts.folderPath)
    : process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;

  const created = await drive.files.create({
    requestBody: {
      name: filename,
      parents: parentId ? [parentId] : undefined,
    },
    media: {
      mimeType,
      body: fs.createReadStream(localFilePath),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("Drive upload did not return a file id.");

  // Link-shareable with edit access, matching the skill's review flow
  // (highlighting a video title + commenting requires edit rights, not just view).
  await drive.permissions.create({
    fileId,
    requestBody: { role: "writer", type: "anyone" },
    supportsAllDrives: true,
  });

  const { data } = await drive.files.get({
    fileId,
    fields: "id, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  return {
    fileId,
    driveUrl: data.webViewLink ?? "",
    downloadUrl: data.webContentLink ?? "",
  };
}

const folderIdCache = new Map<string, string>();

// Finds one named subfolder under a given parent, creating it once if it doesn't exist yet.
async function findOrCreateFolderUnder(parentId: string, name: string, cacheKey: string): Promise<string> {
  const cached = folderIdCache.get(cacheKey);
  if (cached) return cached;

  const drive = getDriveClient();
  const escapedName = name.replace(/'/g, "\\'");
  const { data: found } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existingId = found.files?.[0]?.id;
  if (existingId) {
    folderIdCache.set(cacheKey, existingId);
    return existingId;
  }

  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
    supportsAllDrives: true,
  });
  const newId = created.data.id;
  if (!newId) throw new Error(`Could not create the "${name}" folder in Drive.`);
  folderIdCache.set(cacheKey, newId);
  return newId;
}

// Walks a path of subfolder names from the shared drive root, e.g. ["clients", "Hugi Contreras",
// "scripts"] — creating any segment that doesn't exist yet — so saves land exactly where the
// already-Drive-synced repo structure expects them, not scattered loose at the root.
async function findOrCreateFolderPath(segments: string[]): Promise<string | undefined> {
  const root = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;
  if (!root) return undefined;

  let parentId = root;
  let cacheKey = "";
  for (const segment of segments) {
    cacheKey += `/${segment}`;
    parentId = await findOrCreateFolderUnder(parentId, segment, cacheKey);
  }
  return parentId;
}

// Read-only lookup — unlike findOrCreateFolderPath, never creates anything. Used to check whether a
// client already has a Drive folder to read from before assuming a doc doesn't exist anywhere yet.
async function findFolderPath(segments: string[]): Promise<string | undefined> {
  const root = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;
  if (!root) return undefined;
  const drive = getDriveClient();

  let parentId = root;
  let cacheKey = "";
  for (const segment of segments) {
    cacheKey += `/${segment}`;
    // Shares folderIdCache with the write path (findOrCreateFolderUnder) — a read and a write
    // resolving the same path (e.g. reading a client's folder right after writing to it) now both
    // benefit from whichever one resolved it first, instead of each redoing the same Drive calls.
    const cached = folderIdCache.get(cacheKey);
    if (cached) {
      parentId = cached;
      continue;
    }
    const escapedName = segment.replace(/'/g, "\\'");
    const { data } = await drive.files.list({
      q: `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const id = data.files?.[0]?.id;
    if (!id) return undefined;
    folderIdCache.set(cacheKey, id);
    parentId = id;
  }
  return parentId;
}

// Looks for a doc already sitting in this client's Drive folder (e.g. mirrored from the original
// repo, or placed there manually) so the chat can pick it up automatically instead of asking the
// user to paste content that's already sitting right there.
export async function readMarkdownFromDrive(
  folderPath: string[],
  filename: string
): Promise<{ fileId: string; content: string } | null> {
  const folderId = await findFolderPath(folderPath);
  if (!folderId) return null;

  const drive = getDriveClient();
  const escapedName = filename.replace(/'/g, "\\'");
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and name = '${escapedName}' and trashed = false`,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const fileId = data.files?.[0]?.id;
  if (!fileId) return null;

  const res = await drive.files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "text" });
  return { fileId, content: res.data as unknown as string };
}

// Lists whatever's actually sitting in a client's Drive folder (onboarding call transcripts, intake
// forms, notes — arbitrary filenames, not the 3 known living docs) so a skill can discover them
// instead of asking the user to paste something that's already there.
export async function listFilesInDriveFolder(
  folderPath: string[]
): Promise<{ id: string; name: string; mimeType: string }[]> {
  const folderId = await findFolderPath(folderPath);
  if (!folderId) return [];

  const drive = getDriveClient();
  const files: { id: string; name: string; mimeType: string }[] = [];
  let pageToken: string | undefined;
  // Drive's default page size (100) silently truncates a folder's contents if not paged through —
  // client folders accumulate onboarding material over the life of an engagement, so this can't
  // assume everything fits on one page.
  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    for (const f of data.files ?? []) {
      files.push({ id: f.id ?? "", name: f.name ?? "", mimeType: f.mimeType ?? "" });
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

// The shared Drive's clients/ folder is the source of truth for which clients exist — lists its
// immediate subfolder names (one per real client) so the app can mirror them into the database
// without ever inventing a client that has no Drive folder behind it. Read-only; creates nothing.
export async function listClientFolderNames(): Promise<string[]> {
  const folderId = await findFolderPath(["clients"]);
  if (!folderId) return [];

  const drive = getDriveClient();
  const names: string[] = [];
  let pageToken: string | undefined;
  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "nextPageToken, files(name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    });
    for (const f of data.files ?? []) {
      if (f.name) names.push(f.name);
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return names;
}

// Reads one file's text content by id. Google Docs get exported as plain text; already-text files
// (md/txt/json) are read directly. Binary formats (PDF, .docx, images) aren't extractable here —
// surfaces a clear error so the model falls back to asking the user, same as the skill's own fallback.
// Raw binary download — for file types readDriveFileContent can't return as text (e.g. the .docx
// Script Doc itself, which /revise needs to parse for its markup/highlight colors).
export async function downloadDriveFileBuffer(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export async function readDriveFileContent(fileId: string, mimeType: string): Promise<string> {
  const drive = getDriveClient();

  if (mimeType === "application/vnd.google-apps.document") {
    const res = await drive.files.export({ fileId, mimeType: "text/plain" }, { responseType: "text" });
    return res.data as unknown as string;
  }
  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    const res = await drive.files.get({ fileId, alt: "media", supportsAllDrives: true }, { responseType: "text" });
    return res.data as unknown as string;
  }
  throw new Error(
    `Can't read this file type directly (${mimeType}). Ask the user to paste its content, or copy it into a Google Doc / plain text file first.`
  );
}

// Uploads as a literal .md file — NOT converted into Google Docs rich text — so the format brick
// stays exactly the copy-paste-ready plain text the skill produces (brackets, dashes, mad-lib
// blanks intact), instead of Docs reflowing dashes into bullets or mangling the [bracketed] syntax.
export async function uploadMarkdownToDrive(
  content: string,
  filename: string,
  opts?: { existingFileId?: string; folderPath?: string[] }
) {
  const drive = getDriveClient();

  // Updating in place keeps the same file/link stable across revisions instead of leaving old
  // versions behind every time a format brick gets refined and re-approved.
  if (opts?.existingFileId) {
    await drive.files.update({
      fileId: opts.existingFileId,
      media: { mimeType: "text/markdown", body: Readable.from(content) },
      supportsAllDrives: true,
    });
    const { data } = await drive.files.get({
      fileId: opts.existingFileId,
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });
    return { fileId: opts.existingFileId, driveUrl: data.webViewLink ?? "" };
  }

  const parentId = opts?.folderPath?.length
    ? await findOrCreateFolderPath(opts.folderPath)
    : process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID;

  const created = await drive.files.create({
    requestBody: {
      name: filename,
      mimeType: "text/markdown",
      parents: parentId ? [parentId] : undefined,
    },
    media: {
      mimeType: "text/markdown",
      body: Readable.from(content),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("Drive upload did not return a file id.");

  await drive.permissions.create({
    fileId,
    requestBody: { role: "writer", type: "anyone" },
    supportsAllDrives: true,
  });

  const { data } = await drive.files.get({
    fileId,
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  return { fileId, driveUrl: data.webViewLink ?? "" };
}
