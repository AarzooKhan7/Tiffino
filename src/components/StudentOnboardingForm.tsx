"use client";

import { useActionState } from "react";
import { completeStudentOnboarding } from "@/app/onboarding/actions";

const DIET_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain"];

export default function StudentOnboardingForm() {
  const [error, action, pending] = useActionState<string | null, FormData>(
    async (_prev, formData) => {
      try {
        await completeStudentOnboarding(formData);
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
          Full name <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input
          name="full_name"
          required
          placeholder="Aryan Shah"
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Location / Area <span className="text-[var(--color-brand-primary)]">*</span>
        </label>
        <input
          name="location"
          required
          placeholder="Koregaon Park, Pune"
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Diet preference
        </label>
        <select
          name="diet_preference"
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
        >
          <option value="">Prefer not to say</option>
          {DIET_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
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
        {pending ? "Saving…" : "Continue →"}
      </button>
    </form>
  );
}
