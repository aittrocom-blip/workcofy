create table if not exists public.parking_locations (
  id uuid primary key default gen_random_uuid(),
  google_place_id text not null unique,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  last_synced_at timestamptz not null default now()
);

alter table public.parking_locations enable row level security;
create policy "Parking locations are public" on public.parking_locations
  for select using (true);
create index if not exists parking_locations_geo_idx on public.parking_locations (latitude, longitude);
