export const runtime = "nodejs";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/sandcastlesOAuth";

export async function GET(request: Request) {
  const member = await requireAdmin();
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("sc_oauth_state")?.value;
  const codeVerifier = cookieStore.get("sc_oauth_verifier")?.value;
  cookieStore.delete("sc_oauth_state");
  cookieStore.delete("sc_oauth_verifier");

  if (error) {
    return Response.redirect(`${origin}/admin?sandcastles=error`, 302);
  }
  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return Response.redirect(`${origin}/admin?sandcastles=state_mismatch`, 302);
  }

  try {
    await exchangeCodeForTokens(code, codeVerifier, member.id);
  } catch {
    return Response.redirect(`${origin}/admin?sandcastles=error`, 302);
  }

  return Response.redirect(`${origin}/admin?sandcastles=connected`, 302);
}
