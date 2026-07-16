import "server-only";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getValidAccessToken } from "@/lib/sandcastlesOAuth";

const MCP_URL = process.env.SANDCASTLES_MCP_URL || "https://mcp.sandcastles.ai/";

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const accessToken = await getValidAccessToken();

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const client = new Client({ name: "shoot-and-scale-web", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

export async function callSandcastlesTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  return withClient(async (client) => {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) {
      const message = Array.isArray(result.content)
        ? result.content.map((c) => (c.type === "text" ? c.text : "")).join(" ")
        : "Sandcastles tool call failed.";
      throw new Error(message || "Sandcastles tool call failed.");
    }
    return result;
  });
}
