// Bootstrap the first admin account (admin-provisioned only, no self-signup).
// Run with: npm run create-admin -- <email> <password> "<full name>"

import { supabaseAdmin } from "../lib/supabaseAdmin";

async function main() {
  const [email, password, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(" ");

  if (!email || !password || !name) {
    console.error('Usage: npm run create-admin -- <email> <password> "<full name>"');
    process.exit(1);
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Failed to create auth user:", error);
    process.exit(1);
  }

  const { error: memberError } = await supabaseAdmin.from("team_members").insert({
    id: data.user.id,
    name,
    email,
    role: "admin",
    status: "active",
  });

  if (memberError) {
    console.error("Failed to insert team_members row:", memberError);
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    process.exit(1);
  }

  console.log(`Admin account created: ${email}`);
}

main();
