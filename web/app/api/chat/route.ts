export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { runChatTurn, type ChatEvent } from "@/lib/chatEngine";

function titleFromMessage(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 60)}…` : oneLine;
}

export async function POST(request: Request) {
  const member = await requireMember();
  const body = await request.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "");
  const message = String(body?.message ?? "");

  if (!sessionId || !message.trim()) {
    return Response.json({ error: "sessionId and message are required." }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, title")
    .eq("id", sessionId)
    .eq("team_member_id", member.id)
    .maybeSingle();
  if (!session) {
    return Response.json({ error: "Chat session not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        await runChatTurn({ member, sessionId, userText: message, onEvent: send });
        // Only bump title/updated_at once the turn actually succeeded — doing this beforehand left a
        // "ghost" session (a real title, sorted to the top of the sidebar) with zero saved messages
        // whenever the turn failed before anything was persisted.
        await supabaseAdmin
          .from("chat_sessions")
          .update({
            updated_at: new Date().toISOString(),
            ...(session.title ? {} : { title: titleFromMessage(message) }),
          })
          .eq("id", sessionId);
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Something went wrong." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const member = await requireMember();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }

  const { data: session } = await supabaseAdmin
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("team_member_id", member.id)
    .maybeSingle();
  if (!session) return Response.json({ error: "Chat session not found." }, { status: 404 });

  const { data: messages } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  return Response.json({ messages: messages ?? [] });
}
