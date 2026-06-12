"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

interface Props { role: Role }

// Display label → exact DB value (diet_pref: 'veg' | 'nonveg' | 'mix')
const DIET_OPTIONS = [
  { label: "Vegetarian",       value: "veg"    },
  { label: "Non-Vegetarian",   value: "nonveg" },
  { label: "Mix / No preference", value: "mix" },
];

export default function RegisterForm({ role }: Props) {
  const [username,       setUsername]       = useState("");
  const [password,       setPassword]       = useState("");
  const [name,           setName]           = useState("");
  const [location,       setLocation]       = useState("");
  const [dietPref,       setDietPref]       = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [area,           setArea]           = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("username",        username);
      body.append("password",        password);
      body.append("role",            role);
      body.append("name",            name);
      body.append("location",        location);
      body.append("diet_pref",       dietPref);
      body.append("restaurant_name", restaurantName);
      body.append("area",            area);

      const res  = await fetch("/auth/register", { method: "POST", body, credentials: "same-origin" });
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }

      window.location.href = json.redirect;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const loginHref = role === "student" ? "/auth/student" : "/auth/restaurant";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Username + password ───────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Username <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input
          type="text" required autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="e.g. aryan_shah"
          maxLength={20}
          className={inputCls}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          3–20 chars · lowercase letters, numbers, underscores
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Password <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input
          type="password" required minLength={6} autoComplete="new-password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={inputCls}
        />
      </div>

      {/* ── Shared: full name ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Full name <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input
          type="text" required
          value={name} onChange={e => setName(e.target.value)}
          placeholder={role === "student" ? "Aryan Shah" : "Ramesh Patel"}
          className={inputCls}
        />
      </div>

      {/* ── Student-only ──────────────────────────────────── */}
      {role === "student" && (
        <>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Location / Area <span className="text-[var(--color-brand-primary)]">*</span>
            </label>
            <input
              type="text" required
              value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Koregaon Park, Pune"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Diet preference
            </label>
            <select
              value={dietPref} onChange={e => setDietPref(e.target.value)}
              className={inputCls + " bg-white"}
            >
              <option value="">Prefer not to say</option>
              {DIET_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* ── Restaurant-only ───────────────────────────────── */}
      {role === "restaurant" && (
        <>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Mess / restaurant name <span className="text-[var(--color-brand-primary)]">*</span>
            </label>
            <input
              type="text" required
              value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
              placeholder="Shree Krishna Mess"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Area / locality <span className="text-[var(--color-brand-primary)]">*</span>
            </label>
            <input
              type="text" required
              value={area} onChange={e => setArea(e.target.value)}
              placeholder="Kothrud, Pune"
              className={inputCls}
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-[var(--color-brand-primary)] bg-red-50 rounded-[var(--radius-btn)] px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <a href={loginHref} className="text-[var(--color-brand-secondary)] font-medium hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent";
