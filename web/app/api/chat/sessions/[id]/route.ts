export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function loadOwnedSession(sessionId: string, memberId: string) {
  const { data } = await supabaseAdmin
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("team_member_id", memberId)
    .maybeSingle();
  return data;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return Response.json({ error: "title is required." }, { status: 400 });

  const session = await loadOwnedSession(id, member.id);
  if (!session) return Response.json({ error: "Chat session not found." }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .update({ title })
    .eq("id", id)
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) return Response.json({ error: error?.message ?? "Rename failed." }, { status: 500 });
  return Response.json({ session: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  const { id } = await params;

  const session = await loadOwnedSession(id, member.id);
  if (!session) return Response.json({ error: "Chat session not found." }, { status: 404 });

  const { error } = await supabaseAdmin.from("chat_sessions").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
