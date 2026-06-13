"use client";

import { useState, useTransition } from "react";
import { sendNudge } from "./actions";

interface Props {
  studentId: string;
  studentName: string;
  tokensRemaining: number;
}

export default function NudgeButton({ studentId, studentName, tokensRemaining }: Props) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNudge() {
    startTransition(async () => {
      const res = await sendNudge(studentId, studentName, tokensRemaining);
      if (res.ok) {
        setSent(true);
      } else {
        setError(res.error ?? "Failed to send nudge");
      }
    });
  }

  if (sent) {
    return (
      <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5 font-medium">
        ✓ Nudge sent to {studentName}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        onClick={handleNudge}
        disabled={isPending}
        className="w-full bg-[var(--color-brand-secondary)] text-white font-semibold text-sm rounded-[var(--radius-btn)] py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Sending…
          </>
        ) : (
          <>🔔 Nudge about low balance</>
        )}
      </button>
    </div>
  );
}
