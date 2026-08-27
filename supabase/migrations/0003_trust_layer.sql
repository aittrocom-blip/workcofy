-- Trust & Rewards layer (Fase A): Workcofy Score inputs, Workcofy Verified,
-- Coins info tables. See docs/superpowers/specs/2026-08-26-workcofy-trust-and-rewards-design.md.

-- The 9 flat boolean amenity columns from 0001 are replaced by a single
-- structured `amenities` jsonb column (see below) — confirmed via grep that
-- none of them are read by any component or page, only by
-- lib/data/spaceTypes.ts and one test fixture, both updated in Task 3.
alter table spaces drop column if exists wifi_available;
alter table spaces drop column if exists power_outlets;
alter table spaces drop column if exists laptop_friendly;
alter table spaces drop column if exists meeting_friendly;
alter table spaces drop column if exists workshop_friendly;
alter table spaces drop column if exists event_friendly;
alter table spaces drop column if exists private_rooms;
alter table spaces drop column if exists outdoor_seating;
alter table spaces drop column if exists parking;

-- Every leaf is true | false | null. null means "Información no disponible"
-- and must never be treated as false. Nothing populates this from Google —
-- see Global Constraints above — it starts empty and is filled in by hand
-- or by Fase B community data.
alter table spaces add column if not exists amenities jsonb not null default '{}'::jsonb;

-- Workcofy Verified: independent from `partner_status` (commercial
-- affiliation, stays internal/never rendered). Set by hand via Supabase
-- Table Editor for now — no admin panel in this phase.
alter table spaces add column if not exists verified boolean not null default false;
alter table spaces add column if not exists verified_at timestamptz;
alter table spaces add column if not exists verified_amenities text[] not null default '{}';

-- Public-facing Instagram link. Not available from any API this project
-- calls (Google Places doesn't expose it either) — always manual entry.
alter table spaces add column if not exists instagram_url text;

create table if not exists space_benefits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  label text not null,
  icon text,
  sort_order int not null default 0
);

alter table space_benefits enable row level security;

drop policy if exists "Public can read benefits of active spaces" on space_benefits;
create policy "Public can read benefits of active spaces"
  on space_benefits for select
  to anon
  using (exists (
    select 1 from spaces where spaces.id = space_benefits.space_id and spaces.active = true
  ));

create table if not exists coin_rules (
  id uuid primary key default gen_random_uuid(),
  action text not null unique,
  label text not null,
  coins int not null,
  sort_order int not null default 0,
  active boolean not null default true
);

alter table coin_rules enable row level security;

drop policy if exists "Public can read active coin rules" on coin_rules;
create policy "Public can read active coin rules"
  on coin_rules for select
  to anon
  using (active = true);

-- Seed rows — configurable from the DB per the user's requirement, not
-- hardcoded in any component. No check-in row: the user explicitly decided
-- check-ins are not needed.
insert into coin_rules (action, label, coins, sort_order) values
  ('rate_space', 'Evaluar un espacio', 5, 1),
  ('rate_amenities', 'Evaluar amenities', 5, 2),
  ('upload_photo', 'Subir una foto útil', 10, 3),
  ('full_review', 'Reseña completa', 20, 4)
on conflict (action) do nothing;

create table if not exists coin_redemptions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  coins_required int not null,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true
);

alter table coin_redemptions enable row level security;

drop policy if exists "Public can read active coin redemptions" on coin_redemptions;
create policy "Public can read active coin redemptions"
  on coin_redemptions for select
  to anon
  using (active = true);

insert into coin_redemptions (label, coins_required, icon, sort_order) values
  ('Café / beneficio', 500, '☕', 1),
  ('Horas de trabajo', 1000, '💻', 2),
  ('Experiencia Workcofy', 2500, '🧑‍💻', 3)
on conflict (label) do nothing;
