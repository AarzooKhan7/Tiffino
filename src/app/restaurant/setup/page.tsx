import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertRestaurant } from "./actions";

export default async function RestaurantSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  const prefill = {
    name:               restaurant?.name               ?? "",
    address:            restaurant?.address            ?? "",
    area:               restaurant?.area               ?? "",
    base_price:         restaurant?.base_price         ?? "",
    serves_lunch:       restaurant?.serves_lunch       ?? true,
    serves_dinner:      restaurant?.serves_dinner      ?? true,
    lunch_skip_cutoff:  (restaurant?.lunch_skip_cutoff  as string | null)?.substring(0, 5) ?? "10:00",
    dinner_skip_cutoff: (restaurant?.dinner_skip_cutoff as string | null)?.substring(0, 5) ?? "18:00",
  };

  const isEdit = !!restaurant;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        {isEdit ? "Edit Restaurant" : "Set Up Your Restaurant"}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        This information is shown to students on the public listing.
      </p>

      <form action={upsertRestaurant} className="card-shadow rounded-[var(--radius-card)] bg-white p-6 flex flex-col gap-4">
        <Field label="Restaurant / mess name *">
          <input name="name" required defaultValue={prefill.name} placeholder="Shree Krishna Mess"
            className={inputCls} />
        </Field>

        <Field label="Address">
          <input name="address" defaultValue={prefill.address} placeholder="123, MG Road"
            className={inputCls} />
        </Field>

        <Field label="Area / locality *">
          <input name="area" required defaultValue={prefill.area} placeholder="Kothrud, Pune"
            className={inputCls} />
        </Field>

        <Field label="Base price per slot (₹) *">
          <input name="base_price" type="number" min="0" step="0.01" required
            defaultValue={prefill.base_price} placeholder="60"
            className={inputCls} />
        </Field>

        <div>
          <p className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Meal slots offered
          </p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="serves_lunch" defaultChecked={prefill.serves_lunch}
                className="accent-[var(--color-brand-primary)] w-4 h-4" />
              Lunch
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="serves_dinner" defaultChecked={prefill.serves_dinner}
                className="accent-[var(--color-brand-primary)] w-4 h-4" />
              Dinner
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Lunch skip cutoff">
            <input name="lunch_skip_cutoff" type="time" defaultValue={prefill.lunch_skip_cutoff}
              className={inputCls} />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Students can&apos;t skip after this time (IST)
            </p>
          </Field>
          <Field label="Dinner skip cutoff">
            <input name="dinner_skip_cutoff" type="time" defaultValue={prefill.dinner_skip_cutoff}
              className={inputCls} />
          </Field>
        </div>

        <button type="submit"
          className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity">
          {isEdit ? "Save changes" : "Create restaurant"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]";
