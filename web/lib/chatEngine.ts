import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import { skillDescriptions } from "@/lib/skillsFs";
import { listClientsFor } from "@/lib/tools/clientDocs";
import { CHAT_TOOLS, describeToolCall, executeTool } from "@/lib/chatTools";

// Tools whose call carries an explicit client_id — used to opportunistically tag a session with
// the client it turned out to be about, purely for sidebar labeling (not an access boundary).
const CLIENT_SCOPED_TOOLS = new Set([
  "read_client_doc",
  "write_client_doc",
  "list_client_files",
  "read_client_file",
  "read_sandcastles_export",
  "find_script_docs",
  "generate_and_upload_script_doc",
]);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOOL_CALLS_PER_TURN = 40;
const MAX_CONTINUATIONS_PER_TURN = 6;

const HOUSE_RULES = `
You are the Shoot & Scale content engine, running inside a web app chat instead of a terminal.

Hard rules — never violate these:
- Topics never gate. You choose topics yourself from the Bullseye's inner rings + the client's proven winners; the user never approves topics.
- Formats are bank-only. Never invent a format; always an indexed, user-approved Format Bank brick (read_format_bank_index / read_format_brick / write_format_brick).
- The Snapshot wins every tie — voice, ICP, and no-gos in the Snapshot override anything else.
- Competitor analysis is out of scope (manual only, outside this workflow).
- Approval gates come from each loaded skill's own text, not a fixed list — always stop where a skill's steps explicitly say to present something for confirmation or approval (e.g. bullseye's Step 5 "the ONE gate" for the center + ladder, create-format's "save only on approval," produce's "pitch the split (the ONE creative gate)"). The two gates that matter most across the whole pipeline are: (1) whether a winning structure becomes a saved format, (2) approving the format split before scripts are written — but don't treat that as an exhaustive list that overrides a different gate a skill names elsewhere. Conversely, don't invent a stop that isn't in the skill's text either (e.g. asking "want me to go ahead and build this?" before a drafting step the skill just expects you to do). Spending Sandcastles credits never gates — say what you're doing (e.g. "spent 1 credit analyzing this — it wasn't in the library yet") and keep going.
`.trim();

const ENVIRONMENT_NOTE = `
Environment notes — infrastructure context about THIS app, not part of any skill's own instructions, and the skills' own text is never edited to route around it. Keep this invisible to the user — don't narrate these notes at length, just act on them:
- Sandcastles IS connected for real in this app. list_workspaces, switch_workspace, analyze_video, get_video_details, and channel_recap are genuine Sandcastles calls (same tools the skills reference by these exact names) — use them exactly as each skill's own Step 0 / instructions describe. If a call fails because Sandcastles isn't connected yet, tell the user plainly to connect it from the Admin page, don't work around it.
- analyze_video spends a real credit per new video. The user has explicitly turned off the credit-spend confirmation for this app — don't stop and ask "go ahead?" before calling it; just call it when a skill's steps call for analyzing a video, and mention afterward that a credit was spent so the user stays aware. Still never call it wastefully (never re-analyze something already in the library — check with get_video_details/list first when unsure).
- For reading a client's whole already-analyzed video library (analyze's bulk performance-data step), the skill's own instructions prefer a JSON export the user uploads in chat over live MCP reads — when that's what the skill calls for, ask the user to upload the export and use read_sandcastles_export, rather than looping through get_video_details for every video.
- For /snapshot's "look in the client's folder for onboarding docs" step: call list_client_files first, then read_client_file on whatever looks relevant (call transcripts, intake forms, notes) — only ask the user to paste something if nothing useful turns up there or a file can't be read (e.g. a PDF/.docx).
- For /create-format Mode A (a video URL): call find_format_by_source with that exact URL BEFORE analyzing it. If it returns existing brick(s), tell the user plainly ("this video's already brick #NN — [Name]") and ask whether they want to refine/update that one (the skill's own "Updating an existing format" flow — same number/slug, overwrite in place) or are intentionally after a different read of it. Don't silently create a new, differently-named brick from a video that's already banked — that's how near-duplicate bricks pile up.
- /revise's "File I/O is intent, not mechanics" section names logical operations that map onto real tools here: find_latest_script_doc(client, shoot) → find_script_docs (ask which if it returns more than one); read_doc(ref) + read_comments(ref), and the scripts/read_review.py extraction step → both are one call to read_script_doc_review (pass its file_id); update_doc(ref, bytes) → generate_and_upload_script_doc with existing_file_id set to that same file_id, which overwrites the SAME Drive file in place (same name, same link) instead of creating a new one. Re-call read_script_doc_review immediately before rebuilding too (the skill's Step 5 anti-clobber re-read) — never rebuild from a copy read earlier in the conversation.
- Never claim to call a tool that isn't in your tool list.
- There's no pre-selected client for this conversation — every team member can work with every client, and one conversation can span more than one. Every client-scoped tool call (read_client_doc, write_client_doc, list_client_files, read_client_file, read_sandcastles_export, find_script_docs, generate_and_upload_script_doc) requires an explicit client_id argument every time — there's no ambient "current client" to fall back on.
- Resolving which client a message is about: match the client the user names (e.g. "for Acme", "/produce 3 for Acme") against the roster below, case-insensitively, allowing for obvious typos. If it clearly matches exactly one client, use that client's id. If earlier in this same conversation you already resolved a client and the user doesn't name a different one, keep using that same client_id. The shared Drive's clients/ folder is the only source of truth for which clients exist — you can never create a new one yourself, and the roster below is already synced from it fresh for this turn. If the name doesn't match any client on the roster, call list_clients once to re-check in case a folder was just added, and if it still doesn't match, tell the user plainly that this client doesn't exist in the shared Drive yet (a "clients/Name/" folder needs to be created there first) and ask them to confirm the exact name rather than guessing or proceeding on the wrong client.
- When the user explicitly invokes a skill with its input already given (e.g. "/create-format <url>", a pasted custom-format idea, a named client), that invocation IS the go-ahead. Run the skill's steps end-to-end in the same turn — draft, optimize, visualize, whatever it calls for — and present the finished result. Do not pause mid-skill to ask "want me to go ahead and build this?" or similar. Only stop for: (1) the 2 named pipeline gates above, or (2) a step where the skill's own text says to stop and ask THE USER something only they can answer (e.g. which of several ambiguous options they mean). A skill's language about "pitching" or "approving" a candidate before building refers to the engine surfacing options on its own initiative (e.g. multiple format candidates found during /analyze) — it does not apply when the user already explicitly requested this exact run themselves.
`.trim();

function buildSystemPrompt(clients: { id: string; name: string }[]): string {
  const roster = clients.length
    ? clients.map((c) => `- ${c.name} — client_id: ${c.id}`).join("\n")
    : "(none yet — no clients/<Name>/ folders found in the shared Drive)";

  return `${HOUSE_RULES}

Skills available (call load_skill to read one in full before following its steps):
${skillDescriptions()}

${ENVIRONMENT_NOTE}

Clients (name — client_id):
${roster}`;
}

// Silent insert failures are how history gets corrupted: a turn renders fine from the in-memory
// `messages` array, but if the DB write behind it fails without being checked, the next turn reloads
// a gappy history from priorRows — e.g. an assistant tool_use with no matching tool_result, which the
// Anthropic API then rejects outright. Every persist goes through here so a failure surfaces immediately
// instead of silently corrupting the session for next time.
async function persistMessage(sessionId: string, role: "user" | "assistant" | "tool", content: unknown) {
  const { error } = await supabaseAdmin.from("chat_messages").insert({ session_id: sessionId, role, content });
  if (error) throw new Error(`Failed to save ${role} message: ${error.message}`);
}

// A prior turn's history can still be missing a tool_result for some tool_use (an insert that failed
// before the check above existed, or a request that was interrupted mid-turn) — the Anthropic API
// rejects such a history outright. Patch it with a synthetic error result so the conversation can
// continue instead of being permanently stuck on a 400.
function repairOrphanedToolUse(messages: Anthropic.MessageParam[]) {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
    const toolUseIds = msg.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => b.id);
    if (!toolUseIds.length) continue;

    const next = messages[i + 1];
    const nextContent = next && Array.isArray(next.content) ? next.content : [];
    const satisfiedIds = new Set(
      nextContent
        .filter((b): b is Anthropic.ToolResultBlockParam => b.type === "tool_result")
        .map((b) => b.tool_use_id)
    );
    const missing = toolUseIds.filter((id) => !satisfiedIds.has(id));
    if (!missing.length) continue;

    // Honest wording: the result record being missing does NOT mean the call never ran — its side
    // effects (a Drive upload, a saved brick, a spent credit) may well have completed. Telling the
    // model to verify first, rather than asserting it "never completed," avoids prompting a blind
    // retry that duplicates work that already happened.
    const filler: Anthropic.ToolResultBlockParam[] = missing.map((id) => ({
      type: "tool_result",
      tool_use_id: id,
      content:
        "This tool call's result was lost before it could be recorded (the connection likely dropped mid-request). It may or may not have actually completed — check first (e.g. re-read the relevant doc/brick/list) before assuming it still needs to be done, to avoid duplicating it.",
      is_error: true,
    }));

    if (next && next.role === "user") {
      // Merge into the existing next message instead of inserting a brand-new one — a fresh message
      // here would sit adjacent to another user-role message (a real reply, or the "Continue exactly
      // where you left off" nudge), which the Anthropic API rejects for breaking role alternation.
      next.content = [...filler, ...(Array.isArray(next.content) ? next.content : [])];
    } else {
      // Nothing follows this assistant turn yet — safe to append a new user message.
      messages.splice(i + 1, 0, { role: "user", content: filler });
    }
  }
}

export type ChatEvent =
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "script_doc"; driveUrl: string; downloadUrl?: string; fileId: string; filename: string; videoCount: number }
  | { type: "format_brick"; number: number; name: string; driveUrl: string; fileId: string }
  | { type: "error"; message: string }
  | { type: "done" };

export async function runChatTurn({
  member,
  sessionId,
  userText,
  onEvent,
}: {
  member: CurrentMember;
  sessionId: string;
  userText: string;
  onEvent: (event: ChatEvent) => void;
}): Promise<void> {
  const { data: session } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, client_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) throw new Error("Chat session not found.");

  // Best-effort — once a tool call in this turn resolves a client, tagged onto the session below for
  // sidebar labeling and as this turn's fallback client_id. Not an access boundary.
  let sessionClientId = session.client_id as string | null;

  const clients = await listClientsFor();

  const { data: priorRows } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const messages: Anthropic.MessageParam[] = (priorRows ?? []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content as unknown as Anthropic.ContentBlockParam[],
  }));
  repairOrphanedToolUse(messages);

  const userBlock: Anthropic.ContentBlockParam[] = [{ type: "text", text: userText }];
  messages.push({ role: "user", content: userBlock });
  await persistMessage(sessionId, "user", userBlock);

  const system = buildSystemPrompt(clients);
  let toolCallCount = 0;
  let continuationCount = 0;

  while (true) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: CHAT_TOOLS,
      messages,
    });

    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });
    await persistMessage(sessionId, "assistant", assistantContent);

    const textBlocks = assistantContent.filter((b): b is Anthropic.TextBlock => b.type === "text");
    if (textBlocks.length) {
      onEvent({ type: "text", text: textBlocks.map((b) => b.text).join("\n") });
    }

    // A skill's full output (e.g. create-format's 3-niche visualization, or a produce batch) can run
    // past one turn's token ceiling. Claude Code has no such per-turn cap, so mirror that here instead
    // of silently showing a truncated response as if it were the finished answer.
    if (response.stop_reason === "max_tokens") {
      continuationCount += 1;
      if (continuationCount > MAX_CONTINUATIONS_PER_TURN) {
        onEvent({ type: "error", message: "Response kept hitting the length limit — stopping to avoid a runaway generation. Ask to continue if it looks cut off." });
        break;
      }
      const continueBlock: Anthropic.ContentBlockParam[] = [
        { type: "text", text: "Continue exactly where you left off — no repetition, no re-introduction, just the next words." },
      ];
      messages.push({ role: "user", content: continueBlock });
      await persistMessage(sessionId, "user", continueBlock);
      continue;
    }

    if (response.stop_reason !== "tool_use") break;

    const toolUses = assistantContent.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      toolCallCount += 1;
      const input = (toolUse.input ?? {}) as Record<string, unknown>;

      if (toolCallCount > MAX_TOOL_CALLS_PER_TURN) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: "Tool call limit reached for this turn. Stop and summarize for the user.",
          is_error: true,
        });
        continue;
      }

      onEvent({ type: "status", text: describeToolCall(toolUse.name, input) });

      try {
        const result = await executeTool(toolUse.name, input, {
          member,
          clientId: sessionClientId ?? undefined,
          chatSessionId: sessionId,
        });
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });

        if (!sessionClientId && CLIENT_SCOPED_TOOLS.has(toolUse.name) && typeof input.client_id === "string") {
          sessionClientId = input.client_id;
          await supabaseAdmin.from("chat_sessions").update({ client_id: sessionClientId }).eq("id", sessionId);
        }

        if (toolUse.name === "generate_and_upload_script_doc") {
          const r = result as {
            drive_url: string;
            download_url?: string;
            file_id: string;
            filename: string;
            video_count: number;
          };
          onEvent({
            type: "script_doc",
            driveUrl: r.drive_url,
            downloadUrl: r.download_url,
            fileId: r.file_id,
            filename: r.filename,
            videoCount: r.video_count,
          });
        }

        if (toolUse.name === "write_format_brick") {
          const r = result as { number: number; name: string; drive_url: string; file_id: string };
          onEvent({ type: "format_brick", number: r.number, name: r.name, driveUrl: r.drive_url, fileId: r.file_id });
        }
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: err instanceof Error ? err.message : "Tool failed.",
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
    await persistMessage(sessionId, "tool", toolResults);
  }

  onEvent({ type: "done" });
}
