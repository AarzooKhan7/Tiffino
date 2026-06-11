# Tiffino

A subscription-based tiffin/mess aggregator. Students subscribe to a local mess for 30 days, view a recurring weekly menu, and scan a QR code each day to consume a meal token.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** — light theme, warm Zomato/Swiggy palette
- **Supabase** — Postgres + Auth (email OTP/magic link) + Realtime
- **Vercel** — hosting, auto-deploy on push to `main`

## Local Development

### 1. Prerequisites

- Node.js 18.18+ (project uses 22.x)
- A Supabase project (schema already created)

### 2. Clone & install

```bash
git clone https://github.com/Aarzookhan7/Tiffino.git
cd Tiffino
npm install
```

### 3. Environment variables

Copy `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>
```

> **Never commit `.env.local`.** It is listed in `.gitignore` under `.env.*`.

Find these values in your Supabase dashboard → Project Settings → API.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

The landing page will show **"Connected to Supabase ✓ (N restaurants)"** when env vars are correct.

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick `Aarzookhan7/Tiffino`.
2. Framework preset: **Next.js** (auto-detected).
3. Under **Environment Variables**, add all three keys from `.env.local`.
4. Click **Deploy**.

Every push to `main` triggers an automatic redeploy.

## Project Structure

```
src/
  app/
    layout.tsx        # Root layout, Inter font, global CSS
    page.tsx          # Landing page — Supabase connection probe
    globals.css       # Tailwind v4 theme tokens (palette, radii, fonts)
  lib/
    supabase/
      browser.ts      # createClient() for Client Components
      server.ts       # createClient() + createServiceClient() for Server Components / Route Handlers
```

## Phases

| Phase | Scope |
|-------|-------|
| 0 ✅ | Scaffold, Supabase wiring, base theme, deploy pipeline |
| 1 | Email-OTP auth, profiles, student/restaurant role routing |
| 2 | Restaurant dashboard — menu management, QR generation |
| 3 | Student dashboard — subscription, weekly menu view |
| 4 | QR scan (html5-qrcode), meal token redemption, IST server clock |
| 5 | Notifications, material requirements, admin panel |
