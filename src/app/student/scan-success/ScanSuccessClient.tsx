"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  slot: string;
  restaurant: string;
  tokens: number | null;
  time: string;
  date: string;
}

export default function ScanSuccessClient({ slot, restaurant, tokens, time, date }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [displayTokens, setDisplayTokens] = useState(tokens ?? 0);

  const isLunch = slot === "lunch";
  const slotLabel = isLunch ? "Lunch" : "Dinner";
  const slotEmoji = isLunch ? "🌞" : "🌙";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 750);
    const t2 = setTimeout(() => setPhase(2), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Animate token counter up once card becomes visible
  useEffect(() => {
    if (phase < 1 || tokens === null) return;
    const target = tokens;
    const start = Math.max(0, target - 6);
    let current = start;
    setDisplayTokens(start);
    const tick = () => {
      current++;
      setDisplayTokens(current);
      if (current < target) setTimeout(tick, 55);
    };
    const id = setTimeout(tick, 200);
    return () => clearTimeout(id);
  }, [phase, tokens]);

  const tokenWidth = tokens !== null
    ? `${Math.min(100, (displayTokens / 30) * 100)}%`
    : "0%";

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* ── Big animated check + confetti ── */}
        <div className="flex justify-center mb-8">
          <div className="relative w-28 h-28 flex items-center justify-center">

            {/* Confetti dots — burst outward */}
            <div className="confetti-wrap" aria-hidden="true">
              {[0,1,2,3,4,5,6,7].map((i) => (
                <div key={i} className={`confetti-dot cd-${i}`} />
              ))}
            </div>

            {/* Expanding ring */}
            <div className="check-ring" />

            {/* Green circle with SVG checkmark */}
            <div className="check-circle">
              <svg viewBox="0 0 60 60" className="w-14 h-14" fill="none">
                <path
                  d="M15 31 L26 42 L45 20"
                  stroke="white"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="check-path"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="check-title text-center mb-7">
          <h1 className="text-[26px] font-extrabold text-[var(--color-text-primary)] leading-tight">
            Enjoy your meal!
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1.5 text-sm">
            {slotEmoji} {slotLabel} token consumed
          </p>
        </div>

        {/* ── Detail card ── */}
        <div className={`success-card bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden mb-4${phase >= 1 ? " visible" : ""}`}>
          <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />

          <div className="px-5 py-5 space-y-3.5">
            <Row label="Restaurant" value={restaurant} />
            <Row label="Date" value={date} />
            <Row label="Time" value={`${time} IST`} />

            {tokens !== null && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Tokens remaining</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[var(--color-brand-primary)] tabular-nums">
                      {phase >= 1 ? displayTokens : 0}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">left</span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] rounded-full"
                    style={{ width: phase >= 1 ? tokenWidth : "0%", transition: "width 0.9s ease-out" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Warnings (visible with card) ── */}
        {phase >= 1 && tokens !== null && tokens <= 5 && tokens > 0 && (
          <div className="success-card visible bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] px-4 py-3 mb-4 text-center">
            <p className="text-sm font-semibold text-amber-800">⚠ Only {tokens} token{tokens === 1 ? "" : "s"} left</p>
            <p className="text-xs text-amber-700 mt-0.5">Renew your plan soon to keep meals uninterrupted.</p>
          </div>
        )}
        {phase >= 1 && tokens === 0 && (
          <div className="success-card visible bg-red-50 border border-red-200 rounded-[var(--radius-card)] px-4 py-3 mb-4 text-center">
            <p className="text-sm font-semibold text-red-700">No tokens remaining</p>
            <p className="text-xs text-red-600 mt-0.5">This was your last token. Please renew your plan.</p>
          </div>
        )}

        {/* ── CTA button ── */}
        <div className={`success-btn${phase >= 2 ? " visible" : ""}`}>
          <Link
            href="/student/dashboard"
            className="btn-primary w-full py-4 text-sm rounded-xl flex items-center justify-center gap-2 text-base font-bold"
          >
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}
