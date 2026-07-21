"use client";

import { useRef, useState } from "react";
import { addMember } from "@/app/(app)/admin/actions";

export function AddMemberForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await addMember(formData);
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
        Every team member can work with every client — no per-client assignment needed.
      </p>
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
