import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ISSUER = process.env.SANDCASTLES_AUTH_ISSUER || "https://signin.sandcastles.ai";
const CLIENT_ID = process.env.SANDCASTLES_CLIENT_ID;
const REDIRECT_URI = process.env.SANDCASTLES_REDIRECT_URI || "http://localhost:3000/api/admin/sandcastles/callback";
// The MCP server is a distinct OAuth "protected resource" from the auth issuer (RFC 8707) — without
// this, the issuer hands back a token that's valid for it but not for mcp.sandcastles.ai, and every
// MCP call fails with an "invalid/expired token" error even though the connection looks fine.
const RESOURCE = process.env.SANDCASTLES_MCP_URL || "https://mcp.sandcastles.ai/";

const AUTHORIZATION_ENDPOINT = `${ISSUER}/oauth2/authorize`;
const TOKEN_ENDPOINT = `${ISSUER}/oauth2/token`;

function requireClientId(): string {
  if (!CLIENT_ID) throw new Error("SANDCASTLES_CLIENT_ID is not configured. Run `npm run register-sandcastles` first.");
  return CLIENT_ID;
}

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generatePkcePair() {
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl(codeChallenge: string, state: string): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", requireClientId());
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile email offline_access");
  url.searchParams.set("resource", RESOURCE);
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Sandcastles token request failed: HTTP ${res.status} ${text}`);
  return JSON.parse(text);
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string, connectedBy: string) {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: requireClientId(),
    code_verifier: codeVerifier,
    resource: RESOURCE,
  });

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await supabaseAdmin.from("sandcastles_connection").upsert(
    {
      id: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      scope: tokens.scope ?? null,
      connected_by: connectedBy,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}

// Sandcastles rotates the refresh token on every use (the old one is invalidated the instant a new
// one is issued), so two requests refreshing at once would otherwise knock each other's token out
// from under them. Single-flight within this process, plus an optimistic-lock write, closes that gap.
let refreshInFlight: Promise<string> | null = null;

export async function getValidAccessToken(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("sandcastles_connection")
    .select("access_token, refresh_token, expires_at")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sandcastles isn't connected yet — connect it from the Admin page.");

  const expiresAt = new Date(data.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) {
    return data.access_token;
  }

  if (!data.refresh_token) {
    throw new Error("Sandcastles connection expired and can't be refreshed — reconnect it from the Admin page.");
  }

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const usedRefreshToken = data.refresh_token as string;
      const tokens = await tokenRequest({
        grant_type: "refresh_token",
        refresh_token: usedRefreshToken,
        client_id: requireClientId(),
        resource: RESOURCE,
      });

      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("sandcastles_connection")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? usedRefreshToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true)
        .eq("refresh_token", usedRefreshToken)
        .select("access_token")
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);

      if (updated) return updated.access_token as string;

      // Someone else (another request) already refreshed with this same refresh_token first — our
      // new tokens are now orphaned (Sandcastles already rotated past them). Use whatever they wrote.
      const { data: current, error: currentError } = await supabaseAdmin
        .from("sandcastles_connection")
        .select("access_token")
        .eq("id", true)
        .maybeSingle();
      if (currentError) throw new Error(currentError.message);
      if (!current) throw new Error("Sandcastles connection was removed mid-refresh — reconnect it from the Admin page.");
      return current.access_token as string;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function getConnectionStatus() {
  const { data } = await supabaseAdmin
    .from("sandcastles_connection")
    .select("connected_at, expires_at")
    .eq("id", true)
    .maybeSingle();
  return data ? { connected: true, connectedAt: data.connected_at } : { connected: false, connectedAt: null };
}
