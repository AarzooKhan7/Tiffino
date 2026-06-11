import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DIET_BADGE: Record<string, string> = {
  veg:    "bg-green-100 text-green-700",
  nonveg: "bg-red-100   text-red-700",
  mix:    "bg-orange-100 text-orange-700",
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, area, base_price, serves_lunch, serves_dinner")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Hero */}
      <section className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-[var(--color-brand-primary)]">
            Tiffino
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-md">
            Subscribe to a local mess, track your meals, scan your QR — sorted for 30 days.
          </p>
          <div className="flex gap-3">
            <Link href="/auth/student"
              className="bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
              I&apos;m a Student
            </Link>
            <Link href="/auth/restaurant"
              className="bg-[var(--color-brand-secondary)] text-white font-semibold rounded-[var(--radius-btn)] px-5 py-2.5 text-sm hover:opacity-90 transition-opacity">
              I&apos;m a Mess Owner
            </Link>
          </div>
        </div>
      </section>

      {/* Restaurant grid */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-5">
          Messes near you
        </h2>

        {restaurants && restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <Link key={r.id} href={`/restaurants/${r.id}`}
                className="card-shadow rounded-[var(--radius-card)] bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{r.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">📍 {r.area}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-brand-secondary)] shrink-0">
                    ₹{r.base_price}
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">/slot</span>
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.serves_lunch  && <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">🌞 Lunch</span>}
                  {r.serves_dinner && <span className="text-xs border border-[var(--color-border)] rounded-full px-2 py-0.5 text-[var(--color-text-secondary)]">🌙 Dinner</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-12 text-center">
            <p className="text-[var(--color-text-muted)]">No messes listed yet.</p>
            <Link href="/auth/restaurant"
              className="inline-block mt-3 text-sm text-[var(--color-brand-secondary)] hover:underline font-medium">
              Are you a mess owner? Register here →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
