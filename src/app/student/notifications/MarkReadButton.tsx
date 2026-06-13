"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllRead } from "./actions";

export default function MarkReadButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markAllRead(userId);
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-xs font-semibold text-[var(--color-brand-secondary)] hover:underline disabled:opacity-50"
    >
      {isPending ? "Marking…" : "Mark all read"}
    </button>
  );
}
