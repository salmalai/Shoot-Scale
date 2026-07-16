import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseAdmin } from "./supabaseAdmin";

export type CurrentMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team";
  status: "active" | "paused";
};

export const getCurrentMember = cache(async (): Promise<CurrentMember | null> => {
  const supabase = await createClient();
  // getSession() reads the JWT already on the cookie (no network round trip) rather than getUser()
  // (which re-checks against the Auth server every call). Safe here specifically because proxy.ts
  // middleware already ran the network-verified getUser() check for this exact request and redirects
  // unauthenticated requests to /login before a Server Component ever renders — this is just reading
  // who that already-verified request belongs to, not re-establishing trust from scratch.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("id, name, email, role, status")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as CurrentMember;
});

export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (!member || member.status === "paused") {
    redirect("/login");
  }
  return member;
}

export async function requireAdmin(): Promise<CurrentMember> {
  const member = await requireMember();
  if (member.role !== "admin") {
    redirect("/chat");
  }
  return member;
}
