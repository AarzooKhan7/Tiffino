"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HERO_BG } from "@/lib/food-images";
import RestaurantGrid from "./RestaurantGrid";

export interface HomeListing {
  id: string;
  name: string;
  area: string | null;
  lunch_price: number;
  dinner_price: number;
  serves_lunch: boolean;
  serves_dinner: boolean;
  avg_rating: number | null;
  review_count: number;
}

interface Props {
  restaurants: HomeListing[];
  isLoggedIn: boolean;
}

const SLOT_FILTERS = [
  { id: "all",    label: "All" },
  { id: "lunch",  label: "🌞 Lunch" },
  { id: "dinner", label: "🌙 Dinner" },
  { id: "top",    label: "⭐ Top rated" },
];

export default function HomeClient({ restaurants, isLoggedIn }: Props) {
  const [query, setQuery]       = useState("");
  const [slot, setSlot]         = useState("all");
  const [areaFilter, setArea]   = useState("");

  const areas = useMemo(
    () => Array.from(new Set(restaurants.map((r) => r.area).filter(Boolean) as string[])).sort(),
    [restaurants]
  );

  const filtered = useMemo(() => {
    let list = [...restaurants];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.area ?? "").toLowerCase().includes(q)
      );
    }
    if (slot === "lunch")  list = list.filter((r) => r.serves_lunch);
    if (slot === "dinner") list = list.filter((r) => r.serves_dinner);
    if (slot === "top")    list = [...list].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    if (areaFilter)        list = list.filter((r) => r.area === areaFilter);
    return list;
  }, [restaurants, query, slot, areaFilter]);

  return (
    <>
      {/* ── Hero ── */}
      {/* Pattern: Zomato centers hero around search + location. We adapt with a strong headline + inline search bar. */}
      <section className="relative overflow-hidden" style={{ minHeight: 320 }}>
        <Image
          src={HERO_BG}
          alt="Indian food spread"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Gradient: dark top (for header contrast) → lighter mid → dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-12 pb-10 gap-5">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5">
            <span className="text-base">🍱</span>
            <span className="text-white text-xs font-semibold tracking-wide">30-day meal subscriptions</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
              Find your daily mess
            </h1>
            <p className="text-white/75 text-sm sm:text-base mt-2 max-w-xs mx-auto">
              Subscribe once, scan daily — home-style food, always on time.
            </p>
          </div>

          {/* Search bar in hero — Zomato pattern */}
          <div className="w-full max-w-sm relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messes or areas…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium text-[var(--color-text-primary)] bg-white placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* CTA for non-logged-in users */}
          {!isLoggedIn && (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link href="/auth/student"
                className="btn-primary px-6 py-2.5 text-sm shadow-lg">
                Sign in as student
              </Link>
              <Link href="/auth/restaurant"
                className="inline-flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-[var(--radius-btn)] hover:bg-white/25 transition-colors">
                List your mess
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-center gap-6 sm:gap-10 flex-wrap text-center">
          {[
            { v: `${restaurants.length}+`, l: "Messes" },
            { v: "₹40–120", l: "per slot / day" },
            { v: "30 days", l: "per plan" },
            { v: "QR scan", l: "to mark meal" },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="text-sm font-extrabold text-[var(--color-brand-primary)]">{v}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter chips — Swiggy pattern: horizontal scroll categories ── */}
      <div className="bg-white border-b border-[var(--color-border)] sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar -mx-1 px-1">
            {SLOT_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setSlot(id); setArea(""); }}
                className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${
                  slot === id && !areaFilter
                    ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-sm"
                    : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
                }`}
              >
                {label}
              </button>
            ))}

            {/* Divider */}
            {areas.length > 0 && (
              <div className="shrink-0 w-px bg-[var(--color-border)] mx-1 self-stretch" />
            )}

            {/* Area chips */}
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => { setArea((a) => a === area ? "" : area); setSlot("all"); }}
                className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-all ${
                  areaFilter === area
                    ? "bg-[var(--color-brand-secondary)] text-white border-[var(--color-brand-secondary)] shadow-sm"
                    : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-secondary)] hover:text-[var(--color-brand-secondary)]"
                }`}
              >
                📍 {area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Restaurant grid ── */}
      <section className="max-w-5xl mx-auto px-4 py-6" id="messes">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {areaFilter ? `Messes in ${areaFilter}` : slot === "top" ? "Top rated messes" : "Messes near you"}
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </span>
        </div>
        <RestaurantGrid restaurants={filtered} />
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-t border-[var(--color-border)] py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] text-center mb-7">How Tiffino works</h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { emoji: "🔍", title: "Browse", desc: "Find a local mess with your preferred slots and diet." },
              { emoji: "💳", title: "Subscribe", desc: "Pick lunch, dinner, or both. Pay once, eat 30 days." },
              { emoji: "📱", title: "Scan & eat", desc: "Tap 'Scan QR' each meal. Your token is your pass." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--color-surface-alt)] flex items-center justify-center text-xl sm:text-2xl">
                  {emoji}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">{title}</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-5 text-center text-xs text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Tiffino · Made for students
      </footer>
    </>
  );
}
