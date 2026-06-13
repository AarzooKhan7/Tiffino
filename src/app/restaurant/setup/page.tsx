export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import RestaurantQR from "@/components/RestaurantQR";
import { upsertRestaurant } from "./actions";

const inputCls =
  "w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] bg-white";

export default async function RestaurantSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  const rest = restaurant as Record<string, unknown> | null;

  const prefill = {
    owner_name:    profile?.name                 ?? "",
    name:          restaurant?.name              ?? "",
    address:       restaurant?.address           ?? "",
    area:          restaurant?.area              ?? "",
    lunch_price:   Number(rest?.lunch_price  ?? 1500),
    dinner_price:  Number(rest?.dinner_price ?? 1500),
    serves_lunch:  restaurant?.serves_lunch  ?? true,
    serves_dinner: restaurant?.serves_dinner ?? true,
  };

  const isEdit = !!restaurant;

  let qrDataUrl: string | null = null;
  if (restaurant?.qr_token) {
    qrDataUrl = await QRCode.toDataURL(restaurant.qr_token as string, {
      width: 300, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" },
    }).catch(() => null);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          {isEdit ? "Settings" : "Set Up Your Restaurant"}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {isEdit ? "Manage your profile, pricing and restaurant details." : "Add your details so students can find and subscribe."}
        </p>
      </div>

      {/* Success toast */}
      {saved === "1" && (
        <div className="rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-5 py-3.5 flex items-center gap-3">
          <span className="text-green-600 text-lg">✓</span>
          <p className="text-sm font-semibold text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <form action={upsertRestaurant} className="space-y-4">
        {/* ── Profile ── */}
        <Section title="Your profile">
          <Field label="Your name">
            <input name="owner_name" defaultValue={prefill.owner_name} placeholder="Full name" className={inputCls} />
          </Field>
        </Section>

        {/* ── Restaurant details ── */}
        <Section title="Restaurant details">
          <Field label="Restaurant / mess name *">
            <input name="name" required defaultValue={prefill.name} placeholder="Shree Krishna Mess" className={inputCls} />
          </Field>
          <Field label="Area / locality *">
            <input name="area" required defaultValue={prefill.area} placeholder="Kothrud, Pune" className={inputCls} />
          </Field>
          <Field label="Address">
            <input name="address" defaultValue={prefill.address} placeholder="123, MG Road" className={inputCls} />
          </Field>
        </Section>

        {/* ── Pricing ── */}
        <Section title="Subscription pricing" subtitle="Shown live to students on your mess page.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lunch (₹/month)">
              <input name="lunch_price" type="number" min="0" step="1"
                defaultValue={prefill.lunch_price} placeholder="1500" className={inputCls} />
            </Field>
            <Field label="Dinner (₹/month)">
              <input name="dinner_price" type="number" min="0" step="1"
                defaultValue={prefill.dinner_price} placeholder="1500" className={inputCls} />
            </Field>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">30 meal tokens credited per slot per month.</p>
        </Section>

        {/* ── Meal slots ── */}
        <Section title="Meal slots" subtitle="Toggle which meals you serve. Students will only be able to subscribe to active slots.">
          <div className="space-y-4">
            <ToggleRow
              name="serves_lunch"
              emoji="🌞"
              label="Serves Lunch"
              sublabel="Scanning open from 11:00 AM IST"
              defaultChecked={prefill.serves_lunch}
            />
            <ToggleRow
              name="serves_dinner"
              emoji="🌙"
              label="Serves Dinner"
              sublabel="Scanning open from 5:00 PM IST"
              defaultChecked={prefill.serves_dinner}
            />
          </div>
        </Section>

        <button type="submit"
          className="w-full bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] py-3 text-sm hover:opacity-90 transition-opacity">
          {isEdit ? "Save changes" : "Create restaurant"}
        </button>
      </form>

      {isEdit && qrDataUrl && (
        <RestaurantQR qrDataUrl={qrDataUrl} restaurantName={restaurant!.name} />
      )}

      {isEdit && (
        <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
          <form method="POST" action="/auth/logout">
            <button type="submit"
              className="w-full text-sm font-semibold text-red-500 py-4 hover:bg-red-50 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5 pb-5 pt-3 space-y-3">{children}</div>
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

function ToggleRow({
  name, emoji, label, sublabel, defaultChecked,
}: {
  name: string; emoji: string; label: string; sublabel: string; defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{sublabel}</p>
        </div>
      </div>
      {/* CSS toggle switch — no JS needed */}
      <div className="relative shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full transition-colors peer-checked:bg-[var(--color-brand-primary)] cursor-pointer" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 cursor-pointer" />
      </div>
    </label>
  );
}
