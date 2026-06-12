-- Tiffino — current live schema (as of 2026-06-13)
-- Run in Supabase SQL Editor to recreate from scratch.
-- All tables are in the public schema with RLS enabled.

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Linked 1:1 to auth.users via id.
-- role CHECK constraint only allows 'student' or 'restaurant'.
-- username is unique, set at registration, never changes.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('student', 'restaurant')),
  username    text unique,          -- added live; lowercased, 3-20 chars
  name        text,                 -- full name of the user
  email       text,                 -- synthetic: username@tiffino.local
  phone       text,
  location    text,                 -- student: area/locality
  diet_pref   text check (diet_pref in ('veg', 'nonveg', 'mix')),
  created_at  timestamptz not null default now()
);

-- ─── restaurants ─────────────────────────────────────────────────────────────
create table if not exists public.restaurants (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  name                 text not null,
  address              text,
  area                 text,
  base_price           numeric not null default 0,
  serves_lunch         boolean not null default true,
  serves_dinner        boolean not null default true,
  lunch_skip_cutoff    time,        -- IST cutoff for skipping lunch (e.g. '10:00')
  dinner_skip_cutoff   time,        -- IST cutoff for skipping dinner (e.g. '18:00')
  qr_token             text,
  created_at           timestamptz not null default now()
);

-- ─── dishes ──────────────────────────────────────────────────────────────────
create table if not exists public.dishes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  description   text,
  image_url     text,
  diet_type     text check (diet_type in ('veg', 'nonveg', 'mix')),
  created_at    timestamptz not null default now()
);

-- ─── weekly_menu ─────────────────────────────────────────────────────────────
-- Template: 0=Monday … 6=Sunday; repeats every week.
create table if not exists public.weekly_menu (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day_of_week   integer not null check (day_of_week between 0 and 6),
  meal_type     text not null check (meal_type in ('lunch', 'dinner')),
  dish_id       uuid references public.dishes(id) on delete set null,
  diet_type     text,
  unique (restaurant_id, day_of_week, meal_type)
);

-- ─── subscriptions ───────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references public.profiles(id) on delete cascade,
  restaurant_id        uuid not null references public.restaurants(id) on delete cascade,
  status               text not null default 'active',
  slots                text[] not null default '{}',   -- e.g. '{lunch,dinner}'
  tokens_total         integer not null,
  tokens_remaining     integer not null,
  rollover_in          integer not null default 0,
  start_date           date not null,
  end_date             date not null,
  price_paid           numeric not null,
  prev_subscription_id uuid references public.subscriptions(id),
  created_at           timestamptz not null default now()
);

-- ─── redemptions ─────────────────────────────────────────────────────────────
create table if not exists public.redemptions (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions(id) on delete cascade,
  student_id       uuid not null references public.profiles(id),
  restaurant_id    uuid not null references public.restaurants(id),
  meal_date        date not null,
  meal_type        text not null check (meal_type in ('lunch', 'dinner')),
  status           text not null default 'pending',
  claimed          boolean not null default false,
  admin_action     text,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now()
);
