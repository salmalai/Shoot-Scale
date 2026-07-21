"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function addMember(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    throw new Error("Name, email, and temp password are required.");
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Failed to create the account.");
  }

  const { error: memberError } = await supabaseAdmin.from("team_members").insert({
    id: created.user.id,
    name,
    email,
    role: "team",
    status: "active",
  });

  if (memberError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    throw new Error(memberError.message);
  }

  revalidatePath("/admin");
}

export async function setMemberStatus(memberId: string, status: "active" | "paused") {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("team_members").update({ status }).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function removeMember(memberId: string) {
  const admin = await requireAdmin();
  if (admin.id === memberId) {
    throw new Error("You can't remove your own account.");
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
