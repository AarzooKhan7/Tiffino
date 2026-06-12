import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RestaurantGrid from "@/components/RestaurantGrid";

export const dynamic = "force-dynamic";

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
            <Link
              href="/auth/student"
              className="bg-[var(--color-brand-primary)] text-white font-semibold rounded-[var(--radius-btn)] px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              I&apos;m a Student
            </Link>
            <Link
              href="/auth/restaurant"
              className="bg-[var(--color-brand-secondary)] text-white font-semibold rounded-[var(--radius-btn)] px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              I&apos;m a Mess Owner
            </Link>
          </div>
        </div>
      </section>

      {/* Restaurant grid with search */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-5">
          Messes near you
        </h2>
        <RestaurantGrid restaurants={restaurants ?? []} />
      </section>
    </main>
  );
}
