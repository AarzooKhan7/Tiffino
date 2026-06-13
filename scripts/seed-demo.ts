/**
 * Demo seed — 4 restaurants (full menus) + 2 students (active subscriptions + redemption history).
 * Safe to re-run: existing demo accounts are updated, redemptions are wiped and recreated.
 *
 * Usage:  npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Demo logins after seeding:
 *   Restaurants  /auth/restaurant  demo_krishna / demo_ghar / demo_punjabi / demo_saraswati  pw: demo123456
 *   Students     /auth/student     demo_student1 / demo_student2                              pw: demo123456
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

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_PASSWORD = "demo123456";

// ─── IST helpers ─────────────────────────────────────────────────────────────
function nowIST(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = nowIST();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}
function daysFromNow(n: number): string {
  const d = nowIST();
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

// ─── Ensure auth user exists ──────────────────────────────────────────────────
async function ensureUser(username: string, role: "restaurant" | "student", name: string): Promise<string> {
  const email = `${username}@tiffino.local`;
  const { data: { users } } = await db.auth.admin.listUsers();
  const existing = users.find((u) => u.email === email);

  let userId: string;
  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password:      DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) { console.error(`❌  createUser ${username}:`, error?.message); process.exit(1); }
    userId = data.user.id;
  }

  const { error: profileErr } = await db.from("profiles").upsert(
    { id: userId, username, email, role, name },
    { onConflict: "id" }
  );
  if (profileErr) { console.error(`❌  profile ${username}:`, profileErr.message); process.exit(1); }

  return userId;
}

// ─── Restaurant definitions ───────────────────────────────────────────────────
const RESTAURANTS = [
  {
    username: "demo_krishna",
    owner:    "Ravi Sharma",
    rest: {
      name:               "Shree Krishna Mess",
      area:               "Kothrud, Pune",
      address:            "42, Paud Road, Kothrud, Pune 411038",
      base_price:         70,
      lunch_price:        1400,
      dinner_price:       1600,
      serves_lunch:       true,
      serves_dinner:      true,
      lunch_skip_cutoff:  "10:00",
      dinner_skip_cutoff: "18:00",
    },
    dishes: [
      { name: "Dal Makhani",         description: "Slow-cooked black lentils in a rich buttery gravy",   diet_type: "veg"    },
      { name: "Paneer Tikka Masala", description: "Charred paneer cubes in a spiced tomato-cream sauce", diet_type: "veg"    },
      { name: "Jeera Rice",          description: "Fragrant basmati rice tempered with cumin",            diet_type: "veg"    },
      { name: "Aloo Paratha",        description: "Stuffed whole-wheat flatbread with spiced potato",     diet_type: "veg"    },
      { name: "Chicken Curry",       description: "Home-style chicken in an onion-tomato masala",         diet_type: "nonveg" },
      { name: "Mutton Biryani",      description: "Long-grain rice slow-cooked with tender mutton",       diet_type: "nonveg" },
      { name: "Egg Bhurji",          description: "Spiced scrambled eggs with onion and tomato",          diet_type: "nonveg" },
      { name: "Special Thali",       description: "Chef's choice of dal, sabzi, roti & rice",             diet_type: "mix"    },
    ],
    menu: [
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
    ],
  },
  {
    username: "demo_ghar",
    owner:    "Meena Kulkarni",
    rest: {
      name:               "Ghar Ka Khana",
      area:               "Koregaon Park, Pune",
      address:            "7B, Lane 3, Koregaon Park, Pune 411001",
      base_price:         80,
      lunch_price:        1200,
      dinner_price:       1400,
      serves_lunch:       true,
      serves_dinner:      true,
      lunch_skip_cutoff:  "09:30",
      dinner_skip_cutoff: "17:30",
    },
    dishes: [
      { name: "Methi Thepla",       description: "Soft fenugreek flatbreads with yoghurt",               diet_type: "veg"    },
      { name: "Chole Bhature",      description: "Spicy chickpea curry with puffy deep-fried bread",     diet_type: "veg"    },
      { name: "Kadhi Pakoda",       description: "Tangy yoghurt curry with fried gram-flour fritters",   diet_type: "veg"    },
      { name: "Rajma Chawal",       description: "Red kidney bean curry over steamed rice",              diet_type: "veg"    },
      { name: "Keema Pav",          description: "Spiced minced chicken served with soft pav buns",      diet_type: "nonveg" },
      { name: "Fish Curry Rice",    description: "Coastal-style fish in coconut milk gravy",             diet_type: "nonveg" },
      { name: "Mix Veg Thali",      description: "Seasonal vegetables, dal, roti, rice & pickle",        diet_type: "mix"    },
      { name: "Egg Curry Rice",     description: "Hard-boiled eggs in a spiced onion-tomato gravy",      diet_type: "nonveg" },
    ],
    menu: [
      { day: 0, meal: "lunch",  dish: "Rajma Chawal"    },
      { day: 0, meal: "dinner", dish: "Keema Pav"       },
      { day: 1, meal: "lunch",  dish: "Chole Bhature"   },
      { day: 1, meal: "dinner", dish: "Fish Curry Rice" },
      { day: 2, meal: "lunch",  dish: "Methi Thepla"    },
      { day: 2, meal: "dinner", dish: "Egg Curry Rice"  },
      { day: 3, meal: "lunch",  dish: "Kadhi Pakoda"    },
      { day: 3, meal: "dinner", dish: "Mix Veg Thali"   },
      { day: 4, meal: "lunch",  dish: "Mix Veg Thali"   },
      { day: 4, meal: "dinner", dish: "Keema Pav"       },
      { day: 5, meal: "lunch",  dish: "Chole Bhature"   },
      { day: 5, meal: "dinner", dish: "Fish Curry Rice" },
      { day: 6, meal: "lunch",  dish: "Rajma Chawal"    },
      { day: 6, meal: "dinner", dish: "Kadhi Pakoda"    },
    ],
  },
  {
    username: "demo_punjabi",
    owner:    "Gurpreet Singh",
    rest: {
      name:               "Punjabi Tadka",
      area:               "Baner, Pune",
      address:            "Office Road, Baner, Pune 411045",
      base_price:         90,
      lunch_price:        1800,
      dinner_price:       1800,
      serves_lunch:       true,
      serves_dinner:      false,
      lunch_skip_cutoff:  "10:30",
      dinner_skip_cutoff: "18:00",
    },
    dishes: [
      { name: "Butter Chicken",       description: "Tandoor-roasted chicken in a makhani sauce",           diet_type: "nonveg" },
      { name: "Sarson Ka Saag",       description: "Mustard greens curry served with makki roti",          diet_type: "veg"    },
      { name: "Amritsari Chole",      description: "Black-tea-infused chickpeas with bhatura",             diet_type: "veg"    },
      { name: "Palak Paneer",         description: "Fresh cottage cheese in creamed spinach gravy",        diet_type: "veg"    },
      { name: "Lamb Rogan Josh",      description: "Slow-braised lamb in aromatic Kashmiri spices",        diet_type: "nonveg" },
      { name: "Paneer Lababdar",      description: "Rich tomato-cream paneer with kasuri methi",           diet_type: "veg"    },
      { name: "Lassi + Paratha Set",  description: "Two stuffed parathas with sweet lassi and pickle",     diet_type: "veg"    },
    ],
    menu: [
      { day: 0, meal: "lunch", dish: "Butter Chicken"      },
      { day: 1, meal: "lunch", dish: "Sarson Ka Saag"      },
      { day: 2, meal: "lunch", dish: "Amritsari Chole"     },
      { day: 3, meal: "lunch", dish: "Palak Paneer"        },
      { day: 4, meal: "lunch", dish: "Lamb Rogan Josh"     },
      { day: 5, meal: "lunch", dish: "Lassi + Paratha Set" },
      { day: 6, meal: "lunch", dish: "Paneer Lababdar"     },
    ],
  },
  {
    username: "demo_saraswati",
    owner:    "Sunita Joshi",
    rest: {
      name:               "Saraswati Tiffin",
      area:               "Hadapsar, Pune",
      address:            "12, Magarpatta City Road, Hadapsar, Pune 411028",
      base_price:         65,
      lunch_price:        1000,
      dinner_price:       1200,
      serves_lunch:       true,
      serves_dinner:      true,
      lunch_skip_cutoff:  "10:00",
      dinner_skip_cutoff: "17:00",
    },
    dishes: [
      { name: "Puran Poli",         description: "Sweet stuffed flatbread with jaggery and lentil filling",  diet_type: "veg" },
      { name: "Misal Pav",          description: "Spicy sprouted moth bean curry topped with farsan",         diet_type: "veg" },
      { name: "Varan Bhaat",        description: "Simple toor dal with ghee over steamed rice",              diet_type: "veg" },
      { name: "Batata Bhaji",       description: "Dry potato stir-fry with mustard and turmeric",            diet_type: "veg" },
      { name: "Bhakri + Pitla",     description: "Jowar flatbread with besan-based spiced gravy",            diet_type: "veg" },
      { name: "Sabudana Khichdi",   description: "Sago pearls with peanuts and cumin — popular fasting food",diet_type: "veg" },
      { name: "Full Maharashtrian Thali", description: "Dal, bhaji, rice, roti, papad, pickle & solkadhi",  diet_type: "veg" },
    ],
    menu: [
      { day: 0, meal: "lunch",  dish: "Misal Pav"                   },
      { day: 0, meal: "dinner", dish: "Varan Bhaat"                  },
      { day: 1, meal: "lunch",  dish: "Bhakri + Pitla"               },
      { day: 1, meal: "dinner", dish: "Batata Bhaji"                 },
      { day: 2, meal: "lunch",  dish: "Full Maharashtrian Thali"     },
      { day: 2, meal: "dinner", dish: "Sabudana Khichdi"             },
      { day: 3, meal: "lunch",  dish: "Varan Bhaat"                  },
      { day: 3, meal: "dinner", dish: "Misal Pav"                    },
      { day: 4, meal: "lunch",  dish: "Puran Poli"                   },
      { day: 4, meal: "dinner", dish: "Full Maharashtrian Thali"     },
      { day: 5, meal: "lunch",  dish: "Full Maharashtrian Thali"     },
      { day: 5, meal: "dinner", dish: "Bhakri + Pitla"               },
      { day: 6, meal: "lunch",  dish: "Puran Poli"                   },
      { day: 6, meal: "dinner", dish: "Varan Bhaat"                  },
    ],
  },
] as const;

// ─── Seed a single restaurant ─────────────────────────────────────────────────
async function seedRestaurant(r: (typeof RESTAURANTS)[number]): Promise<string> {
  const ownerId = await ensureUser(r.username, "restaurant", r.owner);

  // Upsert restaurant row
  const { data: existingRest } = await db
    .from("restaurants")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  let restaurantId: string;
  if (existingRest) {
    restaurantId = existingRest.id;
    await db.from("restaurants").update({ ...r.rest }).eq("id", restaurantId);
  } else {
    const { data, error } = await db
      .from("restaurants")
      .insert({ ...r.rest, owner_id: ownerId })
      .select("id")
      .single();
    if (error || !data) { console.error(`❌  restaurant ${r.username}:`, error?.message); process.exit(1); }
    restaurantId = data.id;
  }

  // Re-insert dishes
  await db.from("dishes").delete().eq("restaurant_id", restaurantId);
  const { data: insertedDishes, error: dishErr } = await db
    .from("dishes")
    .insert(r.dishes.map((d) => ({ ...d, restaurant_id: restaurantId })))
    .select("id, name");
  if (dishErr || !insertedDishes) { console.error(`❌  dishes ${r.username}:`, dishErr?.message); process.exit(1); }

  // Re-insert weekly menu
  await db.from("weekly_menu").delete().eq("restaurant_id", restaurantId);
  const dishMap = Object.fromEntries(insertedDishes.map((d) => [d.name, d.id]));
  const menuRows = r.menu.map(({ day, meal, dish }) => ({
    restaurant_id: restaurantId,
    day_of_week:   day,
    meal_type:     meal,
    dish_id:       dishMap[dish],
    diet_type:     r.dishes.find((d) => d.name === dish)?.diet_type ?? "veg",
  }));
  const { error: menuErr } = await db.from("weekly_menu").insert(menuRows);
  if (menuErr) { console.error(`❌  weekly_menu ${r.username}:`, menuErr.message); process.exit(1); }

  console.log(`   ↳ ${r.rest.name} — ${insertedDishes.length} dishes, ${menuRows.length} menu slots`);
  return restaurantId;
}

// ─── Student definitions ──────────────────────────────────────────────────────
interface StudentDef {
  username: string;
  name:     string;
  location: string;
  diet:     string;
  subDaysAgo: number;  // subscription started N days ago
  slots:    string[];
  restIdx:  number;    // index into restaurantIds array
}

const STUDENTS: StudentDef[] = [
  {
    username:   "demo_student1",
    name:       "Priya Mehta",
    location:   "Kothrud, Pune",
    diet:       "veg",
    subDaysAgo: 12,
    slots:      ["lunch", "dinner"],
    restIdx:    0,  // Shree Krishna Mess
  },
  {
    username:   "demo_student2",
    name:       "Arjun Nair",
    location:   "Koregaon Park, Pune",
    diet:       "mix",
    subDaysAgo: 5,
    slots:      ["lunch"],
    restIdx:    1,  // Ghar Ka Khana
  },
];

async function seedStudent(s: StudentDef, restaurantId: string): Promise<void> {
  const studentId = await ensureUser(s.username, "student", s.name);

  // Update profile details
  await db.from("profiles").update({ location: s.location, diet_pref: s.diet }).eq("id", studentId);

  // Wipe old subscriptions + redemptions
  const { data: oldSubs } = await db
    .from("subscriptions")
    .select("id")
    .eq("student_id", studentId);
  if (oldSubs && oldSubs.length > 0) {
    const subIds = oldSubs.map((s) => s.id);
    await db.from("redemptions").delete().in("subscription_id", subIds);
    await db.from("subscriptions").delete().eq("student_id", studentId);
  }

  const start = daysAgo(s.subDaysAgo);
  const end   = daysFromNow(30 - s.subDaysAgo);

  const tokensTotal     = 30 * s.slots.length;
  const tokensConsumed  = s.subDaysAgo * s.slots.length;
  const tokensRemaining = Math.max(0, tokensTotal - tokensConsumed + Math.floor(tokensConsumed * 0.1)); // ~10% skipped
  // Per-restaurant pricing
  const rdef = RESTAURANTS[s.restIdx];
  const lp = (rdef.rest as Record<string, unknown>).lunch_price  as number ?? 1500;
  const dp = (rdef.rest as Record<string, unknown>).dinner_price as number ?? 1500;
  const pricePaid =
    (s.slots.includes("lunch")  ? lp : 0) +
    (s.slots.includes("dinner") ? dp : 0);

  const { data: sub, error: subErr } = await db
    .from("subscriptions")
    .insert({
      student_id:       studentId,
      restaurant_id:    restaurantId,
      status:           "active",
      slots:            s.slots,
      tokens_total:     tokensTotal,
      tokens_remaining: tokensRemaining,
      rollover_in:      0,
      start_date:       start,
      end_date:         end,
      price_paid:       pricePaid,
    })
    .select("id")
    .single();
  if (subErr || !sub) { console.error(`❌  subscription ${s.username}:`, subErr?.message); process.exit(1); }

  // Insert redemption history for past days
  const redemptions: object[] = [];
  for (let i = s.subDaysAgo; i >= 0; i--) {
    const mealDate = daysAgo(i);
    const isToday  = i === 0;

    for (const slot of s.slots) {
      let status: string;
      if (isToday) {
        status = "pending";
      } else if (i % 7 === 3 && slot === "dinner") {
        status = "skipped"; // skip Thursday dinners
      } else if (i % 9 === 0) {
        status = "skipped"; // occasional skip
      } else {
        status = "taken";
      }

      redemptions.push({
        subscription_id: sub.id,
        student_id:      studentId,
        restaurant_id:   restaurantId,
        meal_date:       mealDate,
        meal_type:       slot,
        status,
        claimed:         status === "taken",
      });
    }
  }

  const { error: rdmErr } = await db.from("redemptions").insert(redemptions);
  if (rdmErr) { console.error(`❌  redemptions ${s.username}:`, rdmErr.message); process.exit(1); }

  console.log(`   ↳ ${s.name} — ${s.subDaysAgo + 1} days of redemptions (${redemptions.length} rows)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log("🌱  Starting demo seed…\n");

  console.log("📍  Restaurants:");
  const restaurantIds: string[] = [];
  for (const r of RESTAURANTS) {
    restaurantIds.push(await seedRestaurant(r));
  }

  console.log("\n🎓  Students:");
  for (const s of STUDENTS) {
    await seedStudent(s, restaurantIds[s.restIdx]);
  }

  console.log("\n✅  Seed complete!");
  console.log("\n  Restaurant logins  →  /auth/restaurant  (password: demo123456)");
  console.log("    demo_krishna  —  Shree Krishna Mess (Kothrud)");
  console.log("    demo_ghar     —  Ghar Ka Khana (Koregaon Park)");
  console.log("    demo_punjabi  —  Punjabi Tadka (Baner)");
  console.log("    demo_saraswati—  Saraswati Tiffin (Hadapsar)");
  console.log("\n  Student logins     →  /auth/student    (password: demo123456)");
  console.log("    demo_student1  —  Priya Mehta (active sub at Shree Krishna Mess)");
  console.log("    demo_student2  —  Arjun Nair  (active sub at Ghar Ka Khana)");
}

run().catch((e) => { console.error(e); process.exit(1); });
