import { TabNav } from "@/components/TabNav";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  const isAdmin = member.role === "admin";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TabNav showAdmin={isAdmin} showGuide />
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
    </div>
  );
}
