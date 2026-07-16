import "server-only";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ScriptDocPayload } from "@/lib/scriptDocSchema";

// The unmodified skill script, invoked in place — never copied, never edited.
const SCRIPT_PATH = path.resolve(
  process.cwd(),
  "..",
  "skills",
  "shoot-and-scale",
  "skills",
  "produce",
  "scripts",
  "build_script_doc.py"
);

// Runs a command with a hard timeout so a hung/broken interpreter can never freeze a chat turn
// forever — e.g. Windows' unconfigured "python3" doesn't run Python at all, it opens a Microsoft
// Store "app execution alias" stub that can sit there indefinitely instead of failing cleanly.
function runWithTimeout(
  bin: string,
  args: string[],
  timeoutMs: number
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn(bin, args);
    } catch (err) {
      reject(err);
      return;
    }
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill();
      reject(
        new Error(
          `"${bin}" timed out after ${timeoutMs}ms without responding — likely not a real Python interpreter (on Windows this is often the Microsoft Store "app execution alias" stub, which hangs instead of failing).`
        )
      );
    }, timeoutMs);

    proc.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

let cachedPythonBin: string | null = null;

// Finds a real, working Python interpreter regardless of OS or how PYTHON_BIN is (or isn't) set —
// this app moves between machines (dev laptops, eventually a real host), and Windows vs. macOS/Linux
// name the binary differently. Windows also has a specific trap: bare "python3" isn't Python at all
// there, it's a Microsoft Store stub. Every candidate is verified with a real, timeout-protected
// "--version" call before being trusted, so a wrong/stale env var or a platform mismatch fails fast
// with a clear error instead of hanging silently on the next real script-doc build.
async function resolvePythonBin(): Promise<string> {
  if (cachedPythonBin) return cachedPythonBin;

  const explicit = process.env.PYTHON_BIN;
  const platformDefaults =
    process.platform === "win32"
      ? ["python", "py"] // never try bare "python3" on Windows — that's the Store-alias trap
      : ["python3", "python"];
  // Try an explicit PYTHON_BIN first if set, but always fall back to the platform defaults rather
  // than hard-failing on it — a value copied from another machine's .env (e.g. a Windows "python"
  // setting reused on a Mac host) shouldn't permanently break doc generation on this one.
  const candidates = explicit ? [explicit, ...platformDefaults.filter((c) => c !== explicit)] : platformDefaults;

  const failures: string[] = [];
  for (const candidate of candidates) {
    try {
      const { code, stdout, stderr } = await runWithTimeout(candidate, ["--version"], 5_000);
      const output = `${stdout}${stderr}`;
      if (code === 0 && /Python \d/.test(output)) {
        cachedPythonBin = candidate;
        return candidate;
      }
      failures.push(`"${candidate}": exited ${code}, output "${output.trim()}"`);
    } catch (err) {
      failures.push(`"${candidate}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(
    `Couldn't find a working Python interpreter on this machine (tried: ${candidates.join(", ")}). ` +
      `Install Python 3, and/or set PYTHON_BIN in .env to its exact path, then restart the server. Details — ${failures.join("; ")}`
  );
}

// Generates the .docx into a fresh temp directory and returns its path.
// On success, caller is responsible for cleaning up that directory once done with the file.
// On failure, this function cleans up after itself (the caller never receives a path to clean).
export async function generateScriptDoc(payload: ScriptDocPayload, outputFilename: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "script-doc-"));
  try {
    const dataPath = path.join(tmpDir, "data.json");
    const outputPath = path.join(tmpDir, outputFilename);

    await fs.writeFile(dataPath, JSON.stringify(payload, null, 2), "utf-8");

    const pythonBin = await resolvePythonBin();
    const { code, stderr } = await runWithTimeout(pythonBin, [SCRIPT_PATH, dataPath, outputPath], 45_000);
    if (code !== 0) {
      throw new Error(`build_script_doc.py exited with code ${code}: ${stderr.trim()}`);
    }

    return outputPath;
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    throw err;
  }
}
