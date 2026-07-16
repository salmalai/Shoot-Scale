"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Wordmark } from "@/components/Wordmark";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <div className="screen">
      <div className="frame" style={{ maxWidth: 400, margin: "44px auto", padding: 36 }}>
        <div style={{ marginBottom: 26 }}>
          <Wordmark size={24} />
        </div>
        <h1 style={{ marginBottom: 6 }}>Sign in</h1>
        <p className="muted small" style={{ marginBottom: 20 }}>
          Welcome back to the content engine.
        </p>
        <form action={formAction}>
          <input
            className="field"
            style={{ marginBottom: 10 }}
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
          <input
            className="field"
            style={{ marginBottom: 18 }}
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          {state?.error && (
            <p className="small" style={{ color: "var(--tangerine-600)", marginBottom: 12 }}>
              {state.error}
            </p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            type="submit"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted small" style={{ marginTop: 18 }}>
          Access is granted by Shoot &amp; Scale. Need an account? Ask your admin.
        </p>
      </div>
    </div>
  );
}
