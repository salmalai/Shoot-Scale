export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { assertClientAccess } from "@/lib/tools/clientDocs";

export async function GET(request: Request) {
  const member = await requireMember();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId is required." }, { status: 400 });

  try {
    await assertClientAccess(member, clientId);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Access denied." }, { status: 403 });
  }

  const { data: sessions, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("client_id", clientId)
    .eq("team_member_id", member.id)
    .order("updated_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ sessions: sessions ?? [] });
}

export async function POST(request: Request) {
  const member = await requireMember();
  const body = await request.json().catch(() => null);
  const clientId = String(body?.clientId ?? "");
  if (!clientId) return Response.json({ error: "clientId is required." }, { status: 400 });

  try {
    await assertClientAccess(member, clientId);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Access denied." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .insert({ client_id: clientId, team_member_id: member.id })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Failed to create session." }, { status: 500 });
  }
  return Response.json({ session: data });
}
