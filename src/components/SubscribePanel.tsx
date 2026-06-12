"use client";

import { useState, useTransition } from "react";
import { createSubscription } from "@/app/subscriptions/actions";

interface Props {
  restaurantId: string;
  restaurantName: string;
  basePrice: number;
  servesLunch: boolean;
  servesDinner: boolean;
}

export default function SubscribePanel({
  restaurantId,
  restaurantName,
  basePrice,
  servesLunch,
  servesDinner,
}: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (servesLunch && servesDinner) return ["lunch", "dinner"];
    if (servesLunch) return ["lunch"];
    return ["dinner"];
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = (slot: string) => {
    setSelected((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const pricePerMonth = basePrice * 30 * selected.length;

  const handleSubscribe = () => {
    if (selected.length === 0) { setError("Select at least one slot"); return; }
    setError(null);
    startTransition(async () => {
      const result = await createSubscription(restaurantId, selected);
      if (result.ok) {
        setDone(true);
        // Redirect to student dashboard after short delay
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
    <div className="mt-4 rounded-[var(--radius-card)] bg-white border border-[var(--color-border)] card-shadow px-5 py-5">
      <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Subscribe to {restaurantName}</h2>

      <p className="text-xs text-[var(--color-text-muted)] mb-3">Choose your meal slots for a 30-day plan:</p>

      <div className="flex gap-3 mb-4">
        {servesLunch && (
          <button
            type="button"
            onClick={() => toggle("lunch")}
            className={`flex-1 rounded-[var(--radius-btn)] border px-4 py-3 text-sm font-medium transition-all ${
              selected.includes("lunch")
                ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
                : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-primary)]"
            }`}>
            🌞 Lunch<br />
            <span className="text-xs font-normal opacity-80">₹{basePrice}/day</span>
          </button>
        )}
        {servesDinner && (
          <button
            type="button"
            onClick={() => toggle("dinner")}
            className={`flex-1 rounded-[var(--radius-btn)] border px-4 py-3 text-sm font-medium transition-all ${
              selected.includes("dinner")
                ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
                : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand-primary)]"
            }`}>
            🌙 Dinner<br />
            <span className="text-xs font-normal opacity-80">₹{basePrice}/day</span>
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-[var(--radius-btn)] bg-[var(--color-surface-alt)] px-4 py-3 mb-4 flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">
            {selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ")} · 30 days
          </span>
          <span className="font-bold text-[var(--color-text-primary)]">₹{pricePerMonth.toLocaleString()}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isPending || selected.length === 0}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold text-sm py-3 rounded-[var(--radius-btn)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
        {isPending ? "Processing…" : `Pay ₹${pricePerMonth.toLocaleString()} (Demo)`}
      </button>

      <p className="text-xs text-center text-[var(--color-text-muted)] mt-2">Demo mode — no real payment</p>
    </div>
  );
}
