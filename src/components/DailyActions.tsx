"use client";

import { useState, useTransition, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { claimMeal, skipMeal, type ActionResult, type SkipStats } from "@/app/redemptions/actions";

const QRScanner = lazy(() => import("./QRScanner"));

type SlotStatus = "pending" | "taken" | "skipped";

interface SlotState {
  lunch: SlotStatus;
  dinner: SlotStatus;
}

interface Props {
  subscriptionId: string;
  slots: string[];
  todayStatuses: { lunch: SlotStatus; dinner: SlotStatus };
  skipStats: SkipStats;
  restaurantName: string;
}

export default function DailyActions({ subscriptionId, slots, todayStatuses, skipStats: initialSkipStats, restaurantName }: Props) {
  const [statuses, setStatuses] = useState<SlotState>(todayStatuses);
  const [skipStats, setSkipStats] = useState<SkipStats>(initialSkipStats);
  const [scanning, setScanning] = useState<"lunch" | "dinner" | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleScan(slot: "lunch" | "dinner", token: string) {
    startTransition(async () => {
      const res: ActionResult = await claimMeal(subscriptionId, slot, token);
      if (res.ok) {
        setScanning(null);
        setStatuses((s) => ({ ...s, [slot]: "taken" as SlotStatus }));
        const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
        const params = new URLSearchParams({
          slot,
          restaurant: restaurantName,
          tokens: String(res.tokensRemaining ?? ""),
          time: now,
        });
        router.push(`/student/scan-success?${params.toString()}`);
      } else {
        setScanning(null);
        showToast(false, res.error ?? "Scan failed");
      }
    });
  }

  async function handleSkip(slot: "lunch" | "dinner") {
    startTransition(async () => {
      const res: ActionResult = await skipMeal(subscriptionId, slot);
      if (res.ok) {
        setStatuses((s) => ({ ...s, [slot]: "skipped" as SlotStatus }));
        setSkipStats((prev) => {
          const FREE = 4;
          const newLunch  = slot === "lunch"  ? prev.lunchSkips  + 1 : prev.lunchSkips;
          const newDinner = slot === "dinner" ? prev.dinnerSkips + 1 : prev.dinnerSkips;
          return {
            lunchSkips:           newLunch,
            dinnerSkips:          newDinner,
            freeLunchRemaining:   Math.max(0, FREE - newLunch),
            freeDinnerRemaining:  Math.max(0, FREE - newDinner),
            tokensAtRisk:         Math.max(0, newLunch - FREE) + Math.max(0, newDinner - FREE),
            projectedRollover:    Math.min(newLunch, FREE) + Math.min(newDinner, FREE),
          };
        });
        showToast(true, `${slot.charAt(0).toUpperCase() + slot.slice(1)} skipped.`);
      } else {
        showToast(false, res.error ?? "Skip failed");
      }
    });
  }

  const hasBothSlots = slots.includes("lunch") && slots.includes("dinner");

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold toast-enter whitespace-nowrap ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Slot action cards */}
      <div className={`grid gap-3 ${hasBothSlots ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
        {slots.includes("lunch") && (
          <SlotCard
            slot="lunch"
            emoji="🌞"
            label="Lunch"
            status={statuses.lunch}
            isPending={isPending}
            onScan={() => setScanning("lunch")}
            onSkip={() => void handleSkip("lunch")}
          />
        )}
        {slots.includes("dinner") && (
          <SlotCard
            slot="dinner"
            emoji="🌙"
            label="Dinner"
            status={statuses.dinner}
            isPending={isPending}
            onScan={() => setScanning("dinner")}
            onSkip={() => void handleSkip("dinner")}
          />
        )}
      </div>

      {/* Skip stats */}
      <SkipStatsBar stats={skipStats} slots={slots} />

      {/* QR scanner modal */}
      {scanning && (
        <Suspense fallback={null}>
          <QRScanner
            onScan={(token) => void handleScan(scanning, token)}
            onClose={() => setScanning(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

function SlotCard({
  slot, emoji, label, status, isPending, onScan, onSkip,
}: {
  slot: string; emoji: string; label: string; status: SlotStatus;
  isPending: boolean; onScan: () => void; onSkip: () => void;
}) {
  const taken   = status === "taken";
  const skipped = status === "skipped";
  const done    = taken || skipped;

  return (
    <div className={`slot-card rounded-2xl border-2 p-4 card-enter ${
      taken   ? "bg-green-50 border-green-200 shadow-sm" :
      skipped ? "bg-gray-50 border-gray-200"             :
                "bg-white border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 hover:shadow-md"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{emoji}</span>
        <span className="font-bold text-sm text-[var(--color-text-primary)]">{label}</span>
        {done && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            taken ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {taken ? "✓ Taken" : "Skipped"}
          </span>
        )}
      </div>

      {!done ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onScan}
            disabled={isPending}
            className="btn-primary w-full py-2.5 text-xs rounded-xl flex items-center gap-1.5 justify-center"
          >
            {isPending ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : <span>📷</span>}
            {isPending ? "Verifying…" : "Scan QR"}
          </button>
          <button
            onClick={onSkip}
            disabled={isPending}
            className="w-full py-2 text-xs font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] active:scale-[0.98] transition-all"
          >
            Skip {label}
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {taken ? "Meal token consumed ✓" : "No token consumed"}
        </p>
      )}
    </div>
  );
}

function SkipStatsBar({ stats, slots }: { stats: SkipStats; slots: string[] }) {
  const { lunchSkips, dinnerSkips, freeLunchRemaining, freeDinnerRemaining, tokensAtRisk, projectedRollover } = stats;
  const hasLunch  = slots.includes("lunch");
  const hasDinner = slots.includes("dinner");

  return (
    <div className="bg-white rounded-[var(--radius-card)] card-shadow-sm px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
        Skip quota · this month
      </p>
      <div className="flex flex-wrap gap-3">
        {hasLunch  && <SkipPill label="Lunch"  used={lunchSkips}  free={freeLunchRemaining} />}
        {hasDinner && <SkipPill label="Dinner" used={dinnerSkips} free={freeDinnerRemaining} />}
      </div>
      {projectedRollover > 0 && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5">
          +{projectedRollover} token{projectedRollover > 1 ? "s" : ""} will roll over at month end
        </p>
      )}
      {tokensAtRisk > 0 && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
          ⚠ {tokensAtRisk} token{tokensAtRisk > 1 ? "s" : ""} forfeited — free skip quota exceeded
        </p>
      )}
    </div>
  );
}

function SkipPill({ label, used, free }: { label: string; used: number; free: number }) {
  const pct   = Math.min(100, (used / 4) * 100);
  const color = used < 4 ? "bg-green-400" : "bg-red-400";

  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">{label}</span>
        <span className={`text-[10px] font-semibold ${used >= 4 ? "text-red-600" : "text-[var(--color-text-muted)]"}`}>
          {used}/4 used
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
        {free > 0 ? `${free} free skip${free > 1 ? "s" : ""} left` : "No free skips left"}
      </p>
    </div>
  );
}
