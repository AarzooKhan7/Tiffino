"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";

interface Props {
  role: Role;
}

type Mode = "login" | "signup";

export default function AuthPasswordForm({ role }: Props) {
  const [mode, setMode]       = useState<Mode>("login");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }

      // If email confirmation is still ON in Supabase, session will be null
      if (!data.session) {
        setNeedsConfirm(true);
        setLoading(false);
        return;
      }

      // Email confirmation is disabled — user is live immediately
      await upsertProfileAndRedirect(supabase, data.user!.id, data.user!.email ?? email, role);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      await upsertProfileAndRedirect(supabase, data.user.id, data.user.email ?? email, role);
    }
  }

  if (needsConfirm) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-2xl">📧</p>
        <p className="font-semibold text-[var(--color-text-primary)]">Confirm your email</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Check your inbox for a confirmation link, then come back and{" "}
          <button
            className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            onClick={() => { setNeedsConfirm(false); setMode("login"); }}
          >
            log in
          </button>
          .
        </p>
        <p className="text-xs text-[var(--color-text-muted)] bg-amber-50 border border-amber-200 rounded-[var(--radius-btn)] px-3 py-2">
          To skip email confirmation during development: Supabase dashboard →
          Authentication → Providers → Email → toggle <strong>Confirm email</strong> OFF.
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
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPass(e.target.value)}
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
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading
          ? "Please wait…"
          : mode === "signup"
          ? "Create account"
          : "Log in"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => { setMode("login"); setError(null); }}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Log in
            </button>
          </>
        ) : (
          <>
            No account yet?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(null); }}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Create one
            </button>
          </>
        )}
      </p>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {role === "student" ? (
          <>Mess owner?{" "}
            <a href="/auth/restaurant" className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Sign in here
            </a>
          </>
        ) : (
          <>Student?{" "}
            <a href="/auth/student" className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Sign in here
            </a>
          </>
        )}
      </p>
    </form>
  );
}

async function upsertProfileAndRedirect(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  role: Role
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (existing) {
    // Returning user — go straight to their dashboard
    window.location.href =
      existing.role === "student" ? "/student/dashboard" : "/restaurant/dashboard";
    return;
  }

  // First time — create profile, then onboarding
  await supabase
    .from("profiles")
    .upsert({ id: userId, role, email }, { onConflict: "id" });

  window.location.href = "/onboarding";
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent";
