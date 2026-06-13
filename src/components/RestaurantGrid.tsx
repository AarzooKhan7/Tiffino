"use client";

import Image from "next/image";
import Link from "next/link";
import { restaurantCover } from "@/lib/food-images";
import type { HomeListing } from "./HomeClient";

interface Props { restaurants: HomeListing[] }

export default function RestaurantGrid({ restaurants }: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-16 text-center">
        <span className="text-5xl block mb-4">🍽</span>
        <p className="font-bold text-[var(--color-text-primary)] text-lg">No messes found</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">Try a different search or filter.</p>
        <Link href="/auth/restaurant"
          className="inline-block mt-5 text-sm text-[var(--color-brand-primary)] hover:underline font-semibold">
          Are you a mess owner? Register →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {restaurants.map((r, i) => (
        <RestaurantCard key={r.id} r={r} index={i} />
      ))}
    </div>
  );
}

function RestaurantCard({ r, index }: { r: HomeListing; index: number }) {
  const cover  = restaurantCover(r.id);
  const slots  = [r.serves_lunch && "Lunch", r.serves_dinner && "Dinner"].filter(Boolean) as string[];
  const minPrice = r.serves_lunch && r.serves_dinner
    ? Math.min(r.lunch_price, r.dinner_price)
    : r.serves_lunch ? r.lunch_price : r.dinner_price;
  const rating = r.avg_rating ?? 4.2;
  const delay  = Math.min(index, 4) * 0.05;

  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="group flex bg-white rounded-[var(--radius-card)] card-shadow hover:card-shadow-lg transition-all duration-200 overflow-hidden active:scale-[0.99]"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* ── Left: cover image ─────────────────────────────────────── */}
      <div className="relative shrink-0 w-[120px] sm:w-[148px] overflow-hidden" style={{ minHeight: 110 }}>
        <Image
          src={cover}
          alt={r.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        {/* Subtle gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />

        {/* Rating pill — green (success semantics) */}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/95 rounded-full px-1.5 py-0.5 shadow-sm">
          <svg className="w-2.5 h-2.5 fill-yellow-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[11px] font-bold text-[var(--color-text-primary)] leading-none">{rating.toFixed(1)}</span>
        </div>
      </div>

      {/* ── Right: content ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-between gap-2">
        <div>
          <h3 className="font-bold text-[var(--color-text-primary)] text-[15px] leading-snug truncate">
            {r.name}
          </h3>
          {r.area && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1 truncate">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{r.area}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Slot badges */}
          <div className="flex gap-1 flex-wrap">
            {slots.map((s) => (
              <span key={s} className="text-[10px] font-semibold bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                {s === "Lunch" ? "🌞" : "🌙"} {s}
              </span>
            ))}
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <span className="text-base font-extrabold text-[var(--color-brand-primary)]">
              ₹{minPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] block leading-tight">/mo</span>
          </div>
        </div>
      </div>

      {/* ── Chevron ───────────────────────────────────────────────── */}
      <div className="flex items-center pr-3.5 shrink-0">
        <svg className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-primary)] transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
