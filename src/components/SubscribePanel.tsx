"use client";

import { useState, useTransition } from "react";
import { createSubscription } from "@/app/subscriptions/actions";
import { calcPlanPrice } from "@/lib/payment";

interface Props {
  restaurantId: string;
  restaurantName: string;
  servesLunch: boolean;
  servesDinner: boolean;
  lunchPrice: number;
  dinnerPrice: number;
}

export default function SubscribePanel({
  restaurantId,
  restaurantName,
  servesLunch,
  servesDinner,
  lunchPrice,
  dinnerPrice,
}: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (servesLunch && servesDinner) return ["lunch", "dinner"];
    if (servesLunch) return ["lunch"];
    return ["dinner"];
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = (slot: string) =>
    setSelected((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );

  const price  = calcPlanPrice(selected, lunchPrice, dinnerPrice);
  const tokens = 30 * selected.length;

  const handleSubscribe = () => {
    if (selected.length === 0) { setError("Select at least one slot"); return; }
    setError(null);
    startTransition(async () => {
      const result = await createSubscription(restaurantId, selected);
      if (result.ok) {
        setDone(true);
        setTimeout(() => { window.location.href = "/student/dashboard"; }, 1200);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  if (done) {
    return (
      <div className="mt-4 rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-5 py-4 text-center">
        <p className="text-green-700 font-semibold text-sm">🎉 Subscribed! Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-white card-shadow px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-base">🍱</div>
        <div>
          <h2 className="font-bold text-[var(--color-text-primary)] text-sm">
            Subscribe to {restaurantName}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">30-day plan · tokens credited instantly</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
        Select slots
      </p>
      <div className="flex gap-3 mb-4">
        {servesLunch && (
          <button
            type="button"
            onClick={() => toggle("lunch")}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
              selected.includes("lunch")
                ? "bg-orange-50 border-[var(--color-brand-secondary)] text-[var(--color-brand-secondary)]"
                : "bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-secondary)]"
            }`}
          >
            <div className="text-xl mb-1">🌞</div>
            <div className="font-bold">Lunch</div>
            <div className="text-xs font-semibold mt-0.5">
              ₹{lunchPrice.toLocaleString()}<span className="font-normal opacity-60">/month</span>
            </div>
            <div className="text-[10px] opacity-60 mt-0.5">30 tokens</div>
          </button>
        )}
        {servesDinner && (
          <button
            type="button"
            onClick={() => toggle("dinner")}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
              selected.includes("dinner")
                ? "bg-indigo-50 border-indigo-400 text-indigo-600"
                : "bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-400"
            }`}
          >
            <div className="text-xl mb-1">🌙</div>
            <div className="font-bold">Dinner</div>
            <div className="text-xs font-semibold mt-0.5">
              ₹{dinnerPrice.toLocaleString()}<span className="font-normal opacity-60">/month</span>
            </div>
            <div className="text-[10px] opacity-60 mt-0.5">30 tokens</div>
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                30 days · {selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ")}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{tokens} meal tokens included</p>
            </div>
            <span className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              ₹{price.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isPending || selected.length === 0}
        className="btn-primary w-full py-3.5 text-sm rounded-xl"
      >
        {isPending ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </span>
        ) : selected.length > 0 ? (
          `Pay ₹${price.toLocaleString()} (Demo)`
        ) : (
          "Select a slot to continue"
        )}
      </button>

      <p className="text-[11px] text-center text-[var(--color-text-muted)] mt-2.5 flex items-center justify-center gap-1">
        <span>🔒</span> Demo mode — no real payment is charged
      </p>
    </div>
  );
}
