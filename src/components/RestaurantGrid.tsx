"use client";

import { useState } from "react";
import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  area: string | null;
  base_price: number;
  serves_lunch: boolean;
  serves_dinner: boolean;
}

export default function RestaurantGrid({ restaurants }: { restaurants: Restaurant[] }) {
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          (r.area ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : restaurants;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">🔍</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or area…"
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="card-shadow rounded-[var(--radius-card)] bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{r.name}</h3>
                  {r.area && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">📍 {r.area}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-[var(--color-brand-secondary)] shrink-0">
                  ₹{r.base_price}
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">/slot</span>
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {r.serves_lunch && (
                  <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">
                    🌞 Lunch
                  </span>
                )}
                {r.serves_dinner && (
                  <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">
                    🌙 Dinner
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-10 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            {q.trim() ? `No messes found for "${q}".` : "No messes listed yet."}
          </p>
          {!q.trim() && (
            <Link
              href="/auth/restaurant"
              className="inline-block mt-3 text-sm text-[var(--color-brand-secondary)] hover:underline font-medium"
            >
              Are you a mess owner? Register here →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
