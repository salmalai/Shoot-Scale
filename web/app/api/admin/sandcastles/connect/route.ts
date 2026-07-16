export const runtime = "nodejs";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { buildAuthorizationUrl, generatePkcePair } from "@/lib/sandcastlesOAuth";

export async function GET() {
  await requireAdmin();

  const { codeVerifier, codeChallenge } = generatePkcePair();
  const state = crypto.randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  cookieStore.set("sc_oauth_verifier", codeVerifier, cookieOpts);
  cookieStore.set("sc_oauth_state", state, cookieOpts);

  const url = buildAuthorizationUrl(codeChallenge, state);
  return Response.redirect(url, 302);
}
