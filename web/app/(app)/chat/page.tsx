import { ChatPanel } from "@/components/chat/ChatPanel";
import { requireMember } from "@/lib/auth";

export default async function ChatPage() {
  await requireMember();

  return (
    <div className="screen" style={{ maxWidth: 1600, height: "100%", margin: "0 auto", padding: "16px" }}>
      <ChatPanel />
    </div>
  );
}
