export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertDish } from "./actions";
import DeleteDishButton from "@/components/DeleteDishButton";

const DIET_BADGE: Record<string, string> = {
  veg:    "bg-green-50 text-green-700 border-green-200",
  nonveg: "bg-red-50   text-red-700   border-red-200",
  mix:    "bg-orange-50 text-orange-700 border-orange-200",
};
const DIET_LABEL: Record<string, string> = {
  veg: "Veg", nonveg: "Non-veg", mix: "Mix",
};

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; toast?: string }>;
}) {
  const { edit: editId, toast } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!restaurant) redirect("/restaurant/setup");

  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name, description, diet_type, image_url")
    .eq("restaurant_id", restaurant.id)
    .order("name");

  const editDish = editId ? dishes?.find((d) => d.id === editId) : null;

  const toastMsg =
    toast === "added"   ? "Dish added!" :
    toast === "saved"   ? "Changes saved!" :
    toast === "deleted" ? "Dish deleted." :
    null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Toast banner */}
      {toastMsg && (
        <div className={`toast-slide rounded-[var(--radius-card)] px-5 py-3.5 flex items-center gap-3 ${
          toast === "deleted"
            ? "bg-amber-50 border border-amber-200"
            : "bg-green-50 border border-green-200"
        }`}>
          <span className={`text-lg ${toast === "deleted" ? "text-amber-600" : "text-green-600"}`}>
            {toast === "deleted" ? "🗑" : "✓"}
          </span>
          <p className={`text-sm font-semibold ${toast === "deleted" ? "text-amber-800" : "text-green-800"}`}>
            {toastMsg}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Dish Library</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {dishes?.length ?? 0} dish{dishes?.length === 1 ? "" : "es"} · appear in your weekly menu
          </p>
        </div>
      </div>

      {/* Add / Edit form */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-2 border-b border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            {editDish ? `Editing "${editDish.name}"` : "Add new dish"}
          </p>
        </div>
        <form action={upsertDish} className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editDish && <input type="hidden" name="id" value={editDish.id} />}

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Dish name *</label>
            <input
              name="name"
              required
              defaultValue={editDish?.name ?? ""}
              placeholder="Dal Tadka"
              className="input-base"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Description</label>
            <input
              name="description"
              defaultValue={editDish?.description ?? ""}
              placeholder="Slow-cooked lentils with a smoky tadka"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Diet type *</label>
            <select name="diet_type" defaultValue={editDish?.diet_type ?? "veg"} className="input-base bg-white">
              <option value="veg">🟢 Veg</option>
              <option value="nonveg">🔴 Non-Veg</option>
              <option value="mix">🟠 Mix</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Image URL</label>
            <input
              name="image_url"
              type="url"
              defaultValue={editDish?.image_url ?? ""}
              placeholder="https://…"
              className="input-base"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2 pt-1">
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm">
              {editDish ? "Save changes" : "Add dish"}
            </button>
            {editDish && (
              <a
                href="/restaurant/dishes"
                className="text-sm px-5 py-2.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors inline-flex items-center"
              >
                Cancel
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Dish list */}
      {dishes && dishes.length > 0 ? (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {dishes.map((dish) => (
              <div key={dish.id} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface-alt)] ${editId === dish.id ? "bg-orange-50" : ""}`}>
                {/* Thumbnail */}
                {dish.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[var(--color-surface-alt)]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-alt)] flex items-center justify-center text-xl shrink-0">
                    🍽
                  </div>
                )}

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{dish.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${DIET_BADGE[dish.diet_type] ?? ""}`}>
                      {DIET_LABEL[dish.diet_type] ?? dish.diet_type}
                    </span>
                  </div>
                  {dish.description && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{dish.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/restaurant/dishes?edit=${dish.id}`}
                    className="text-xs text-[var(--color-brand-primary)] hover:underline font-semibold"
                  >
                    Edit
                  </a>
                  <DeleteDishButton id={dish.id} name={dish.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-12 text-center">
          <div className="text-4xl mb-3">🍲</div>
          <p className="font-semibold text-[var(--color-text-primary)]">No dishes yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Add your first dish above to start building your menu.</p>
        </div>
      )}
    </div>
  );
}
