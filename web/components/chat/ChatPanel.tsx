"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { logout } from "@/app/(app)/actions";
import { SKILL_CATALOG } from "@/lib/skillCatalog";

type ClientOption = { id: string; name: string };
type SessionOption = { id: string; title: string | null; created_at: string; updated_at: string };
type Item =
  | { kind: "bubble"; id: string; role: "user" | "assistant"; text: string }
  | { kind: "card"; id: string; filename: string; videoCount: number; driveUrl: string; downloadUrl?: string }
  | { kind: "format_card"; id: string; number: number; name: string; driveUrl: string };

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: string; text: string } => Boolean(b) && typeof b === "object" && "type" in b && b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ChatPanel({ clients }: { clients: ClientOption[] }) {
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? "");
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  // Unmounting the focused rename <input> (on Enter or Escape) fires a native blur, which is also
  // wired to commitRename — without this guard, Enter double-submits and Escape "cancels" but still
  // saves. Set to true the instant Enter/Escape acts, so the resulting blur-triggered call is a no-op.
  const renameSettledRef = useRef(false);
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandMatches = useMemo(() => {
    if (!input.startsWith("/")) return [];
    const query = input.slice(1).toLowerCase();
    return SKILL_CATALOG.filter((s) => s.name.includes(query) || s.command.slice(1).includes(query));
  }, [input]);

  const showCommandMenu = commandMenuOpen && input.startsWith("/") && commandMatches.length > 0;

  function pickCommand(command: string) {
    setInput(`${command} `);
    setCommandMenuOpen(false);
    inputRef.current?.focus();
  }

  async function loadSessionMessages(id: string) {
    setLoadingHistory(true);
    setItems([]);
    try {
      const res = await fetch(`/api/chat?sessionId=${id}`);
      const data = await res.json();
      type ContentBlock = { type: string; [key: string]: unknown };
      type HistoryRow = { role: string; content: unknown };
      const rows = (data.messages ?? []) as HistoryRow[];

      // write_format_brick / generate_and_upload_script_doc results only ever rendered as a
      // one-time live event during the streaming response — on reload we have to reconstruct
      // those "Open in Drive" cards from the saved tool_result, matched back to its tool_use by id.
      const toolNameById = new Map<string, string>();
      for (const row of rows) {
        if (row.role !== "assistant" || !Array.isArray(row.content)) continue;
        for (const block of row.content as ContentBlock[]) {
          if (block.type === "tool_use" && typeof block.id === "string" && typeof block.name === "string") {
            toolNameById.set(block.id, block.name);
          }
        }
      }

      let n = 0;
      const nextId = () => `h-${n++}`;
      const loaded: Item[] = [];

      for (const row of rows) {
        if (row.role === "user") {
          const text = extractText(row.content);
          if (!text.trim() || text.startsWith("Continue exactly where you left off")) continue;
          loaded.push({ kind: "bubble", id: nextId(), role: "user", text });
        } else if (row.role === "assistant") {
          const text = extractText(row.content);
          if (text.trim()) loaded.push({ kind: "bubble", id: nextId(), role: "assistant", text });
        } else if (row.role === "tool" && Array.isArray(row.content)) {
          for (const block of row.content as ContentBlock[]) {
            if (block.type !== "tool_result" || block.is_error) continue;
            const toolName = toolNameById.get(block.tool_use_id as string);
            if (toolName !== "write_format_brick" && toolName !== "generate_and_upload_script_doc") continue;
            let result: Record<string, unknown> | null = null;
            try {
              result = typeof block.content === "string" ? JSON.parse(block.content) : (block.content as Record<string, unknown>);
            } catch {
              continue;
            }
            if (!result?.drive_url) continue;
            if (toolName === "write_format_brick") {
              loaded.push({
                kind: "format_card",
                id: nextId(),
                number: result.number as number,
                name: result.name as string,
                driveUrl: result.drive_url as string,
              });
            } else {
              loaded.push({
                kind: "card",
                id: nextId(),
                filename: result.filename as string,
                videoCount: result.video_count as number,
                driveUrl: result.drive_url as string,
                downloadUrl: result.download_url as string | undefined,
              });
            }
          }
        }
      }
      setItems(loaded);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function refreshSessions(clientIdToLoad: string, selectId?: string) {
    const res = await fetch(`/api/chat/sessions?clientId=${clientIdToLoad}`);
    const data = await res.json();
    const list: SessionOption[] = data.sessions ?? [];
    setSessions(list);

    const nextSelected = selectId ?? list[0]?.id ?? null;
    setSessionId(nextSelected);
    if (nextSelected) await loadSessionMessages(nextSelected);
    else setItems([]);
  }

  useEffect(() => {
    if (!clientId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSessions(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items, status]);

  function addBubble(role: "user" | "assistant", text: string) {
    setItems((prev) => [...prev, { kind: "bubble", id: `b-${prev.length}-${Date.now()}`, role, text }]);
  }

  async function newChat() {
    if (!clientId || creatingChat) return;
    setCreatingChat(true);
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.session) return;
      setSessions((prev) => [data.session, ...prev]);
      setSessionId(data.session.id);
      setItems([]);
      inputRef.current?.focus();
    } finally {
      setCreatingChat(false);
    }
  }

  async function selectSession(id: string) {
    if (id === sessionId) return;
    setSessionId(id);
    await loadSessionMessages(id);
  }

  function startRename(s: SessionOption) {
    renameSettledRef.current = false;
    setRenamingId(s.id);
    setRenameDraft(s.title || "");
  }

  function cancelRename() {
    renameSettledRef.current = true;
    setRenamingId(null);
  }

  async function commitRename(id: string) {
    if (renameSettledRef.current) return;
    renameSettledRef.current = true;
    const title = renameDraft.trim();
    setRenamingId(null);
    if (!title) return;
    const prev = sessions;
    setSessions((cur) => cur.map((s) => (s.id === id ? { ...s, title } : s)));
    const res = await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) setSessions(prev);
  }

  async function deleteSession(id: string) {
    if (!window.confirm("Delete this chat? This can't be undone.")) return;
    const prev = sessions;
    const wasActive = id === sessionId;
    setSessions((cur) => cur.filter((s) => s.id !== id));

    const res = await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setSessions(prev);
      return;
    }
    if (wasActive) {
      const remaining = prev.filter((s) => s.id !== id);
      const next = remaining[0]?.id ?? null;
      setSessionId(next);
      if (next) await loadSessionMessages(next);
      else setItems([]);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !clientId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("file", file);
      const res = await fetch("/api/sandcastles-export", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
      addBubble("assistant", `📎 Uploaded Sandcastles export — ${data.video_count ?? "an unknown number of"} videos. Ready when you are.`);
    } catch (err) {
      addBubble("assistant", `⚠️ ${err instanceof Error ? err.message : "Upload failed."}`);
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || !clientId) return;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok || !data.session) {
        addBubble("assistant", `⚠️ ${data?.error ?? "Couldn't start a chat session."}`);
        return;
      }
      activeSessionId = data.session.id;
      setSessions((prev) => [data.session, ...prev]);
      setSessionId(activeSessionId);
    }

    setInput("");
    setSending(true);
    setStatus(null);
    addBubble("user", text);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, sessionId: activeSessionId, message: text }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "The engine didn't respond.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "status") setStatus(event.text);
          else if (event.type === "text") finalText = event.text;
          else if (event.type === "script_doc") {
            setItems((prev) => [
              ...prev,
              {
                kind: "card",
                id: `card-${prev.length}-${Date.now()}`,
                filename: event.filename,
                videoCount: event.videoCount,
                driveUrl: event.driveUrl,
                downloadUrl: event.downloadUrl,
              },
            ]);
          } else if (event.type === "format_brick") {
            setItems((prev) => [
              ...prev,
              {
                kind: "format_card",
                id: `fcard-${prev.length}-${Date.now()}`,
                number: event.number,
                name: event.name,
                driveUrl: event.driveUrl,
              },
            ]);
          } else if (event.type === "error") throw new Error(event.message);
        }
      }

      if (finalText) addBubble("assistant", finalText);
      // Sync the sidebar (new title from the first message, updated_at ordering) without a full reload.
      fetch(`/api/chat/sessions?clientId=${clientId}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.sessions)) setSessions(data.sessions);
        })
        .catch(() => {});
    } catch (err) {
      addBubble("assistant", `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`);
    } finally {
      setStatus(null);
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "stretch", height: "100%" }}>
      <div
        className="card"
        style={{
          width: 230,
          flexShrink: 0,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <button
          className="btn btn-primary small"
          style={{ marginBottom: 8, padding: "9px 12px" }}
          onClick={newChat}
          disabled={!clientId || creatingChat}
        >
          {creatingChat ? "Creating…" : "+ New chat"}
        </button>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {sessions.length === 0 && <p className="muted small" style={{ padding: "8px 6px" }}>No chats yet for this client.</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="chat-session-row"
              onClick={() => renamingId !== s.id && selectSession(s.id)}
              style={{
                padding: "9px 10px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: s.id === sessionId ? "var(--ember)" : "transparent",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {renamingId === s.id ? (
                  <input
                    autoFocus
                    className="field"
                    style={{ fontSize: 13.5, padding: "4px 6px", width: "100%" }}
                    value={renameDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(s.id);
                      else if (e.key === "Escape") cancelRename();
                    }}
                    onBlur={() => commitRename(s.id)}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: s.id === sessionId ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.title || "New chat"}
                  </div>
                )}
                <div className="muted small">{timeAgo(s.updated_at)}</div>
              </div>
              {renamingId !== s.id && (
                <div className="chat-session-actions" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(s);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 6,
                      borderRadius: 8,
                      lineHeight: 1,
                      fontSize: 17,
                      color: "var(--stone)",
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 6,
                      borderRadius: 8,
                      lineHeight: 1,
                      fontSize: 17,
                      color: "var(--stone)",
                    }}
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="frame" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="hdr" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="wm" style={{ fontSize: 15 }}>
              SHOOT&nbsp;&amp; SCALE
            </div>
            <span className="muted small">Content engine</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="muted small">Client</span>
            <select
              className="field"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={clients.length === 0}
            >
              {clients.length === 0 && <option>No clients assigned yet</option>}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <form action={logout}>
              <button className="btn btn-ghost small" style={{ padding: "8px 12px" }} type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div
          ref={scrollRef}
          style={{ padding: 24, maxWidth: 780, margin: "0 auto", width: "100%", flex: 1, overflowY: "auto" }}
        >
          {loadingHistory && <p className="muted small">Loading…</p>}
          {!loadingHistory && items.length === 0 && (
            <div className="bubble b-ai">
              Pick a client above, then tell me what you&apos;d like to do — type{" "}
              <span className="cmd">/</span> to see every command, or just type{" "}
              <span className="cmd">/run</span> and I&apos;ll walk you through the whole pipeline.
            </div>
          )}
          {items.map((item) => {
            if (item.kind === "bubble") {
              return (
                <div key={item.id} className={`bubble ${item.role === "user" ? "b-user" : "b-ai"}`}>
                  {item.role === "assistant" ? (
                    <div className="md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
                    </div>
                  ) : (
                    item.text
                  )}
                </div>
              );
            }
            if (item.kind === "format_card") {
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h3>
                      Format #{item.number} — {item.name}
                    </h3>
                    <p className="muted small">Saved to the Format Bank · backed up to Drive</p>
                  </div>
                  <a
                    className="btn btn-primary small"
                    style={{ padding: "9px 14px" }}
                    href={item.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Drive
                  </a>
                </div>
              );
            }
            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div>
                  <h3>{item.filename}</h3>
                  <p className="muted small">
                    {item.videoCount} video{item.videoCount === 1 ? "" : "s"} · ready to review in Drive
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {item.downloadUrl && (
                    <a
                      className="btn btn-ghost small"
                      style={{ padding: "9px 14px" }}
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  )}
                  <a
                    className="btn btn-primary small"
                    style={{ padding: "9px 14px" }}
                    href={item.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Drive
                  </a>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="bubble b-ai muted small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {status ?? "Thinking…"}
            </div>
          )}
        </div>
        <div
          style={{
            position: "relative",
            borderTop: "1px solid var(--line)",
            padding: "14px 20px",
            display: "flex",
            gap: 10,
            maxWidth: 780,
            margin: "0 auto",
            width: "100%",
            flexShrink: 0,
          }}
        >
          {showCommandMenu && (
            <div
              className="card"
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: "100%",
                marginBottom: 8,
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {commandMatches.map((s) => (
                <div
                  key={s.name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickCommand(s.command);
                  }}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span className="cmd">{s.command}</span>
                  <span className="muted small" style={{ marginLeft: 10 }}>
                    {s.description}
                  </span>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-ghost"
            type="button"
            title="Upload a Sandcastles JSON export"
            onClick={() => fileInputRef.current?.click()}
            disabled={!clientId || uploading}
          >
            {uploading ? "Uploading…" : "Upload export"}
          </button>
          <input
            ref={inputRef}
            className="field"
            style={{ flex: 1 }}
            placeholder="Message the engine… (try / for commands)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCommandMenuOpen(e.target.value.startsWith("/"));
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCommandMenuOpen(false);
              else if (e.key === "Enter" && !sending && !creatingChat) {
                setCommandMenuOpen(false);
                send();
              }
            }}
            onBlur={() => setCommandMenuOpen(false)}
            disabled={!clientId || sending || creatingChat}
          />
          <button
            className="btn btn-primary"
            onClick={send}
            disabled={!clientId || sending || creatingChat || !input.trim()}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
