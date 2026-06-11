"use client";

import { useActionState, useState } from "react";
import { passwordAuth } from "@/app/auth/password-actions";
import type { Role } from "@/lib/types";

interface Props {
  role: Role;
}

const INIT = { error: null, needsEmailConfirm: false };

export default function AuthPasswordForm({ role }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, pending] = useActionState(passwordAuth, INIT);

  if (state.needsEmailConfirm) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-2xl">📧</p>
        <p className="font-semibold text-[var(--color-text-primary)]">Confirm your email</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Check your inbox for a confirmation link, then come back and{" "}
          <button
            className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            onClick={() => window.location.reload()}
          >
            log in
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
    <form action={formAction} className="flex flex-col gap-4">
      {/* Hidden fields tell the server action which mode and role */}
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="role" value={role} />

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Email address
        </label>
        <input
          type="email"
          name="email"
          required
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
          name="password"
          required
          minLength={6}
          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="text-sm text-[var(--color-brand-primary)] bg-red-50 rounded-[var(--radius-btn)] px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            >
              Log in
            </button>
          </>
        ) : (
          <>
            No account yet?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            >
              Create one
            </button>
          </>
        )}
      </p>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {role === "student" ? (
          <>
            Mess owner?{" "}
            <a
              href="/auth/restaurant"
              className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            >
              Sign in here
            </a>
          </>
        ) : (
          <>
            Student?{" "}
            <a
              href="/auth/student"
              className="text-[var(--color-brand-secondary)] font-medium hover:underline"
            >
              Sign in here
            </a>
          </>
        )}
      </p>
    </form>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent";
