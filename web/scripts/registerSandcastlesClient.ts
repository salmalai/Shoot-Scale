// One-time: registers this app as an OAuth client with Sandcastles via
// Dynamic Client Registration (RFC 7591). Run with: npm run register-sandcastles
// Prints the client_id (and secret, if issued) to paste into .env.

async function main() {
  const res = await fetch("https://signin.sandcastles.ai/oauth2/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Shoot & Scale Content Engine",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      redirect_uris: [process.env.SANDCASTLES_REDIRECT_URI || "http://localhost:3000/api/admin/sandcastles/callback"],
      token_endpoint_auth_method: "none",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Registration failed: HTTP ${res.status}`, text);
    process.exit(1);
  }

  const data = JSON.parse(text);
  console.log("Registered OK. Add these to web/.env:\n");
  console.log(`SANDCASTLES_CLIENT_ID=${data.client_id}`);
  if (data.client_secret) console.log(`SANDCASTLES_CLIENT_SECRET=${data.client_secret}`);
  console.log("\nFull registration response:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
