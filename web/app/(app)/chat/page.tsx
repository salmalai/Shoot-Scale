import { ChatPanel } from "@/components/chat/ChatPanel";
import { requireMember } from "@/lib/auth";

export default async function ChatPage() {
  await requireMember();

  return (
    <div style={{ height: "100%", padding: "16px" }}>
      <ChatPanel />
    </div>
  );
}
