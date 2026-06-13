"use client";

import { useState, useTransition } from "react";
import { pauseSubscription, resumeSubscription } from "@/app/subscriptions/pause-actions";

interface Props {
  subscriptionId: string;
  isPaused: boolean;
  pauseEndsAt?: string | null;
}

export default function PauseButton({ subscriptionId, isPaused, pauseEndsAt }: Props) {
  const [paused, setPaused]   = useState(isPaused);
  const [endsAt, setEndsAt]   = useState(pauseEndsAt);
  const [days, setDays]       = useState(3);
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePause() {
    setError(null);
    startTransition(async () => {
      const res = await pauseSubscription(subscriptionId, days);
      if (res.ok) { setPaused(true); setEndsAt(res.pauseEndsAt ?? null); setOpen(false); }
      else setError(res.error ?? "Failed to pause");
    });
  }

  function handleResume() {
    setError(null);
    startTransition(async () => {
      const res = await resumeSubscription(subscriptionId);
      if (res.ok) { setPaused(false); setEndsAt(null); }
      else setError(res.error ?? "Failed to resume");
    });
  }

  if (paused) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-[var(--radius-card)] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-800 text-sm">⏸ Subscription paused</p>
            {endsAt && <p className="text-xs text-amber-700 mt-0.5">Resumes automatically on {endsAt}</p>}
          </div>
          <button
            onClick={handleResume}
            disabled={isPending}
            className="text-xs bg-amber-600 text-white px-3.5 py-2 rounded-full font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {isPending ? "…" : "Resume now"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline underline-offset-2 transition-colors"
        >
          ⏸ Pause subscription (travelling?)
        </button>
      ) : (
        <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 space-y-3">
          <div>
            <p className="font-semibold text-sm text-[var(--color-text-primary)]">Pause your subscription</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">No tokens consumed while paused. Maximum 10 days.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--color-text-secondary)] shrink-0">Pause for</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-base flex-1 py-2"
            >
              {[1,2,3,4,5,6,7,10].map((d) => (
                <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handlePause}
              disabled={isPending}
              className="btn-primary px-4 py-2 text-xs rounded-lg disabled:opacity-50"
            >
              {isPending ? "Pausing…" : "Confirm pause"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="text-xs px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
