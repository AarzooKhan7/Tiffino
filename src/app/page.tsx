import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import RestaurantGrid from "@/components/RestaurantGrid";
import { HERO_BG } from "@/lib/food-images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: restaurants }, { data: { user } }] = await Promise.all([
    supabase.from("restaurants").select("id, name, area, base_price, serves_lunch, serves_dinner").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  let userName: string | null = null;
  let role: "student" | "restaurant" | null = null;
  if (user) {
    const { data: p } = await supabase.from("profiles").select("name, role").eq("id", user.id).single();
    userName = p?.name ?? null;
    role = (p?.role as "student" | "restaurant") ?? null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      <AppHeader userName={userName} role={role} />

      <section className="relative h-[340px] sm:h-[420px] overflow-hidden">
        <Image src={HERO_BG} alt="Indian food spread" fill className="object-cover object-center" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 gap-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="text-yellow-300 text-sm">★</span>
            <span className="text-white text-xs font-medium">30-day meal subscriptions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
            Your daily mess,<br />
            <span className="text-yellow-300">sorted.</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-sm">
            Subscribe to a local mess, track tokens, scan QR — never worry about lunch again.
          </p>
          <div className="flex gap-3 mt-1">
            <a href="/auth/student" className="btn-primary px-6 py-3 text-sm shadow-lg">Find a Mess</a>
            <a href="/auth/restaurant" className="inline-flex items-center justify-center bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm px-6 py-3 rounded-[var(--radius-btn)] hover:bg-white/25 transition-colors">List your mess</a>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-[var(--color-border)] text-center">
          {[
            { v: `${restaurants?.length ?? 0}+`, l: "Messes listed" },
            { v: "60–120", l: "₹ per slot / day" },
            { v: "30 days", l: "Subscription plan" },
          ].map(({ v, l }) => (
            <div key={l} className="px-2">
              <p className="text-lg font-extrabold text-[var(--color-brand-primary)]">{v}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 py-8" id="messes">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Messes near you</h2>
          <span className="text-sm text-[var(--color-text-muted)]">{restaurants?.length ?? 0} listed</span>
        </div>
        <RestaurantGrid restaurants={restaurants ?? []} />
      </section>

      <section className="bg-white border-t border-[var(--color-border)] py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-8">How Tiffino works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { emoji: "🔍", title: "Browse messes", desc: "Find local mess services in your area with weekly menus." },
              { emoji: "💳", title: "Subscribe for 30 days", desc: "Pick lunch, dinner, or both. Pay once, eat daily." },
              { emoji: "📱", title: "Scan & eat", desc: "Your QR token is your meal pass. Scan at the counter." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-alt)] flex items-center justify-center text-2xl">{emoji}</div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-muted)]">
        © {new Date().getFullYear()} Tiffino · Made with ❤️ for students
      </footer>
    </div>
  );
}
