import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nowIST, todayISODate } from "@/lib/ist";
import { upsertMaterial, deleteMaterial } from "./material-actions";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const UNITS = ["g", "ml", "piece", "kg", "L"];

interface Material { id: string; material_name: string; quantity_g: number; unit: string }
interface Dish { id: string; name: string; diet_type: string; materials: Material[] }

function fmtQty(qty: number, unit: string): string {
  if (unit === "g"  && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`;
  if (unit === "ml" && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.?0+$/, "")} L`;
  return `${qty % 1 === 0 ? qty : qty.toFixed(1)} ${unit}`;
}

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ dish?: string; saved?: string }>;
}) {
  const { dish: activeDishId, saved } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/restaurant");

  const [{ data: profile }, { data: restaurant }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("restaurants")
      .select("id, name, area, serves_lunch, serves_dinner")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  if (!profile || profile.role !== "restaurant") redirect("/");
  if (!restaurant) redirect("/restaurant/setup");

  const now      = nowIST();
  const todayIdx = (now.getDay() + 6) % 7;
  const todayStr = todayISODate();

  // Tomorrow's day index
  const tomorrowIdx = (todayIdx + 1) % 7;
  const tomorrow    = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const service = createServiceClient();

  // ── Fetch dishes first (needed for material_requirements .in() filter) ──
  const { data: dishRows } = await supabase
    .from("dishes")
    .select("id, name, diet_type")
    .eq("restaurant_id", restaurant.id)
    .order("name");

  const dishIds: string[] = dishRows && dishRows.length > 0
    ? dishRows.map((d) => d.id as string)
    : ["00000000-0000-0000-0000-000000000000"];

  // ── Fetch the rest in parallel ───────────────────────────────────────────
  const [
    { data: todayMenuRows },
    { data: tomorrowMenuRows },
    { data: allSubs },
    { data: todayRedemptions },
    { data: materialRows },
  ] = await Promise.all([
    // Today's menu
    supabase.from("weekly_menu")
      .select("meal_type, dish_id, dish:dish_id(id, name, diet_type)")
      .eq("restaurant_id", restaurant.id)
      .eq("day_of_week", todayIdx),
    // Tomorrow's menu
    supabase.from("weekly_menu")
      .select("meal_type, dish_id, dish:dish_id(id, name, diet_type)")
      .eq("restaurant_id", restaurant.id)
      .eq("day_of_week", tomorrowIdx),
    // Active subscriptions (for headcount)
    service.from("subscriptions")
      .select("slots, paused_at")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "active"),
    // Today's redemptions (skip/taken)
    service.from("redemptions")
      .select("meal_type, status")
      .eq("restaurant_id", restaurant.id)
      .eq("meal_date", todayStr),
    // All material requirements for this restaurant's dishes
    service.from("material_requirements")
      .select("id, dish_id, material_name, quantity_g, unit")
      .in("dish_id", dishIds),
  ]);

  // ── Build dish → materials map ──────────────────────────────────────────
  const matsByDish: Record<string, Material[]> = {};
  for (const m of materialRows ?? []) {
    const did = m.dish_id as string;
    if (!matsByDish[did]) matsByDish[did] = [];
    matsByDish[did].push({ id: m.id as string, material_name: m.material_name as string, quantity_g: Number(m.quantity_g), unit: m.unit as string });
  }

  const dishes: Dish[] = (dishRows ?? []).map((d) => ({
    id: d.id, name: d.name, diet_type: d.diet_type,
    materials: matsByDish[d.id] ?? [],
  }));

  // ── Headcount per slot (same logic as dashboard) ────────────────────────
  let lunchExpected = 0, dinnerExpected = 0;
  let lunchSkipped = 0, dinnerSkipped = 0;
  let lunchTaken = 0, dinnerTaken = 0;

  for (const s of allSubs ?? []) {
    if (s.paused_at) continue; // paused — don't count
    const slots = (s.slots as string[] | null) ?? [];
    if (slots.includes("lunch"))  lunchExpected++;
    if (slots.includes("dinner")) dinnerExpected++;
  }
  for (const r of todayRedemptions ?? []) {
    if (r.meal_type === "lunch") {
      if (r.status === "skipped") lunchSkipped++;
      if (r.status === "taken")   lunchTaken++;
    } else {
      if (r.status === "skipped") dinnerSkipped++;
      if (r.status === "taken")   dinnerTaken++;
    }
  }

  const lunchRemaining  = Math.max(0, lunchExpected  - lunchSkipped  - lunchTaken);
  const dinnerRemaining = Math.max(0, dinnerExpected - dinnerSkipped - dinnerTaken);

  // ── Extract today's dish ids per slot ───────────────────────────────────
  function extractDishId(raw: unknown): string | null {
    if (!raw) return null;
    const d = Array.isArray(raw) ? raw[0] : raw;
    if (!d || typeof d !== "object") return null;
    return (d as Record<string, unknown>).id as string ?? null;
  }
  function extractDishName(raw: unknown): string {
    if (!raw) return "—";
    const d = Array.isArray(raw) ? raw[0] : raw;
    if (!d || typeof d !== "object") return "—";
    return String((d as Record<string, unknown>).name ?? "—");
  }

  const todayLunchRow  = (todayMenuRows ?? []).find((r) => r.meal_type === "lunch");
  const todayDinnerRow = (todayMenuRows ?? []).find((r) => r.meal_type === "dinner");
  const todayLunchDishId  = extractDishId(todayLunchRow?.dish);
  const todayDinnerDishId = extractDishId(todayDinnerRow?.dish);

  const tomorrowLunchRow  = (tomorrowMenuRows ?? []).find((r) => r.meal_type === "lunch");
  const tomorrowDinnerRow = (tomorrowMenuRows ?? []).find((r) => r.meal_type === "dinner");

  // ── Compute material totals for a given (dishId, servings) set ──────────
  function computeMaterials(slots: { dishId: string | null; servings: number }[]): { name: string; totalQty: number; unit: string }[] {
    const totals: Record<string, { totalQty: number; unit: string }> = {};
    for (const { dishId, servings } of slots) {
      if (!dishId || servings <= 0) continue;
      const mats = matsByDish[dishId] ?? [];
      for (const m of mats) {
        const key = `${m.material_name}|||${m.unit}`;
        if (!totals[key]) totals[key] = { totalQty: 0, unit: m.unit };
        totals[key].totalQty += m.quantity_g * servings;
      }
    }
    return Object.entries(totals)
      .map(([key, v]) => ({ name: key.split("|||")[0], ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const todayMaterials = computeMaterials([
    { dishId: todayLunchDishId,  servings: lunchRemaining },
    { dishId: todayDinnerDishId, servings: dinnerRemaining },
  ]);

  // Tomorrow: use expected counts (full subscribed, no skips yet)
  const tomorrowLunchDishId  = extractDishId(tomorrowLunchRow?.dish);
  const tomorrowDinnerDishId = extractDishId(tomorrowDinnerRow?.dish);
  const tomorrowMaterials = computeMaterials([
    { dishId: tomorrowLunchDishId,  servings: lunchExpected },
    { dishId: tomorrowDinnerDishId, servings: dinnerExpected },
  ]);

  const activeDish = activeDishId ? dishes.find((d) => d.id === activeDishId) : null;

  const skipSavings = computeMaterials([
    { dishId: todayLunchDishId,  servings: lunchSkipped },
    { dishId: todayDinnerDishId, servings: dinnerSkipped },
  ]);

  const hasMaterialData = todayMaterials.length > 0;
  const totalSkips = lunchSkipped + dinnerSkipped;

  return (
    <div className="space-y-6 max-w-3xl mx-auto page-fade">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Kitchen</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {DAY_NAMES[todayIdx]} · {restaurant.name} · live as of {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* ── Today's headcount summary ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HeadcountCard label="Lunch subscribed"  value={lunchExpected}  color="orange" />
        <HeadcountCard label="Dinner subscribed" value={dinnerExpected} color="orange" />
        <HeadcountCard label="Skipped today"     value={totalSkips}     color={totalSkips > 0 ? "amber" : "gray"} />
        <HeadcountCard label="Still to serve"    value={lunchRemaining + dinnerRemaining} color="brand" />
      </div>

      {/* ── Today's slot breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {restaurant.serves_lunch && (
          <SlotForecastCard
            slot="Lunch"
            emoji="🌞"
            dishName={extractDishName(todayLunchRow?.dish)}
            expected={lunchExpected}
            skipped={lunchSkipped}
            taken={lunchTaken}
            remaining={lunchRemaining}
          />
        )}
        {restaurant.serves_dinner && (
          <SlotForecastCard
            slot="Dinner"
            emoji="🌙"
            dishName={extractDishName(todayDinnerRow?.dish)}
            expected={dinnerExpected}
            skipped={dinnerSkipped}
            taken={dinnerTaken}
            remaining={dinnerRemaining}
          />
        )}
      </div>

      {/* ── Today's material shopping list ── */}
      <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Today&apos;s prep list</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Raw materials needed for {lunchRemaining + dinnerRemaining} remaining servings
            </p>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {hasMaterialData ? `${todayMaterials.length} ingredient${todayMaterials.length === 1 ? "" : "s"}` : ""}
          </span>
        </div>

        {!hasMaterialData ? (
          <div className="px-5 py-8 text-center">
            <span className="text-3xl block mb-2">📋</span>
            {todayMaterials.length === 0 && (todayLunchDishId || todayDinnerDishId) ? (
              <>
                <p className="font-semibold text-[var(--color-text-primary)] text-sm">No materials defined yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Add raw materials to today&apos;s dishes below and the prep list will appear here.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[var(--color-text-primary)] text-sm">No menu set for today</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  <Link href="/restaurant/menu" className="text-[var(--color-brand-primary)] hover:underline">Build your weekly menu →</Link>
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {todayMaterials.map((m) => (
              <div key={m.name} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sm shrink-0">🧂</span>
                  <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{m.name}</span>
                </div>
                <span className="font-extrabold text-[var(--color-brand-primary)] text-sm shrink-0 tabular-nums">
                  {fmtQty(m.totalQty, m.unit)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Skip savings callout */}
        {totalSkips > 0 && skipSavings.length > 0 && (
          <div className="mx-4 mb-4 mt-1 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-xs font-bold text-green-800 mb-1.5">
              ♻ {totalSkips} skip{totalSkips > 1 ? "s" : ""} saved today
            </p>
            <div className="flex flex-wrap gap-2">
              {skipSavings.map((m) => (
                <span key={m.name} className="text-xs text-green-700 bg-green-100 rounded-full px-2.5 py-1 font-semibold">
                  {fmtQty(m.totalQty, m.unit)} {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Tomorrow's preview ── */}
      <div className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text-primary)]">Tomorrow&apos;s preview</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {DAY_NAMES[tomorrowIdx]} · based on current subscriber count (no skips yet)
          </p>
        </div>

        {tomorrowMaterials.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              {tomorrowLunchDishId || tomorrowDinnerDishId
                ? "Add materials to tomorrow's dishes to see the prep list."
                : "No menu set for tomorrow."}
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 pt-3 pb-1 flex gap-4 text-xs text-[var(--color-text-muted)]">
              {tomorrowLunchDishId  && <span>🌞 {extractDishName(tomorrowLunchRow?.dish)}</span>}
              {tomorrowDinnerDishId && <span>🌙 {extractDishName(tomorrowDinnerRow?.dish)}</span>}
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {tomorrowMaterials.map((m) => (
                <div key={m.name} className="flex items-center justify-between px-5 py-3 gap-4">
                  <span className="text-sm text-[var(--color-text-secondary)] truncate">{m.name}</span>
                  <span className="font-bold text-[var(--color-text-primary)] text-sm shrink-0 tabular-nums">
                    {fmtQty(m.totalQty, m.unit)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Material requirements editor ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Raw material definitions</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Define ingredients per dish — drives the prep list above</p>
          </div>
        </div>

        {/* Saved toast */}
        {saved === "1" && (
          <div className="mb-3 toast-slide rounded-[var(--radius-card)] bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm font-semibold text-green-800">Material saved!</p>
          </div>
        )}

        {dishes.length === 0 ? (
          <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-8 text-center">
            <span className="text-3xl block mb-2">🍽</span>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">No dishes yet</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              <Link href="/restaurant/dishes" className="text-[var(--color-brand-primary)] hover:underline">Add dishes to your library →</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dishes.map((dish) => {
              const isActive = activeDishId === dish.id;
              return (
                <div key={dish.id} className="bg-white rounded-[var(--radius-card)] card-shadow overflow-hidden">
                  {/* Dish header */}
                  <div className={`flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] ${isActive ? "bg-orange-50" : ""}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`diet-dot shrink-0 ${
                        dish.diet_type === "veg" ? "diet-dot-veg" :
                        dish.diet_type === "nonveg" ? "diet-dot-nonveg" : "diet-dot-mix"
                      }`} />
                      <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">{dish.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                        ({dish.materials.length} ingredient{dish.materials.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <Link
                      href={isActive ? "/restaurant/kitchen" : `/restaurant/kitchen?dish=${dish.id}`}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 ${
                        isActive
                          ? "bg-[var(--color-brand-primary)] text-white"
                          : "border border-[var(--color-border-dark)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
                      }`}
                    >
                      {isActive ? "▲ Close" : "Edit"}
                    </Link>
                  </div>

                  {/* Existing materials */}
                  {dish.materials.length > 0 && (
                    <div className="divide-y divide-[var(--color-border)]">
                      {dish.materials.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-5 py-2.5 gap-3">
                          <span className="text-sm text-[var(--color-text-primary)] truncate">{m.material_name}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold text-[var(--color-text-secondary)] tabular-nums">
                              {m.quantity_g} {m.unit}
                            </span>
                            <form action={deleteMaterial}>
                              <input type="hidden" name="id" value={m.id} />
                              <input type="hidden" name="dish_id" value={dish.id} />
                              <button
                                type="submit"
                                className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors text-xs font-semibold"
                                aria-label={`Delete ${m.material_name}`}
                              >
                                ✕
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add material form — inline, only when dish is active */}
                  {isActive && (
                    <div className="px-5 py-4 bg-[var(--color-surface-alt)] border-t border-[var(--color-border)]">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                        Add ingredient
                      </p>
                      <form action={upsertMaterial} className="flex flex-wrap gap-2 items-end">
                        <input type="hidden" name="dish_id" value={dish.id} />

                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Ingredient name *
                          </label>
                          <input
                            name="material_name"
                            required
                            placeholder="e.g. Rice, Paneer"
                            className="input-base py-2 text-sm"
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Qty *
                          </label>
                          <input
                            name="quantity_g"
                            type="number"
                            min="0.1"
                            step="0.1"
                            required
                            placeholder="150"
                            className="input-base py-2 text-sm"
                          />
                        </div>

                        <div className="w-24">
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                            Unit
                          </label>
                          <select name="unit" className="input-base py-2 text-sm bg-white">
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>

                        <button type="submit" className="btn-primary px-4 py-2 text-sm rounded-lg self-end">
                          + Add
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function HeadcountCard({ label, value, color }: { label: string; value: number; color: "orange" | "amber" | "gray" | "brand" }) {
  const styles = {
    orange: "bg-orange-50 border-orange-100 text-[var(--color-brand-primary)]",
    amber:  "bg-amber-50  border-amber-100  text-amber-600",
    gray:   "bg-gray-50   border-gray-100   text-[var(--color-text-muted)]",
    brand:  "bg-white     border-[var(--color-border)] text-[var(--color-text-primary)]",
  }[color];

  return (
    <div className={`rounded-[var(--radius-card)] border card-shadow-sm px-4 py-3 text-center ${styles}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-[10px] font-semibold mt-1.5 text-[var(--color-text-muted)] leading-tight">{label}</p>
    </div>
  );
}

function SlotForecastCard({ slot, emoji, dishName, expected, skipped, taken, remaining }: {
  slot: string; emoji: string; dishName: string;
  expected: number; skipped: number; taken: number; remaining: number;
}) {
  const pct = expected > 0 ? Math.round((taken / expected) * 100) : 0;

  return (
    <div className="bg-white rounded-[var(--radius-card)] card-shadow px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="font-bold text-sm text-[var(--color-text-primary)]">{slot}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[130px]">{dishName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-[var(--color-brand-primary)] leading-none">{remaining}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">to prepare</p>
        </div>
      </div>

      <div className="h-1.5 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]"
          style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
        />
      </div>

      <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />{taken} taken
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />{skipped} skipped
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-300 inline-block" />{expected} total
        </span>
      </div>
    </div>
  );
}
