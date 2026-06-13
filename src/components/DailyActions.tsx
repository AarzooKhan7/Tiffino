"use client";

import { useState, useTransition, lazy, Suspense } from "react";
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
}

export default function DailyActions({ subscriptionId, slots, todayStatuses, skipStats }: Props) {
  const [statuses, setStatuses] = useState<SlotState>(todayStatuses);
  const [scanning, setScanning] = useState<"lunch" | "dinner" | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleScan(slot: "lunch" | "dinner", token: string) {
    setScanning(null);
    startTransition(async () => {
      const res: ActionResult = await claimMeal(subscriptionId, slot, token);
      if (res.ok) {
        setStatuses((s) => ({ ...s, [slot]: "taken" as SlotStatus }));
        showToast(true, `${slot.charAt(0).toUpperCase() + slot.slice(1)} scanned — token consumed!`);
      } else {
        showToast(false, res.error ?? "Scan failed");
      }
    });
  }

  async function handleSkip(slot: "lunch" | "dinner") {
    startTransition(async () => {
      const res: ActionResult = await skipMeal(subscriptionId, slot);
      if (res.ok) {
        setStatuses((s) => ({ ...s, [slot]: "skipped" as SlotStatus }));
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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
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
    <div className={`rounded-2xl border-2 p-4 transition-all ${
      taken   ? "bg-green-50 border-green-200" :
      skipped ? "bg-gray-50 border-gray-200"   :
                "bg-white border-[var(--color-border)] hover:border-[var(--color-brand-secondary)]"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{emoji}</span>
        <span className="font-bold text-sm text-[var(--color-text-primary)]">{label}</span>
        {done && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            taken ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {taken ? "Taken" : "Skipped"}
          </span>
        )}
      </div>

      {!done ? (
        <div className="flex flex-col gap-2">
          <button onClick={onScan} disabled={isPending}
            className="btn-primary w-full py-2.5 text-xs rounded-xl flex items-center gap-1.5 justify-center">
            <span>📷</span> Scan QR
          </button>
          <button onClick={onSkip} disabled={isPending}
            className="w-full py-2 text-xs font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            Skip {label}
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {taken ? "Meal token consumed" : "No token consumed"}
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
        {hasLunch && (
          <SkipPill label="Lunch" used={lunchSkips} free={freeLunchRemaining} />
        )}
        {hasDinner && (
          <SkipPill label="Dinner" used={dinnerSkips} free={freeDinnerRemaining} />
        )}
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
  const pct = Math.min(100, (used / 4) * 100);
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
