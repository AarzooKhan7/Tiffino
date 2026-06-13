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

  const isLunch   = slot === "lunch";
  const slotLabel = isLunch ? "Lunch" : "Dinner";
  const slotEmoji = isLunch ? "🌞" : "🌙";

  // Phase timing: check-circle (0ms) → card slide (700ms) → button (1250ms)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Token counter animation — runs when card becomes visible
  useEffect(() => {
    if (phase < 1 || tokens === null || tokens === 0) {
      if (tokens === 0) setDisplayTokens(0);
      return;
    }
    const target = tokens;
    const start  = Math.max(0, target - 8);
    let current  = start;
    let stopped  = false;
    setDisplayTokens(start);
    const tick = () => {
      if (stopped) return;
      current = Math.min(current + 1, target);
      setDisplayTokens(current);
      if (current < target) setTimeout(tick, 48);
    };
    const id = setTimeout(tick, 180);
    return () => { stopped = true; clearTimeout(id); };
  }, [phase, tokens]);

  const tokenPct = tokens !== null ? `${Math.min(100, (displayTokens / 30) * 100)}%` : "0%";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg, #fff8f5 0%, #fdf4ff 100%)" }}>
      <div className="w-full max-w-sm">

        {/* ── Animated checkmark + confetti ─────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 flex items-center justify-center">

            {/* 12 confetti dots */}
            <div className="confetti-wrap" aria-hidden="true">
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
                <div key={i} className={`confetti-dot cd-${i}`} />
              ))}
            </div>

            {/* Outer ring burst */}
            <div className="check-ring" />
            {/* Inner ring */}
            <div className="check-ring-2" />

            {/* Green circle + checkmark */}
            <div className="check-circle">
              <svg viewBox="0 0 60 60" className="w-14 h-14" fill="none">
                <path
                  d="M14 31 L25 43 L46 19"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="check-path"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="check-title text-center mb-7">
          <h1 className="text-[28px] font-extrabold text-[var(--color-text-primary)] leading-tight">
            Enjoy your meal! 🎉
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-sm">
            {slotEmoji} {slotLabel} token consumed successfully
          </p>
        </div>

        {/* ── Detail card ───────────────────────────────────────── */}
        <div className={`success-card bg-white rounded-[var(--radius-card)] card-shadow-lg overflow-hidden mb-4${phase >= 1 ? " visible" : ""}`}>
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />

          <div className="px-5 py-5 space-y-4">
            <Row label="Restaurant" value={restaurant} />
            <Row label="Date"       value={date} />
            <Row label="Time"       value={`${time} IST`} />

            {tokens !== null && (
              <div className="pt-3.5 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Tokens remaining</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[var(--color-brand-primary)] tabular-nums">
                      {phase >= 1 ? displayTokens : 0}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">/ 30</span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-secondary))",
                      width: phase >= 1 ? tokenPct : "0%",
                      transition: "width 1.0s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Low token warnings ────────────────────────────────── */}
        {phase >= 1 && tokens !== null && tokens > 0 && tokens <= 5 && (
          <div className="success-card visible bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] px-4 py-3.5 mb-4 text-center">
            <p className="text-sm font-bold text-amber-800">⚠ Only {tokens} token{tokens === 1 ? "" : "s"} left</p>
            <p className="text-xs text-amber-700 mt-0.5">Renew your plan soon to keep meals uninterrupted.</p>
          </div>
        )}
        {phase >= 1 && tokens === 0 && (
          <div className="success-card visible bg-red-50 border border-red-200 rounded-[var(--radius-card)] px-4 py-3.5 mb-4 text-center">
            <p className="text-sm font-bold text-red-700">No tokens remaining</p>
            <p className="text-xs text-red-600 mt-0.5">This was your last token. Please renew your plan.</p>
          </div>
        )}

        {/* ── CTA button ────────────────────────────────────────── */}
        <div className={`success-btn${phase >= 2 ? " visible" : ""}`}>
          <Link
            href="/student/dashboard"
            className="btn-primary w-full py-4 text-base rounded-2xl flex items-center justify-center gap-2 font-extrabold shadow-lg"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Tiny acknowledgment */}
        {phase >= 2 && (
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-4 success-pop">
            Your meal has been recorded ✓
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className="text-sm font-bold text-[var(--color-text-primary)] text-right">{value}</span>
    </div>
  );
}
