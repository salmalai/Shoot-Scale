"use client";

import { useRef, useState } from "react";
import { addMember } from "@/app/(app)/admin/actions";

type ClientOption = { id: string; name: string };

export function AddMemberForm({ clients }: { clients: ClientOption[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await addMember(formData);
      setSelected([]);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input className="field" name="name" placeholder="Name" required />
        <input className="field" name="email" type="email" placeholder="Email" required />
        <input className="field" name="password" placeholder="Temp password" required />
        <div />
      </div>
      <p className="muted small" style={{ margin: "14px 0 8px" }}>
        Assigned clients — they&apos;ll only see these
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {clients.length === 0 && <span className="muted small">No clients yet.</span>}
        {clients.map((c) => (
          <span
            key={c.id}
            className={`pill${selected.includes(c.id) ? " active" : ""}`}
            onClick={() => toggle(c.id)}
          >
            {c.name}
          </span>
        ))}
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name="clientIds" value={id} />
      ))}
      {error && (
        <p className="small" style={{ color: "var(--tangerine-600)", marginTop: 10 }}>
          {error}
        </p>
      )}
      <button className="btn btn-primary" style={{ marginTop: 16 }} type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add member"}
      </button>
    </form>
  );
}
