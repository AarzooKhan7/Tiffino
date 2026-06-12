"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

interface Props { role: Role }

export default function LoginForm({ role }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("username", username);
      body.append("password", password);

      const res  = await fetch("/auth/login", { method: "POST", body, credentials: "same-origin" });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }

      // Cookies are now set on the browser by the response headers.
      // Navigate — next request will carry the session.
      window.location.href = json.redirect;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const registerHref =
    role === "student" ? "/auth/student/register" : "/auth/restaurant/register";
  const otherHref  = role === "student" ? "/auth/restaurant" : "/auth/student";
  const otherLabel = role === "student" ? "Mess owner?" : "Student?";
  const otherLink  = role === "student" ? "Sign in as restaurant" : "Sign in as student";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Username
        </label>
        <input
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase())}
          placeholder="your_username"
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
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password"
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
        {loading ? "Logging in…" : "Log in"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        No account yet?{" "}
        <a href={registerHref} className="text-[var(--color-brand-secondary)] font-medium hover:underline">
          Create one
        </a>
      </p>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        {otherLabel}{" "}
        <a href={otherHref} className="text-[var(--color-brand-secondary)] font-medium hover:underline">
          {otherLink}
        </a>
      </p>
    </form>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent";
