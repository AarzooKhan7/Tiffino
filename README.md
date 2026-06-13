# Tiffino 🍱

> Home-style meals, delivered to your hostel

Tiffino is a **mess subscription platform** for students living in PGs, hostels, and shared apartments. Students subscribe to a local mess for 30 days, get a QR code that the mess scans on each meal, and track their token balance in real time. Mess owners manage their menu, subscribers, and kitchen demand from a dedicated dashboard.

---

## Features

### For Students
- **Browse messes** — search local mess listings by area
- **Subscribe** — 30-day plans with lunch, dinner, or both slots
- **Daily QR check-in** — scan the mess QR code to consume a meal token
- **Smart skips** — skip up to 4 meals/slot free per month; extra skips forfeit tokens
- **7-day menu preview** — see this week's dishes for your mess
- **Token wallet** — real-time balance and days remaining

### For Mess Owners
- **Restaurant setup** — add name, area, pricing, and slot configuration
- **Dish catalog** — manage reusable dishes with diet tags (veg / non-veg / mix)
- **Weekly menu builder** — assign dishes to each day × slot
- **QR code** — generated automatically; students scan it to check in
- **Subscriber ledger** — view all active subscribers with token balance and skip rate
- **Subscriber detail** — 6-day attendance heatmap, skip stats, and nudge notification for low-balance students
- **Kitchen demand forecast** — live count of expected meals per slot today; raw material projections if `material_requirements` data is available

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth with username-only flow |
| QR generation | `qrcode` (server-side) |
| QR scanning | `html5-qrcode` (client camera) |
| Hosting | Vercel (recommended) |

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── student/          # Student login + register
│   │   ├── restaurant/       # Restaurant login + register
│   │   ├── login/            # POST /auth/login handler
│   │   ├── register/         # POST /auth/register handler
│   │   └── logout/           # POST /auth/logout handler
│   ├── student/
│   │   └── dashboard/        # Student meal dashboard
│   ├── restaurant/
│   │   ├── dashboard/        # Restaurant home + QR + forecast
│   │   ├── dishes/           # Dish catalog management
│   │   ├── menu/             # Weekly menu builder
│   │   ├── setup/            # Restaurant profile settings
│   │   └── subscribers/      # Subscriber ledger + detail
│   ├── restaurants/[id]/     # Public restaurant page + subscribe
│   └── redemptions/          # Meal claim + skip actions
├── components/
│   ├── StudentShell.tsx      # Student layout with bottom nav
│   ├── RestaurantShell.tsx   # Restaurant layout with bottom nav
│   ├── BottomNav.tsx         # Mobile bottom navigation
│   ├── DailyActions.tsx      # Scan QR / Skip meal UI
│   ├── LoginForm.tsx         # Username/password login
│   ├── RegisterForm.tsx      # Student + restaurant registration
│   └── RestaurantQR.tsx      # QR display with download
└── lib/
    ├── supabase/
    │   ├── server.ts         # createClient / createServiceClient
    │   └── client.ts         # Browser Supabase client
    ├── ist.ts                # nowIST() — server-side IST time
    └── types.ts              # Shared TypeScript types
```

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | References `auth.users` |
| role | text | `'student'` or `'restaurant'` |
| name | text | Full name |
| username | text | Unique, lowercase |
| location | text | Area / locality |
| diet_pref | text | `veg`, `nonveg`, `mix` |

### `restaurants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| owner_id | uuid | References `profiles.id` |
| name | text | |
| area | text | |
| base_price | numeric | Price per slot |
| serves_lunch / serves_dinner | boolean | |
| lunch_skip_cutoff / dinner_skip_cutoff | time | IST cutoff for skips |
| qr_token | uuid | Used for meal check-in |

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| student_id | uuid | |
| restaurant_id | uuid | |
| slots | text[] | `['lunch']`, `['dinner']`, or both |
| tokens_total / tokens_remaining | int | 30 × slots count |
| status | text | `active`, `expired`, `cancelled` |
| start_date / end_date | date | |

### `redemptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| subscription_id | uuid | |
| student_id / restaurant_id | uuid | |
| meal_date | date | IST date |
| meal_type | text | `lunch` or `dinner` |
| status | text | `pending`, `taken`, `skipped` |

### Other tables
- **`dishes`** — dish catalog per restaurant
- **`weekly_menu`** — day × meal_type → dish assignment
- **`notifications`** — nudge messages from restaurant to student
- **`material_requirements`** — raw material quantities per dish

---

## Environment Variables

Create `.env.local` in the project root (never commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| Variable | Used for |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase queries (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin queries (bypasses RLS) |

---

## Setup & Development

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema above

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed demo data (optional)

```bash
npm run seed
```

Populates sample restaurants, dishes, and menu entries.

---

## Auth Flow

Tiffino uses **username-only authentication**. Internally, users are stored in Supabase Auth with a synthetic email (`username@tiffino.local`) — the user never sees this. Login posts to `/auth/login`, which signs in via the Supabase email/password method and returns a redirect URL. The session is stored in cookies via `@supabase/ssr`.

Role is stored in `profiles.role` and enforced at the layout level — students see `/student/*` and restaurants see `/restaurant/*`.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the three environment variables in Project Settings → Environment Variables
4. Deploy

### Self-hosted

```bash
npm run build
npm start
```

Ensure environment variables are set in the process environment.

---

## Security Notes

- `.env.local` is git-ignored — never commit it
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to the browser
- Role values are validated server-side on every authenticated route
- All time-based logic (skip cutoffs, meal dates) uses IST via `nowIST()`
- RLS policies on Supabase restrict student data access by `user_id`

---

## License

Private — not for redistribution.
