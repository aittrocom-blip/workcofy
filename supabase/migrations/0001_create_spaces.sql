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

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_district_idx on spaces (district);
create index if not exists spaces_category_idx on spaces (category);
create index if not exists spaces_active_idx on spaces (active);
