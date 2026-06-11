"use client";

import { useState, useTransition } from "react";
import { saveWeeklyMenu } from "./actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DIET_DOT: Record<string, string> = {
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
}

type Grid = Record<number, { lunch: string; dinner: string }>;

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
}: Props) {
  const [grid, setGrid] = useState<Grid>(() => buildGrid(initialMenu));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setCell(day: number, meal: "lunch" | "dinner", dishId: string) {
    setGrid((prev) => ({ ...prev, [day]: { ...prev[day], [meal]: dishId } }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    const cells: { day_of_week: number; meal_type: "lunch" | "dinner"; dish_id: string }[] = [];
    for (let day = 0; day < 7; day++) {
      if (servesLunch && grid[day].lunch)  cells.push({ day_of_week: day, meal_type: "lunch"  as const, dish_id: grid[day].lunch });
      if (servesDinner && grid[day].dinner) cells.push({ day_of_week: day, meal_type: "dinner" as const, dish_id: grid[day].dinner });
    }
    startTransition(async () => {
      try {
        await saveWeeklyMenu(restaurantId, cells);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  const meals = [
    ...(servesLunch  ? [{ key: "lunch"  as const, label: "Lunch" }] : []),
    ...(servesDinner ? [{ key: "dinner" as const, label: "Dinner" }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-20">
                Meal
              </th>
              {DAYS.map((d) => (
                <th key={d} className="text-center px-2 py-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meals.map(({ key, label }) => (
              <tr key={key} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    {label}
                  </span>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const selectedId = grid[dayIdx][key];
                  const selectedDish = dishes.find((d) => d.id === selectedId);
                  return (
                    <td key={dayIdx} className="px-2 py-2 text-center">
                      <div className="relative">
                        <select
                          value={selectedId}
                          onChange={(e) => setCell(dayIdx, key, e.target.value)}
                          className="w-full min-w-[100px] border border-[var(--color-border)] rounded-[var(--radius-btn)] px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] appearance-none pr-6"
                        >
                          <option value="">— off —</option>
                          {dishes.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        {selectedDish && (
                          <span
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${DIET_DOT[selectedDish.diet_type] ?? "bg-gray-400"}`}
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[var(--color-brand-primary)] text-white font-semibold text-sm px-6 py-2.5 rounded-[var(--radius-btn)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save menu"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
        {Object.entries(DIET_DOT).map(([type, cls]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} /> {type}
          </span>
        ))}
      </div>
    </div>
  );
}
