"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/app/reviews/actions";

interface Props {
  restaurantId: string;
  restaurantName: string;
  existingRating?: number;
  existingComment?: string;
}

export default function ReviewForm({ restaurantId, restaurantName, existingRating, existingComment }: Props) {
  const [rating, setRating]   = useState(existingRating ?? 0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating === 0) { setError("Please select a star rating"); return; }
    setError(null);
    startTransition(async () => {
      const res = await submitReview(restaurantId, rating, comment);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Failed to submit review");
    });
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[var(--radius-card)] px-5 py-4 text-center">
        <p className="text-2xl mb-1">🎉</p>
        <p className="font-semibold text-green-800 text-sm">Review submitted — thank you!</p>
      </div>
    );
  }

  const displayRating = hover || rating;

  return (
    <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-5">
      <h3 className="font-bold text-[var(--color-text-primary)] text-sm mb-1">
        {existingRating ? "Update your review" : `Rate ${restaurantName}`}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Only subscribers can review. One review per mess.</p>

      {/* Star picker */}
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
            className="text-2xl transition-transform hover:scale-110 active:scale-95"
          >
            <span className={displayRating >= star ? "text-yellow-400" : "text-gray-200"}>★</span>
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-1 text-sm font-semibold text-[var(--color-text-secondary)] self-center">
            {["", "Poor", "Below average", "Average", "Good", "Excellent"][displayRating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)…"
        rows={3}
        maxLength={400}
        className="input-base resize-none text-sm"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[var(--color-text-muted)]">{comment.length}/400</span>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="btn-primary px-4 py-2 text-xs rounded-lg disabled:opacity-50"
        >
          {isPending ? "Submitting…" : existingRating ? "Update" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
