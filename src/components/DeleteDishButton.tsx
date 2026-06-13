"use client";

import { useTransition } from "react";
import { deleteDish } from "@/app/restaurant/dishes/actions";

export default function DeleteDishButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("id", id);
    startTransition(() => deleteDish(formData));
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
