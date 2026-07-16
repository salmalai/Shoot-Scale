import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ScriptDocPayload } from "@/lib/scriptDocSchema";
import { buildScriptDocBuffer } from "@/lib/scriptDocGenerator";

// Generates the .docx into a fresh temp directory and returns its path.
// On success, caller is responsible for cleaning up that directory once done with the file.
// On failure, this function cleans up after itself (the caller never receives a path to clean).
export async function generateScriptDoc(payload: ScriptDocPayload, outputFilename: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "script-doc-"));
  try {
    const outputPath = path.join(tmpDir, outputFilename);
    const buffer = await buildScriptDocBuffer(payload);
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw err;
  }
}
