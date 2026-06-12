/**
 * Demo seed — creates one restaurant with 8 dishes and a full Mon–Sun menu.
 * Safe to re-run: existing demo data is deleted and re-created each time.
 *
 * Usage:
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Demo login after seeding:
 *   URL: /auth/restaurant
 *   Username: demo_krishna
 *   Password: demo123456
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Username → synthetic email (matches the app's auth convention)
const DEMO_USERNAME = "demo_krishna";
const DEMO_EMAIL    = `${DEMO_USERNAME}@tiffino.local`;
const DEMO_PASSWORD = "demo123456";

// ─── Dishes ──────────────────────────────────────────────────────────────────
const DISHES = [
  { name: "Dal Makhani",         description: "Slow-cooked black lentils in a rich buttery gravy",    diet_type: "veg"    },
  { name: "Paneer Tikka Masala", description: "Charred paneer cubes in a spiced tomato-cream sauce",  diet_type: "veg"    },
  { name: "Jeera Rice",          description: "Fragrant basmati rice tempered with cumin",             diet_type: "veg"    },
  { name: "Aloo Paratha",        description: "Stuffed whole-wheat flatbread with spiced potato",      diet_type: "veg"    },
  { name: "Chicken Curry",       description: "Home-style chicken in an onion-tomato masala",          diet_type: "nonveg" },
  { name: "Mutton Biryani",      description: "Long-grain rice slow-cooked with tender mutton",        diet_type: "nonveg" },
  { name: "Egg Bhurji",          description: "Spiced scrambled eggs with onion and tomato",           diet_type: "nonveg" },
  { name: "Special Thali",       description: "Chef's choice of dal, sabzi, roti & rice",              diet_type: "mix"    },
] as const;

// ─── Weekly menu template (day 0=Mon … 6=Sun) ────────────────────────────────
const MENU_TEMPLATE: { day: number; meal: "lunch" | "dinner"; dish: string }[] = [
  { day: 0, meal: "lunch",  dish: "Dal Makhani"         },
  { day: 0, meal: "dinner", dish: "Chicken Curry"       },
  { day: 1, meal: "lunch",  dish: "Paneer Tikka Masala" },
  { day: 1, meal: "dinner", dish: "Mutton Biryani"      },
  { day: 2, meal: "lunch",  dish: "Jeera Rice"          },
  { day: 2, meal: "dinner", dish: "Egg Bhurji"          },
  { day: 3, meal: "lunch",  dish: "Aloo Paratha"        },
  { day: 3, meal: "dinner", dish: "Chicken Curry"       },
  { day: 4, meal: "lunch",  dish: "Dal Makhani"         },
  { day: 4, meal: "dinner", dish: "Special Thali"       },
  { day: 5, meal: "lunch",  dish: "Special Thali"       },
  { day: 5, meal: "dinner", dish: "Mutton Biryani"      },
  { day: 6, meal: "lunch",  dish: "Paneer Tikka Masala" },
  { day: 6, meal: "dinner", dish: "Dal Makhani"         },
];

async function run() {
  console.log("🌱  Starting demo seed…");

  // 1. Get or create demo auth user ─────────────────────────────────────────
  const { data: { users } } = await supabase.auth.admin.listUsers();
  let userId: string;
  const existing = users.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log("   ↳ Found existing demo user:", userId);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email:          DEMO_EMAIL,
      password:       DEMO_PASSWORD,
      email_confirm:  true,
    });
    if (error || !data.user) {
      console.error("❌  createUser:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("   ↳ Created demo user:", userId);
  }

  // 2. Upsert profile (only real columns: id, username, email, role, name) ──
  const { error: profileErr } = await supabase.from("profiles").upsert(
    { id: userId, username: DEMO_USERNAME, email: DEMO_EMAIL, role: "restaurant", name: "Demo Owner" },
    { onConflict: "id" }
  );
  if (profileErr) {
    console.error("❌  profile upsert:", profileErr.message);
    process.exit(1);
  }
  console.log("   ↳ Profile upserted");

  // 3. Upsert restaurant row ─────────────────────────────────────────────────
  const { data: existingRest } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .single();

  let restaurantId: string;
  if (existingRest) {
    restaurantId = existingRest.id;
    await supabase.from("restaurants").update({
      name:               "Shree Krishna Mess",
      area:               "Kothrud, Pune",
      address:            "42, Paud Road, Kothrud, Pune 411038",
      base_price:         70,
      serves_lunch:       true,
      serves_dinner:      true,
      lunch_skip_cutoff:  "10:00",
      dinner_skip_cutoff: "18:00",
    }).eq("id", restaurantId);
    console.log("   ↳ Restaurant updated:", restaurantId);
  } else {
    const { data, error } = await supabase.from("restaurants").insert({
      owner_id:           userId,
      name:               "Shree Krishna Mess",
      area:               "Kothrud, Pune",
      address:            "42, Paud Road, Kothrud, Pune 411038",
      base_price:         70,
      serves_lunch:       true,
      serves_dinner:      true,
      lunch_skip_cutoff:  "10:00",
      dinner_skip_cutoff: "18:00",
    }).select("id").single();
    if (error || !data) {
      console.error("❌  restaurant insert:", error?.message);
      process.exit(1);
    }
    restaurantId = data.id;
    console.log("   ↳ Restaurant created:", restaurantId);
  }

  // 4. Dishes — delete all for this restaurant, re-insert ───────────────────
  await supabase.from("dishes").delete().eq("restaurant_id", restaurantId);
  const { data: insertedDishes, error: dishErr } = await supabase
    .from("dishes")
    .insert(DISHES.map((d) => ({ ...d, restaurant_id: restaurantId })))
    .select("id, name");
  if (dishErr || !insertedDishes) {
    console.error("❌  dishes insert:", dishErr?.message);
    process.exit(1);
  }
  console.log(`   ↳ ${insertedDishes.length} dishes inserted`);

  // 5. Weekly menu — delete all, re-insert ──────────────────────────────────
  await supabase.from("weekly_menu").delete().eq("restaurant_id", restaurantId);
  const dishMap = Object.fromEntries(insertedDishes.map((d) => [d.name, d.id]));
  const menuRows = MENU_TEMPLATE.map(({ day, meal, dish }) => ({
    restaurant_id: restaurantId,
    day_of_week:   day,
    meal_type:     meal,
    dish_id:       dishMap[dish],
  }));
  const { error: menuErr } = await supabase.from("weekly_menu").insert(menuRows);
  if (menuErr) {
    console.error("❌  weekly_menu insert:", menuErr.message);
    process.exit(1);
  }
  console.log(`   ↳ ${menuRows.length} menu slots inserted (Mon–Sun, lunch + dinner)`);

  console.log("\n✅  Seed complete!");
  console.log(`   Restaurant ID : ${restaurantId}`);
  console.log(`   Public page   : /restaurants/${restaurantId}`);
  console.log(`   Demo login    : /auth/restaurant  username=demo_krishna  password=demo123456`);
}

run().catch((e) => { console.error(e); process.exit(1); });
