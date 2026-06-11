"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

interface Props { role: Role }

export default function AuthPasswordForm({ role }: Props) {
  const [mode, setMode]   = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = new FormData();
    body.append("email",    email);
    body.append("password", pass);
    body.append("mode",     mode);
    body.append("role",     role);

    // POST to the route handler which sets session cookies on the response.
    // await guarantees cookies are stored by the browser before we navigate.
    const res  = await fetch("/auth/password", { method: "POST", body, credentials: "same-origin" });
    const json = await res.json();

    if (json.error) {
      setError(json.error);
      setLoading(false);
      return;
    }
    if (json.needsEmailConfirm) {
      setNeedsConfirm(true);
      setLoading(false);
      return;
    }
    // Cookies are in the browser; navigate now
    window.location.href = json.redirect;
  }

  if (needsConfirm) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-2xl">📧</p>
        <p className="font-semibold text-[var(--color-text-primary)]">Confirm your email</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Check your inbox for a confirmation link, then{" "}
          <button
            className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            onClick={() => { setNeedsConfirm(false); setMode("login"); }}
          >
            log in here
          </button>
          .
        </p>
        <p className="text-xs text-[var(--color-text-muted)] bg-amber-50 border border-amber-200 rounded-[var(--radius-btn)] px-3 py-2">
          To skip email confirmation: Supabase dashboard → Authentication →
          Providers → Email → toggle <strong>Confirm email</strong> OFF.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Email address
        </label>
        <input
          type="email" required
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Password
        </label>
        <input
          type="password" required minLength={6}
          value={pass} onChange={e => setPass(e.target.value)}
          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-brand-primary)] bg-red-50 rounded-[var(--radius-btn)] px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {mode === "signup" ? (
          <>Already have an account?{" "}
            <button type="button" onClick={() => { setMode("login"); setError(null); }}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline">Log in</button>
          </>
        ) : (
          <>No account yet?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(null); }}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline">Create one</button>
          </>
        )}
      </p>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {role === "student" ? (
          <>Mess owner?{" "}
            <a href="/auth/restaurant" className="text-[var(--color-brand-secondary)] font-medium hover:underline">Sign in here</a>
          </>
        ) : (
          <>Student?{" "}
            <a href="/auth/student" className="text-[var(--color-brand-secondary)] font-medium hover:underline">Sign in here</a>
          </>
        )}
      </p>
    </form>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent";
