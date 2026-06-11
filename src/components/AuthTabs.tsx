"use client";

import { useState } from "react";
import AuthEmailForm from "./AuthEmailForm";
import AuthPasswordForm from "./AuthPasswordForm";
import type { Role } from "@/lib/types";

interface Props {
  role: Role;
}

export default function AuthTabs({ role }: Props) {
  const [tab, setTab] = useState<"magic" | "password">("password");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] mb-6 -mx-1">
        {(["password", "magic"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t
                ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t === "password" ? "🔑 Password" : "✉️ Magic link"}
          </button>
        ))}
      </div>

      {tab === "password" ? (
        <AuthPasswordForm role={role} />
      ) : (
        <AuthEmailForm role={role} />
      )}
    </div>
  );
}
