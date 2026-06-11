"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

interface Props {
  role: "student" | "restaurant";
}

export default function AuthEmailForm({ role }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback?role=${role}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-3">📬</p>
        <p className="font-semibold text-[var(--color-text-primary)]">Check your inbox!</p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          We sent a magic link to <strong>{email}</strong>.<br />
          Click it to sign in — it expires in 1 hour.
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
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent"
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
        {loading ? "Sending…" : "Send magic link"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {role === "student" ? (
          <>Are you a mess owner?{" "}
            <a href="/auth/restaurant" className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Sign in here
            </a>
          </>
        ) : (
          <>Are you a student?{" "}
            <a href="/auth/student" className="text-[var(--color-brand-secondary)] font-medium hover:underline">
              Sign in here
            </a>
          </>
        )}
      </p>
    </form>
  );
}
