create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'cafe', 'work_cafe', 'coworking', 'meeting_room',
    'hotel', 'workshop', 'event', 'corporate'
  )),
  district text not null check (district in (
    'miraflores', 'san_isidro', 'barranco'
  )),
  address text,
  latitude double precision,
  longitude double precision,
  google_place_id text unique,
  google_maps_url text,
  phone text,
  website text,
  rating numeric(2,1),
  review_count integer,
  price_level integer,
  opening_hours jsonb,
  photos jsonb,
  description text,

  wifi_available boolean,
  power_outlets boolean,
  laptop_friendly boolean,
  meeting_friendly boolean,
  workshop_friendly boolean,
  event_friendly boolean,
  noise_level text,
  seating_capacity integer,
  private_rooms boolean,
  outdoor_seating boolean,
  parking boolean,
  recommended_stay_minutes integer,
  workcofy_score integer check (workcofy_score is null or (workcofy_score between 0 and 100)),
  workcofy_notes text,
  partner_status text not null default 'none' check (partner_status in ('none', 'partner')),

  -- Provenance of this row's data: 'mock' = fabricated dev/demo fixtures
  -- (lib/places/mock-fixtures.ts), 'google' = resolved from the Google Places
  -- API (scripts/seed-google-places.ts). Surfaced in the UI so fabricated
  -- ratings/hours are never presented as real business data.
  data_source text not null default 'mock' check (data_source in ('mock', 'google')),

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_district_idx on spaces (district);
create index if not exists spaces_category_idx on spaces (category);
create index if not exists spaces_active_idx on spaces (active);

-- Row Level Security. The browser client authenticates with the public anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY, which ships in the client bundle), so without
-- RLS the table would be readable AND writable by anyone who extracts that key,
-- and listSpaces()'s `.eq('active', true)` filter would be trivially bypassed by
-- a raw PostgREST call. The only public grant is read access to active rows;
-- writes remain limited to the service-role key used by the seed scripts.
alter table spaces enable row level security;

create policy "Public can read active spaces"
  on spaces for select
  to anon
  using (active = true);
