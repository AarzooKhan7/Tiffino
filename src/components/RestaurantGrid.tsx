"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { restaurantCover, restaurantRating } from "@/lib/food-images";

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
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by mess name or area…"
          className="input-base pl-10 pr-4 py-3 text-sm rounded-xl"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-12 text-center">
          <div className="text-4xl mb-3">🍽</div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {q.trim() ? `No messes found for "${q}"` : "No messes listed yet."}
          </p>
          {!q.trim() && (
            <Link href="/auth/restaurant" className="inline-block mt-3 text-sm text-[var(--color-brand-secondary)] hover:underline font-medium">
              Are you a mess owner? Register →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ r }: { r: Restaurant }) {
  const rating = restaurantRating(r.id);
  const cover  = restaurantCover(r.id);
  const slots  = [r.serves_lunch && "Lunch", r.serves_dinner && "Dinner"].filter(Boolean) as string[];

  return (
    <Link href={`/restaurants/${r.id}`} className="group block bg-white rounded-[var(--radius-card)] card-shadow hover:card-shadow-lg transition-shadow overflow-hidden">
      {/* Cover image */}
      <div className="relative h-44 bg-gradient-to-br from-orange-100 to-red-50 overflow-hidden">
        <Image
          src={cover}
          alt={r.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        {/* Gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rating pill — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-sm">
          <svg className="w-3 h-3 text-green-600 fill-green-600" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span className="text-xs font-bold text-green-700">{rating}</span>
        </div>

        {/* 30-day plan badge */}
        <div className="absolute top-3 left-3 bg-[var(--color-brand-secondary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          30-day plan
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--color-text-primary)] truncate">{r.name}</h3>
            {r.area && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {r.area}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-extrabold text-[var(--color-brand-secondary)]">₹{r.base_price}</span>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-none mt-0.5">per slot/day</p>
          </div>
        </div>

        {/* Slot tags */}
        <div className="flex items-center gap-2 mt-3">
          {slots.map((s) => (
            <span key={s} className="text-[11px] font-medium border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-secondary)]">
              {s === "Lunch" ? "🌞" : "🌙"} {s}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-[var(--color-brand-primary)] font-semibold group-hover:underline">
            View menu →
          </span>
        </div>
      </div>
    </Link>
  );
}
