export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import RestaurantQR from "@/components/RestaurantQR";
import { upsertRestaurant } from "./actions";

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]";

export default async function RestaurantSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  const prefill = {
    owner_name:         profile?.name               ?? "",
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

  // Generate QR for display if restaurant exists and has a token
  let qrDataUrl: string | null = null;
  if (restaurant?.qr_token) {
    qrDataUrl = await QRCode.toDataURL(restaurant.qr_token as string, {
      width: 300,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).catch(() => null);
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {isEdit ? "Restaurant Settings" : "Set Up Your Restaurant"}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {isEdit
            ? "Update your profile and restaurant details shown to students."
            : "Add your details so students can find and subscribe to you."}
        </p>
      </div>

      <form action={upsertRestaurant} className="card-shadow rounded-[var(--radius-card)] bg-white p-6 flex flex-col gap-4">
        {/* Owner profile section */}
        <div className="pb-4 border-b border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Your profile
          </p>
          <Field label="Your name">
            <input
              name="owner_name"
              defaultValue={prefill.owner_name}
              placeholder="Full name"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Restaurant details */}
        <Field label="Restaurant / mess name *">
          <input
            name="name"
            required
            defaultValue={prefill.name}
            placeholder="Shree Krishna Mess"
            className={inputCls}
          />
        </Field>

        <Field label="Address">
          <input
            name="address"
            defaultValue={prefill.address}
            placeholder="123, MG Road"
            className={inputCls}
          />
        </Field>

        <Field label="Area / locality *">
          <input
            name="area"
            required
            defaultValue={prefill.area}
            placeholder="Kothrud, Pune"
            className={inputCls}
          />
        </Field>

        <Field label="Base price per slot (₹) *">
          <input
            name="base_price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={prefill.base_price}
            placeholder="60"
            className={inputCls}
          />
        </Field>

        <div>
          <p className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Meal slots offered
          </p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="serves_lunch"
                defaultChecked={prefill.serves_lunch}
                className="accent-[var(--color-brand-primary)] w-4 h-4"
              />
              Lunch
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="serves_dinner"
                defaultChecked={prefill.serves_dinner}
                className="accent-[var(--color-brand-primary)] w-4 h-4"
              />
              Dinner
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Lunch skip cutoff">
            <input
              name="lunch_skip_cutoff"
              type="time"
              defaultValue={prefill.lunch_skip_cutoff}
              className={inputCls}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Students can&apos;t skip after this time (IST)
            </p>
          </Field>
          <Field label="Dinner skip cutoff">
            <input
              name="dinner_skip_cutoff"
              type="time"
              defaultValue={prefill.dinner_skip_cutoff}
              className={inputCls}
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-2.5 text-sm hover:opacity-90 transition-opacity"
        >
          {isEdit ? "Save changes" : "Create restaurant"}
        </button>
      </form>

      {/* QR code — only shown when editing */}
      {isEdit && qrDataUrl && (
        <RestaurantQR qrDataUrl={qrDataUrl} restaurantName={restaurant!.name} />
      )}

      {/* Sign out */}
      {isEdit && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-1">
          <form method="POST" action="/auth/logout">
            <button
              type="submit"
              className="w-full text-sm font-semibold text-red-600 hover:text-red-700 py-3.5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
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
