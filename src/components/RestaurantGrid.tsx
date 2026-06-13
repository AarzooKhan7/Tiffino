"use client";

import Image from "next/image";
import Link from "next/link";
import { restaurantCover } from "@/lib/food-images";
import type { HomeListing } from "./HomeClient";

interface Props {
  restaurants: HomeListing[];
}

export default function RestaurantGrid({ restaurants }: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-14 text-center">
        <div className="text-5xl mb-3">🍽</div>
        <p className="font-semibold text-[var(--color-text-primary)]">No messes found</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Try a different search or filter.</p>
        <Link href="/auth/restaurant"
          className="inline-block mt-4 text-sm text-[var(--color-brand-secondary)] hover:underline font-medium">
          Are you a mess owner? Register →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} r={r} />
      ))}
    </div>
  );
}

function RestaurantCard({ r }: { r: HomeListing }) {
  const cover = restaurantCover(r.id);
  const slots = [r.serves_lunch && "Lunch", r.serves_dinner && "Dinner"].filter(Boolean) as string[];
  const minPrice = r.serves_lunch && r.serves_dinner
    ? Math.min(r.lunch_price, r.dinner_price)
    : r.serves_lunch ? r.lunch_price : r.dinner_price;
  const rating = r.avg_rating ?? 4.2;

  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="group block bg-white rounded-[var(--radius-card)] card-shadow hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Cover image */}
      <div className="relative overflow-hidden" style={{ paddingTop: "60%" }}>
        <Image
          src={cover}
          alt={r.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Rating pill — Zomato pattern: top-right, green background */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-green-600 rounded-full px-2 py-0.5">
          <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[11px] font-bold text-white leading-none">{rating.toFixed(1)}</span>
        </div>

        {/* Slots tag — bottom of image */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {slots.map((s) => (
            <span key={s} className="text-[10px] font-bold bg-white/90 text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded-full">
              {s === "Lunch" ? "🌞" : "🌙"} {s}
            </span>
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-[var(--color-text-primary)] text-sm leading-tight truncate">{r.name}</h3>

        {r.area && (
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1 truncate">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{r.area}</span>
          </p>
        )}

        <div className="flex items-center justify-between mt-2.5 gap-1">
          <div>
            <span className="text-sm font-extrabold text-[var(--color-brand-secondary)]">
              ₹{minPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">/mo</span>
          </div>
          <span className="text-[10px] font-semibold text-[var(--color-brand-primary)] group-hover:underline shrink-0">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
