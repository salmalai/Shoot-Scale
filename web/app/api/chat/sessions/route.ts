export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const member = await requireMember();

  const { data: sessions, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("team_member_id", member.id)
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ sessions: sessions ?? [] });
}

export async function POST() {
  const member = await requireMember();

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .insert({ team_member_id: member.id })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Failed to create session." }, { status: 500 });
  }
  return Response.json({ session: data });
}
