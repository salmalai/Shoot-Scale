export const runtime = "nodejs";

import { requireMember } from "@/lib/auth";
import { storeSandcastlesExport } from "@/lib/tools/sandcastles";

export async function POST(request: Request) {
  const member = await requireMember();
  const formData = await request.formData();
  const clientId = String(formData.get("clientId") ?? "");
  const file = formData.get("file");

  if (!clientId || !(file instanceof File)) {
    return Response.json({ error: "clientId and file are required." }, { status: 400 });
  }

  try {
    const result = await storeSandcastlesExport(member, clientId, file);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
