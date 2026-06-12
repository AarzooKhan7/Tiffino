import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertDish, deleteDish } from "./actions";

const DIET_DOT: Record<string, string> = {
  veg:    "diet-dot diet-dot-veg",
  nonveg: "diet-dot diet-dot-nonveg",
  mix:    "diet-dot diet-dot-mix",
};
const DIET_BADGE: Record<string, string> = {
  veg:    "bg-green-50 text-green-700 border-green-200",
  nonveg: "bg-red-50 text-red-700 border-red-200",
  mix:    "bg-orange-50 text-orange-700 border-orange-200",
};

const inputCls = "input-base";

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit: editId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/restaurant/setup");

  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name, description, diet_type, image_url")
    .eq("restaurant_id", restaurant.id)
    .order("name");

  const editDish = editId ? dishes?.find((d) => d.id === editId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dish Library</h1>
        <span className="text-sm text-[var(--color-text-muted)]">{dishes?.length ?? 0} dishes</span>
      </div>

      {/* Add / Edit form */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white p-5">
        <h2 className="text-base font-semibold mb-4">
          {editDish ? `Edit "${editDish.name}"` : "Add new dish"}
        </h2>
        <form action={upsertDish} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {editDish && <input type="hidden" name="id" value={editDish.id} />}

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
              Dish name *
            </label>
            <input name="name" required defaultValue={editDish?.name ?? ""} placeholder="Dal Tadka"
              className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
              Description
            </label>
            <input name="description" defaultValue={editDish?.description ?? ""}
              placeholder="Slow-cooked lentils with a smoky tadka"
              className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
              Diet type *
            </label>
            <select name="diet_type" defaultValue={editDish?.diet_type ?? "veg"}
              className={inputCls + " bg-white"}>
              <option value="veg">🟢 Veg</option>
              <option value="nonveg">🔴 Non-Veg</option>
              <option value="mix">🟠 Mix</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
              Image URL (optional)
            </label>
            <input name="image_url" type="url" defaultValue={editDish?.image_url ?? ""}
              placeholder="https://…"
              className={inputCls} />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button type="submit"
              className="bg-[var(--color-brand-primary)] text-white text-sm font-semibold px-5 py-2 rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity">
              {editDish ? "Save changes" : "Add dish"}
            </button>
            {editDish && (
              <a href="/restaurant/dishes"
                className="text-sm px-4 py-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
                Cancel
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Dish list */}
      {dishes && dishes.length > 0 ? (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white divide-y divide-[var(--color-border)]">
          {dishes.map((dish) => (
            <div key={dish.id} className="flex items-start gap-3 px-5 py-4">
              {dish.image_url ? (
                <img src={dish.image_url} alt={dish.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[var(--color-surface-alt)]" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-alt)] flex items-center justify-center text-xl shrink-0">
                  🍽
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`${DIET_DOT[dish.diet_type] ?? "diet-dot"}`} />
                  <span className="font-medium text-sm text-[var(--color-text-primary)]">{dish.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DIET_BADGE[dish.diet_type] ?? ""}`}>
                    {dish.diet_type}
                  </span>
                </div>
                {dish.description && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{dish.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`/restaurant/dishes?edit=${dish.id}`}
                  className="text-xs text-[var(--color-brand-secondary)] hover:underline font-medium">
                  Edit
                </a>
                <form action={deleteDish}>
                  <input type="hidden" name="id" value={dish.id} />
                  <button type="submit"
                    className="text-xs text-red-500 hover:underline font-medium"
                    onClick={(e) => { if (!confirm(`Delete "${dish.name}"?`)) e.preventDefault(); }}>
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-10 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">No dishes yet — add your first one above.</p>
        </div>
      )}
    </div>
  );
}
