"use client";

import { useState, useTransition, useEffect } from "react";
import { saveWeeklyMenu, savePricing } from "./actions";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const DIET_COLOR: Record<string, string> = {
  veg:    "bg-green-500",
  nonveg: "bg-red-500",
  mix:    "bg-orange-400",
};

interface Dish { id: string; name: string; diet_type: string }
interface MenuRow { day_of_week: number; meal_type: string; dish_id: string }

interface Props {
  restaurantId: string;
  servesLunch: boolean;
  servesDinner: boolean;
  dishes: Dish[];
  initialMenu: MenuRow[];
  lunchPrice: number;
  dinnerPrice: number;
  bundlePrice: number | null;
  savedParam: string | null;
}

type DaySlots = { lunch: string; dinner: string };
type Grid = Record<number, DaySlots>;

function buildGrid(initialMenu: MenuRow[]): Grid {
  const grid: Grid = {};
  for (let d = 0; d < 7; d++) grid[d] = { lunch: "", dinner: "" };
  for (const row of initialMenu) {
    if (grid[row.day_of_week]) {
      (grid[row.day_of_week] as Record<string, string>)[row.meal_type] = row.dish_id;
    }
  }
  return grid;
}

export default function MenuBuilder({
  restaurantId, servesLunch, servesDinner, dishes, initialMenu,
  lunchPrice, dinnerPrice, bundlePrice, savedParam,
}: Props) {
  const [grid, setGrid] = useState<Grid>(() => buildGrid(initialMenu));
  const [isPendingMenu, startMenuTransition] = useTransition();
  const [isPendingPrice, startPriceTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  // Show toast from URL param (after pricing save redirect)
  useEffect(() => {
    if (savedParam === "pricing") {
      showToast("Pricing saved!");
      // clean URL without reload
      window.history.replaceState({}, "", "/restaurant/menu");
    } else if (savedParam === "menu") {
      showToast("Menu saved!");
      window.history.replaceState({}, "", "/restaurant/menu");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function setCell(day: number, meal: "lunch" | "dinner", dishId: string) {
    setGrid((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: dishId } }));
  }

  function copyDayForward(fromDay: number) {
    if (fromDay >= 6) return;
    setGrid((prev) => ({ ...prev, [fromDay + 1]: { ...prev[fromDay] } }));
    showToast(`${DAYS[fromDay]} copied to ${DAYS[fromDay + 1]}`);
  }

  function copyDayToAll(fromDay: number) {
    setGrid((prev) => {
      const next = { ...prev };
      for (let d = 0; d < 7; d++) {
        if (d !== fromDay) next[d] = { ...prev[fromDay] };
      }
      return next;
    });
    showToast(`${DAYS[fromDay]} applied to all days`);
  }

  function clearDay(day: number) {
    setGrid((prev) => ({ ...prev, [day]: { lunch: "", dinner: "" } }));
  }

  function handleSaveMenu() {
    setMenuError(null);
    const cells: { day_of_week: number; meal_type: "lunch" | "dinner"; dish_id: string }[] = [];
    for (let day = 0; day < 7; day++) {
      if (servesLunch  && grid[day].lunch)  cells.push({ day_of_week: day, meal_type: "lunch",  dish_id: grid[day].lunch });
      if (servesDinner && grid[day].dinner) cells.push({ day_of_week: day, meal_type: "dinner", dish_id: grid[day].dinner });
    }
    startMenuTransition(async () => {
      try {
        await saveWeeklyMenu(restaurantId, cells);
        showToast("Menu saved!");
      } catch (e) {
        setMenuError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  const slots: ("lunch" | "dinner")[] = [
    ...(servesLunch  ? ["lunch"  as const] : []),
    ...(servesDinner ? ["dinner" as const] : []),
  ];

  const dishById = Object.fromEntries(dishes.map((d) => [d.id, d]));

  return (
    <div className="space-y-5">

      {/* ── Floating toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-slide">
          <div className="bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}

      {/* ── Pricing section ── */}
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
        <div className="px-5 pt-4 pb-1 border-b border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Subscription Pricing</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Shown live to students. Bundle price applies when both slots are selected.</p>
        </div>
        <form
          action={savePricing}
          onSubmit={() => startPriceTransition(() => Promise.resolve())}
          className="px-5 py-4"
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                🌞 Lunch (₹/mo)
              </label>
              <input
                name="lunch_price"
                type="number"
                min="0"
                step="1"
                defaultValue={lunchPrice}
                className="input-base py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                🌙 Dinner (₹/mo)
              </label>
              <input
                name="dinner_price"
                type="number"
                min="0"
                step="1"
                defaultValue={dinnerPrice}
                className="input-base py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                🍱 Bundle (₹/mo)
              </label>
              <input
                name="bundle_price"
                type="number"
                min="0"
                step="1"
                defaultValue={bundlePrice ?? ""}
                placeholder="optional"
                className="input-base py-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPendingPrice}
            className="btn-primary px-5 py-2 text-xs disabled:opacity-50"
          >
            {isPendingPrice ? "Saving…" : "Save pricing"}
          </button>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
            Bundle saves students money vs buying both slots separately. Leave blank to charge lunch + dinner individually.
          </p>
        </form>
      </div>

      {/* ── Day-by-day menu builder ── */}
      <div className="space-y-3">
        {DAYS.map((dayName, dayIdx) => {
          const isWeekend = dayIdx >= 5;
          return (
            <DayCard
              key={dayIdx}
              dayName={dayName}
              dayIdx={dayIdx}
              isWeekend={isWeekend}
              slots={slots}
              grid={grid}
              dishes={dishes}
              dishById={dishById}
              onSetCell={setCell}
              onCopyForward={copyDayForward}
              onCopyToAll={copyDayToAll}
              onClear={clearDay}
            />
          );
        })}
      </div>

      {/* ── Save menu button ── */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSaveMenu}
          disabled={isPendingMenu}
          className="btn-primary px-7 py-3 text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isPendingMenu ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving…
            </>
          ) : (
            "Save menu"
          )}
        </button>
        {menuError && <span className="text-sm text-red-500">{menuError}</span>}
        <span className="text-xs text-[var(--color-text-muted)] ml-auto hidden sm:block">
          Tip: use &quot;Copy to all&quot; to apply one day&apos;s dishes across the week
        </span>
      </div>

      {/* Diet legend */}
      <div className="flex gap-4 text-xs text-[var(--color-text-muted)] pt-1">
        {Object.entries(DIET_COLOR).map(([type, cls]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DayCardProps {
  dayName: string;
  dayIdx: number;
  isWeekend: boolean;
  slots: ("lunch" | "dinner")[];
  grid: Grid;
  dishes: Dish[];
  dishById: Record<string, Dish>;
  onSetCell: (day: number, meal: "lunch" | "dinner", dishId: string) => void;
  onCopyForward: (day: number) => void;
  onCopyToAll: (day: number) => void;
  onClear: (day: number) => void;
}

function DayCard({
  dayName, dayIdx, isWeekend, slots, grid, dishes, dishById,
  onSetCell, onCopyForward, onCopyToAll, onClear,
}: DayCardProps) {
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const daySlots = grid[dayIdx];
  const filledCount = slots.filter((s) => !!daySlots[s]).length;

  return (
    <div className={`card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden ${isWeekend ? "border border-orange-100" : ""}`}>
      {/* Day header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-[var(--color-text-primary)]">{dayName}</span>
          {isWeekend && <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2 py-0.5 font-semibold">Weekend</span>}
          {filledCount > 0 && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
              {filledCount}/{slots.length} set
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowCopyMenu((v) => !v)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] rounded-lg px-2.5 py-1 transition-colors font-medium"
          >
            Copy ▾
          </button>
          <button
            type="button"
            onClick={() => onClear(dayIdx)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-red-500 border border-[var(--color-border)] hover:border-red-300 rounded-lg px-2.5 py-1 transition-colors"
          >
            Clear
          </button>

          {showCopyMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl card-shadow border border-[var(--color-border)] min-w-[160px] py-1">
              {dayIdx < 6 && (
                <button
                  type="button"
                  onClick={() => { onCopyForward(dayIdx); setShowCopyMenu(false); }}
                  className="w-full text-left text-xs px-4 py-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"
                >
                  Copy to {DAYS[dayIdx + 1]}
                </button>
              )}
              <button
                type="button"
                onClick={() => { onCopyToAll(dayIdx); setShowCopyMenu(false); }}
                className="w-full text-left text-xs px-4 py-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"
              >
                Apply to all days
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Slot selectors */}
      <div className="px-5 py-4 space-y-3">
        {slots.map((slot) => {
          const selectedId = daySlots[slot];
          const dish = selectedId ? dishById[selectedId] : undefined;
          return (
            <div key={slot} className="flex items-center gap-3">
              <div className="w-5 text-base shrink-0 flex items-center justify-center">
                {slot === "lunch" ? "🌞" : "🌙"}
              </div>
              <div className="w-14 shrink-0">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {slot === "lunch" ? "Lunch" : "Dinner"}
                </span>
              </div>
              <div className="relative flex-1">
                <select
                  value={selectedId}
                  onChange={(e) => onSetCell(dayIdx, slot, e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-[var(--radius-btn)] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] appearance-none pr-7 text-[var(--color-text-primary)]"
                >
                  <option value="">— not set —</option>
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {dish && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DIET_COLOR[dish.diet_type] ?? "bg-gray-300"}`} />
                </div>
              )}
              {!dish && <div className="w-4 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
