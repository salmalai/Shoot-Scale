import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { CurrentMember } from "@/lib/auth";
import { SKILL_NAMES, isSkillName, loadSkill, readSkillFile } from "@/lib/skillsFs";
import {
  listClientsFor,
  readClientDoc,
  writeClientDoc,
  listClientFolderFiles,
  readClientFolderFile,
  type DocType,
} from "@/lib/tools/clientDocs";
import { readFormatBankIndex, readFormatBrick, writeFormatBrick, findFormatBySource } from "@/lib/tools/formatBank";
import { readSandcastlesExport } from "@/lib/tools/sandcastles";
import { buildAndUploadScriptDoc, findScriptDocs, readScriptDocReview } from "@/lib/tools/scriptDoc";
import { readIdeaBank, updateIdeaBank } from "@/lib/tools/ideaBank";
import { callSandcastlesTool } from "@/lib/sandcastlesMcp";

const SKILL_NAME_LIST = SKILL_NAMES as unknown as string[];

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "load_skill",
    description:
      "Load the full instructions for one of the 6 Shoot & Scale skills. Always load a skill's full text before following its steps.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", enum: SKILL_NAME_LIST } },
      required: ["name"],
    },
  },
  {
    name: "read_skill_file",
    description:
      "Read a reference file inside a skill's folder (e.g. references/script-writer-prompt.md), when that skill's instructions tell you to open it.",
    input_schema: {
      type: "object",
      properties: {
        skill: { type: "string", enum: SKILL_NAME_LIST },
        path: { type: "string", description: "Path relative to the skill's folder, e.g. references/script-writer-prompt.md" },
      },
      required: ["skill", "path"],
    },
  },
  {
    name: "list_clients",
    description:
      "List every client in the system (every team member can work with every client). This re-syncs from the shared Drive's clients/ folder first, so a folder someone just added there will show up here even if it hasn't been referenced in chat before.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "read_client_doc",
    description:
      "Read one of a client's living documents (snapshot, bullseye, or content_analysis). Returns null content if it doesn't exist yet.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        doc_type: { type: "string", enum: ["snapshot", "bullseye", "content_analysis"] },
      },
      required: ["client_id", "doc_type"],
    },
  },
  {
    name: "write_client_doc",
    description:
      "Overwrite a client's living document in place. Include the full new markdown content, not a diff. When writing the snapshot and you've pinned a Sandcastles workspace/channel, also pass the sandcastles_* fields.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        doc_type: { type: "string", enum: ["snapshot", "bullseye", "content_analysis"] },
        content: { type: "string" },
        sandcastles_workspace_name: { type: "string" },
        sandcastles_workspace_uuid: { type: "string" },
        primary_channel_platform: { type: "string" },
        primary_channel_uuid: { type: "string" },
        secondary_channel_platform: { type: "string" },
        secondary_channel_uuid: { type: "string" },
      },
      required: ["client_id", "doc_type", "content"],
    },
  },
  {
    name: "list_client_files",
    description:
      "List whatever's sitting in this client's Drive folder beyond the 3 known living docs (Snapshot/Bullseye/Content-Analysis) — onboarding call transcripts, intake forms, notes, etc. Use this for /snapshot's 'look for onboarding materials' step before asking the user to paste anything.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string" } },
    },
  },
  {
    name: "read_client_file",
    description:
      "Read one file's text content from the client's Drive folder by exact filename (from list_client_files). Google Docs and plain text/markdown/JSON files work; PDFs, .docx, and images can't be read this way — fall back to asking the user to paste the content.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string" }, filename: { type: "string" } },
      required: ["filename"],
    },
  },
  {
    name: "read_format_bank_index",
    description: "Read the Format Bank index: every format brick's number, name, category, beats, and vetting status.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "find_format_by_source",
    description:
      "Check whether a video URL has already been turned into a Format Bank brick. Call this FIRST for /create-format Mode A (URL-based), before analyzing — if it already has one or more bricks, tell the user and offer to update/refine the existing one (per create-format's 'Updating an existing format' flow) instead of silently banking a near-duplicate with a new name.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "read_format_brick",
    description: "Read one format brick's full content by number or slug. Always do this before writing a script in that format.",
    input_schema: {
      type: "object",
      properties: { number: { type: "integer" }, slug: { type: "string" } },
    },
  },
  {
    name: "write_format_brick",
    description:
      "Save a new or updated format brick to the Format Bank, only after the user has approved it as repeatable. Omit `number` to append as the next number.",
    input_schema: {
      type: "object",
      properties: {
        number: { type: "integer" },
        slug: { type: "string" },
        name: { type: "string" },
        category: { type: "string", enum: ["games_challenges", "educational", "skits"] },
        beats: { type: "string" },
        origin: { type: "string" },
        content: { type: "string" },
      },
      required: ["slug", "name", "category", "content"],
    },
  },
  {
    name: "read_sandcastles_export",
    description:
      "Read the most recently uploaded Sandcastles JSON export for a client (or a specific export_id). This is the substitute for live Sandcastles video-performance calls in this app. Returns found:false if none has been uploaded yet.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string" }, export_id: { type: "string" } },
      required: ["client_id"],
    },
  },
  {
    name: "find_script_docs",
    description:
      "List the Script Docs on record for a client (optionally narrowed to one shoot), each with its file_id, filename, Drive link, and shoot label. This is /revise's Step 1 (\"find the doc — if there's more than one file, ask which, never guess\") and also how you get the existing file_id to pass as existing_file_id when rebuilding a doc in place.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string" }, shoot: { type: "string" } },
      required: ["client_id"],
    },
  },
  {
    name: "read_script_doc_review",
    description:
      "Read a Script Doc's current state straight from its Drive bytes: per video, the verdict from the title's highlight (approved/change/reject/pending), whether it's a backup (filed under BACKUP SCRIPTS), the current topic/format/format_link/text_hook/editor_notes/script (reflecting anything the client edited themselves), the videographer's shot_status note, and that video's comments (plus any loose/unanchored comments and the doc-level videography_notes recap). This is /revise's Step 2 — the exact same extraction scripts/read_review.py does, just running in-app. Always call this immediately before acting AND immediately before rebuilding (Step 5's anti-clobber re-read), never rely on a stale copy from earlier in the conversation.",
    input_schema: {
      type: "object",
      properties: { file_id: { type: "string" } },
      required: ["file_id"],
    },
  },
  {
    name: "generate_and_upload_script_doc",
    description:
      "Build the branded Script Doc .docx for a batch of scripts and upload it to Google Drive, returning a shareable link. Only call this after the format split is approved (gate 3) and every script is written and hook-graded — this is the final step of /produce. Provide the exact data shape build_script_doc.py expects: one entry per video, script lines tagged by speaker (client=black, interviewer=red). `shoot` MUST be the exact shoot the user confirmed in Step 0 of /produce — e.g. \"Shoot 3\" or \"Free Trial\" — never invent or default it; it becomes both the doc's big header and the Drive folder it's filed under (clients/<Client>/Content/<shoot>/Scripts/), so a wrong value here misfiles the doc. For /revise (Step 5), pass `existing_file_id` (from find_script_docs) to overwrite that SAME file in place — same name, same link — instead of creating a new one; omit it only when this is a genuinely new batch. Each video gets a SHOT STATUS box (leave `shot_status` blank when producing — that's the videographer's field, filled after the shoot) and a doc-level `videography_notes` recap box (also leave blank when producing). Set `backup: true` on any video that should file under the BACKUP SCRIPTS section instead of the main numbered list. Set `verdict: \"approved\"` to keep a video's title highlighted green (e.g. when /revise rebuilds and a video wasn't touched).",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        existing_file_id: { type: "string" },
        shoot: { type: "string" },
        client: { type: "string" },
        ig: { type: "string" },
        videography_notes: { type: "string" },
        videos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topic: { type: "string" },
              format: { type: "string" },
              format_link: { type: "string" },
              text_hook: { type: "string" },
              editor_notes: { type: "string" },
              shot_status: { type: "string" },
              backup: { type: "boolean" },
              verdict: { type: "string" },
              script: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    who: { type: "string", enum: ["client", "interviewer"] },
                    t: { type: "string" },
                    runs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          who: { type: "string", enum: ["client", "interviewer"] },
                          t: { type: "string" },
                        },
                        required: ["who", "t"],
                      },
                    },
                  },
                },
              },
            },
            required: ["topic", "format", "text_hook"],
          },
        },
      },
      required: ["client_id", "shoot", "client", "videos"],
    },
  },
  {
    name: "read_idea_bank",
    description:
      "Read a client's Idea Bank (Strategy/Idea-Bank.docx) — client-sent \"make a video like this\" ideas split into open_ideas (not yet used) and used_ideas (already scripted, never reuse). Returns exists:false with empty lists if the client has no idea bank yet (create-if-missing — that's normal for a brand-new client, not an error). Call this before /produce pitches a batch (honor open ideas) and whenever a new client idea needs logging.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string" } },
      required: ["client_id"],
    },
  },
  {
    name: "update_idea_bank",
    description:
      "Overwrite a client's Idea Bank in place with the COMPLETE new open_ideas and used_ideas lists (whole-file rewrite, not a diff) — same rule as the Script Doc. Read the current state with read_idea_bank first, then pass back every idea in its correct list: moving a newly-scripted idea out of open_ideas into used_ideas, stamped e.g. \"<original idea text> — Used — Shoot 3, 2026-07-24 -> Topic Name\". Creates Strategy/Idea-Bank.docx fresh if this client doesn't have one yet.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        open_ideas: { type: "array", items: { type: "string" } },
        used_ideas: { type: "array", items: { type: "string" } },
      },
      required: ["client_id", "open_ideas", "used_ideas"],
    },
  },
  {
    name: "list_workspaces",
    description:
      "Lists all Sandcastles workspaces the connected account has access to, including which one is currently active. Real Sandcastles call — does not consume credits.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "switch_workspace",
    description:
      "Switches the active Sandcastles workspace. All subsequent Sandcastles calls operate against the new workspace. Use list_workspaces first if you don't know the target workspace's UUID. Real Sandcastles call — does not consume credits.",
    input_schema: {
      type: "object",
      properties: { workspace_uuid: { type: "string" } },
      required: ["workspace_uuid"],
    },
  },
  {
    name: "analyze_video",
    description:
      "Analyzes a single video (TikTok, Instagram, or YouTube Shorts URL) to extract its hook, format, narrative structure, topic, and other components. Real Sandcastles call — consumes one analysis credit per NEW video (free if already analyzed/in the workspace library). Never call this just to re-read something already analyzed; never call it without the user's awareness per the skills' credit-gate rules.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" }, video_uuid: { type: "string" } },
    },
  },
  {
    name: "get_video_details",
    description:
      "Returns the full payload for a single Sandcastles video by UUID, including the complete analysis if it's already been analyzed in the current workspace. Does not trigger analysis or consume credits — use analyze_video for that.",
    input_schema: {
      type: "object",
      properties: { video_uuid: { type: "string" } },
      required: ["video_uuid"],
    },
  },
  {
    name: "channel_recap",
    description:
      "Returns recent videos from a single channel plus channel-level stats, for synthesizing a brief on what the channel has been doing and how it's performing. Input is a channel UUID, handle, or URL.",
    input_schema: {
      type: "object",
      properties: {
        channel: { type: "string" },
        limit: { type: "integer" },
        lookback_days: { type: "integer" },
      },
      required: ["channel"],
    },
  },
  {
    name: "generate_insight",
    description:
      "Answers a natural-language question about what's working across the client's analyzed videos and watchlist — a headline, a narrative, typed sections, and video references. Use for open analytical questions (\"what's working,\" \"what should I make next,\" \"why are my educational videos outperforming\") — not for finding specific videos (search_my_videos/search_all_videos) or single-dimension rankings (top_topics/top_hooks/top_formats). No credit cost; read-only. Beta — if Sandcastles reports it's admin-only for this account, say so plainly and suggest another tool instead of retrying.",
    input_schema: {
      type: "object",
      properties: { question: { type: "string" } },
      required: ["question"],
    },
  },
  {
    name: "get_personal_analytics",
    description:
      "Returns the connected Sandcastles account's personal analytics dashboard — stats, charts, recent videos, an audit, and recommendations — plus up to 12 historical reports for time-travel. Omit report_uuid for the latest; pass one from a prior response's other_reports to revisit an older report. Always call fresh when asked, don't reuse a stale answer. No credit cost.",
    input_schema: {
      type: "object",
      properties: { report_uuid: { type: "string" } },
    },
  },
];

export function describeToolCall(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "load_skill":
      return `Loading the ${input.name} skill…`;
    case "read_skill_file":
      return `Reading ${input.path}…`;
    case "list_clients":
      return "Checking the client list…";
    case "read_client_doc":
      return `Reading ${input.doc_type}…`;
    case "write_client_doc":
      return `Updating ${input.doc_type}…`;
    case "list_client_files":
      return "Checking what's in the client's Drive folder…";
    case "read_client_file":
      return `Reading ${input.filename}…`;
    case "read_format_bank_index":
      return "Checking the Format Bank…";
    case "find_format_by_source":
      return "Checking if this video already has a banked format…";
    case "read_format_brick":
      return `Reading format #${input.number ?? input.slug}…`;
    case "write_format_brick":
      return "Saving the format brick and backing it up to Drive…";
    case "read_sandcastles_export":
      return "Reading the uploaded Sandcastles export…";
    case "find_script_docs":
      return "Finding the client's Script Docs…";
    case "read_script_doc_review":
      return "Reading the marked-up Script Doc…";
    case "generate_and_upload_script_doc":
      return input.existing_file_id ? "Rebuilding the Script Doc in place…" : "Building the Script Doc and uploading it to Drive…";
    case "read_idea_bank":
      return "Reading the Idea Bank…";
    case "update_idea_bank":
      return "Updating the Idea Bank…";
    case "list_workspaces":
      return "Listing Sandcastles workspaces…";
    case "switch_workspace":
      return "Switching Sandcastles workspace…";
    case "analyze_video":
      return "Analyzing the video in Sandcastles…";
    case "get_video_details":
      return "Reading the video's Sandcastles details…";
    case "channel_recap":
      return "Pulling a Sandcastles channel recap…";
    case "generate_insight":
      return "Asking Sandcastles for an insight…";
    case "get_personal_analytics":
      return "Pulling the Sandcastles analytics dashboard…";
    default:
      return `Running ${name}…`;
  }
}

// Every client-scoped tool call must name its client explicitly (via input.client_id) — there's no
// dropdown-selected "current client" anymore, since one conversation can span several clients.
function resolveClientId(input: Record<string, unknown>, ctx: { clientId?: string }): string {
  const clientId = (input.client_id as string | undefined) || ctx.clientId;
  if (!clientId) {
    throw new Error("client_id is required — call list_clients first to resolve which client this is for.");
  }
  return clientId;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: { member: CurrentMember; clientId?: string; chatSessionId: string }
): Promise<unknown> {
  switch (name) {
    case "load_skill": {
      const skillName = String(input.name ?? "");
      if (!isSkillName(skillName)) throw new Error("Unknown skill name.");
      return { content: loadSkill(skillName) };
    }
    case "read_skill_file": {
      const skillName = String(input.skill ?? "");
      if (!isSkillName(skillName)) throw new Error("Unknown skill name.");
      return { content: readSkillFile(skillName, String(input.path ?? "")) };
    }
    case "list_clients":
      return { clients: await listClientsFor() };
    case "read_client_doc":
      return await readClientDoc(ctx.member, resolveClientId(input, ctx), input.doc_type as DocType);
    case "write_client_doc": {
      const result = await writeClientDoc(
        ctx.member,
        resolveClientId(input, ctx),
        input.doc_type as DocType,
        String(input.content ?? ""),
        {
          sandcastles_workspace_name: input.sandcastles_workspace_name as string | undefined,
          sandcastles_workspace_uuid: input.sandcastles_workspace_uuid as string | undefined,
          primary_channel_platform: input.primary_channel_platform as string | undefined,
          primary_channel_uuid: input.primary_channel_uuid as string | undefined,
          secondary_channel_platform: input.secondary_channel_platform as string | undefined,
          secondary_channel_uuid: input.secondary_channel_uuid as string | undefined,
        }
      );
      return { ok: true, ...result };
    }
    case "list_client_files":
      return await listClientFolderFiles(ctx.member, resolveClientId(input, ctx));
    case "read_client_file":
      return await readClientFolderFile(ctx.member, resolveClientId(input, ctx), String(input.filename ?? ""));
    case "read_format_bank_index":
      return { content: await readFormatBankIndex() };
    case "find_format_by_source":
      return await findFormatBySource(String(input.url ?? ""));
    case "read_format_brick":
      return await readFormatBrick({
        number: input.number as number | undefined,
        slug: input.slug as string | undefined,
      });
    case "write_format_brick":
      return await writeFormatBrick(ctx.member, {
        number: input.number as number | undefined,
        slug: String(input.slug ?? ""),
        name: String(input.name ?? ""),
        category: input.category as "games_challenges" | "educational" | "skits",
        beats: input.beats as string | undefined,
        origin: input.origin as string | undefined,
        content: String(input.content ?? ""),
      });
    case "read_sandcastles_export":
      return await readSandcastlesExport(ctx.member, resolveClientId(input, ctx), input.export_id as string | undefined);
    case "find_script_docs":
      return await findScriptDocs(resolveClientId(input, ctx), input.shoot as string | undefined);
    case "read_script_doc_review":
      return await readScriptDocReview(String(input.file_id ?? ""));
    case "generate_and_upload_script_doc":
      return await buildAndUploadScriptDoc(
        ctx.member,
        resolveClientId(input, ctx),
        ctx.chatSessionId,
        input,
        input.existing_file_id as string | undefined
      );
    case "read_idea_bank":
      return await readIdeaBank(resolveClientId(input, ctx));
    case "update_idea_bank":
      return await updateIdeaBank(
        resolveClientId(input, ctx),
        (input.open_ideas as string[] | undefined) ?? [],
        (input.used_ideas as string[] | undefined) ?? []
      );
    case "list_workspaces":
      return await callSandcastlesTool("list_workspaces", {});
    case "switch_workspace":
      return await callSandcastlesTool("switch_workspace", { workspace_uuid: input.workspace_uuid });
    case "analyze_video":
      return await callSandcastlesTool("analyze_video", { url: input.url ?? null, video_uuid: input.video_uuid ?? null });
    case "get_video_details":
      return await callSandcastlesTool("get_video_details", { video_uuid: input.video_uuid });
    case "channel_recap":
      return await callSandcastlesTool("channel_recap", {
        channel: input.channel,
        limit: input.limit,
        lookback_days: input.lookback_days,
      });
    case "generate_insight":
      return await callSandcastlesTool("generate_insight", { question: input.question ?? "" });
    case "get_personal_analytics":
      return await callSandcastlesTool("get_personal_analytics", { report_uuid: input.report_uuid ?? null });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
