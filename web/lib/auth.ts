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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
