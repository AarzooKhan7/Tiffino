"use client";

import { useState, useTransition } from "react";
import { sendCustomNotification } from "@/app/restaurant/subscribers/[studentId]/actions";

interface Props {
  studentId: string;
  studentName: string;
  restaurantName: string;
}

export default function NotifyComposer({ studentId, studentName, restaurantName }: Props) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!message.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await sendCustomNotification(studentId, message.trim(), restaurantName);
      if (res.ok) {
        setSent(true);
        setMessage("");
      } else {
        setError(res.error ?? "Failed to send notification");
      }
    });
  }

  if (sent) {
    return (
      <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 font-medium flex items-center gap-2">
        <span>✓</span>
        <span>Notification sent to {studentName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Write a message to ${studentName}…`}
        rows={3}
        maxLength={300}
        className="input-base resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">{message.length}/300</span>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleSend}
          disabled={isPending || !message.trim()}
          className="btn-primary px-4 py-2 text-xs rounded-lg disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPending ? "Sending…" : "📨 Send"}
        </button>
      </div>
    </div>
  );
}
