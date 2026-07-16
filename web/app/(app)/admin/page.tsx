import { Wordmark } from "@/components/Wordmark";
import { AddMemberForm } from "@/components/admin/AddMemberForm";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getConnectionStatus } from "@/lib/sandcastlesOAuth";
import { setMemberStatus, removeMember } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sandcastles?: string }>;
}) {
  await requireAdmin();
  const { sandcastles: sandcastlesResult } = await searchParams;

  const [{ data: clients }, { data: members }, { data: assignments }, sandcastlesStatus] = await Promise.all([
    supabaseAdmin.from("clients").select("id, name").order("name"),
    supabaseAdmin.from("team_members").select("id, name, email, role, status").order("created_at"),
    supabaseAdmin.from("client_assignments").select("team_member_id, client_id"),
    getConnectionStatus(),
  ]);

  const countByMember = new Map<string, number>();
  (assignments ?? []).forEach((a) => {
    countByMember.set(a.team_member_id, (countByMember.get(a.team_member_id) ?? 0) + 1);
  });

  const roster = (members ?? []).filter((m) => m.role === "team");

  return (
    <div className="screen">
      <div className="frame" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Wordmark />
          <span className="muted small">Team access</span>
        </div>
        <h1 style={{ marginBottom: 18 }}>Team</h1>

        {sandcastlesResult === "connected" && (
          <div className="panel" style={{ padding: 12, marginBottom: 16 }}>
            <p className="small">✅ Sandcastles connected.</p>
          </div>
        )}
        {(sandcastlesResult === "error" || sandcastlesResult === "state_mismatch") && (
          <div className="panel" style={{ padding: 12, marginBottom: 16 }}>
            <p className="small">⚠️ Couldn&apos;t connect Sandcastles — please try again.</p>
          </div>
        )}

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 6 }}>Sandcastles connection</h2>
          <p className="muted small" style={{ marginBottom: 14 }}>
            {sandcastlesStatus.connected
              ? `Connected since ${new Date(sandcastlesStatus.connectedAt!).toLocaleString()}. The engine can read/analyze videos and switch workspaces for real.`
              : "Not connected yet. Until this is connected, /analyze and /create-format will ask you to paste transcripts manually instead of fetching them."}
          </p>
          <a
            className="btn btn-primary"
            href="/api/admin/sandcastles/connect"
            style={{ display: "inline-flex" }}
          >
            {sandcastlesStatus.connected ? "Reconnect Sandcastles" : "Connect Sandcastles"}
          </a>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 14 }}>Add a team member</h2>
          <AddMemberForm clients={clients ?? []} />
        </div>

        <div className="card">
          {roster.length === 0 && (
            <div style={{ padding: 16 }}>
              <p className="muted small">No team members yet.</p>
            </div>
          )}
          {roster.map((member, i) => {
            const count = countByMember.get(member.id) ?? 0;
            return (
              <div
                key={member.id}
                style={{
                  padding: 16,
                  borderBottom: i < roster.length - 1 ? "1px solid var(--line)" : undefined,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3>{member.name}</h3>
                  <p className="muted small">
                    {member.email} · {member.status} · {count} client{count === 1 ? "" : "s"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <form action={setMemberStatus.bind(null, member.id, member.status === "active" ? "paused" : "active")}>
                    <button className="btn btn-ghost small" style={{ padding: "8px 12px" }} type="submit">
                      {member.status === "active" ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={removeMember.bind(null, member.id)}>
                    <button className="btn btn-ink small" style={{ padding: "8px 12px" }} type="submit">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          <b style={{ fontWeight: 600 }}>Pause</b> = temporarily block their login, keep the account (flip back on
          anytime). &nbsp; <b style={{ fontWeight: 600 }}>Remove</b> = delete the account for good. Both end access
          instantly — nobody ever holds Sandcastles or Drive logins of their own.
        </p>
      </div>
    </div>
  );
}
