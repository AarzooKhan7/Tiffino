"use client";

import { useActionState } from "react";
import { completeRestaurantOnboarding } from "@/app/onboarding/actions";

export default function RestaurantOnboardingForm() {
  const [error, action, pending] = useActionState<string | null, FormData>(
    async (_prev, formData) => {
      try {
        await completeRestaurantOnboarding(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong";
      }
    },
    null
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Your name <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input name="name" required placeholder="Ramesh Patel" className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Mess / restaurant name <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input name="restaurant_name" required placeholder="Shree Krishna Mess" className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Area / locality <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input name="area" required placeholder="Kothrud, Pune" className={inputCls} />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-brand-primary)] bg-red-50 rounded-[var(--radius-btn)] px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set up my mess →"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]";
