import { ChatPanel } from "@/components/chat/ChatPanel";
import { requireMember } from "@/lib/auth";
import { listClientsFor } from "@/lib/tools/clientDocs";

export default async function ChatPage() {
  const member = await requireMember();
  const clients = await listClientsFor(member);

  return (
    <div className="screen" style={{ maxWidth: 1180, height: "100%", margin: "0 auto", padding: "16px" }}>
      <ChatPanel clients={clients} />
    </div>
  );
}
