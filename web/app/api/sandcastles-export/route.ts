export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { listClientsFor } from "@/lib/tools/clientDocs";
import { storeSandcastlesExport } from "@/lib/tools/sandcastles";

export async function POST(request: Request) {
  const member = await requireMember();
  const formData = await request.formData();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const file = formData.get("file");

  if (!clientName || !(file instanceof File)) {
    return Response.json({ error: "clientName and file are required." }, { status: 400 });
  }

  // Same source of truth as chat: the shared Drive's clients/ folder, re-synced fresh here too.
  const clients = await listClientsFor();
  const match = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());
  if (!match) {
    return Response.json(
      { error: `"${clientName}" doesn't match any client in the shared Drive. Check the spelling, or add a clients/${clientName}/ folder there first.` },
      { status: 400 }
    );
  }

  try {
    const result = await storeSandcastlesExport(member, match.id, file);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
