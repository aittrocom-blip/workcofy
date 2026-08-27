-- Adds country as a first-class dimension (Perú + Chile) and an
-- internal-only outreach contact table, ahead of seeding cafés outside
-- Lima for the first time.

alter table spaces add column if not exists country text not null default 'pe'
  check (country in ('pe', 'cl'));

-- The original district CHECK hardcoded the 3 Lima neighborhoods this app
-- launched with (see 0001_create_spaces.sql). Expanding into Chile (whose
-- comunas — Las Condes, Vitacura, Providencia, etc. — are a different set
-- entirely) makes an exhaustive per-row enum unsustainable. District values
-- are now validated in application code instead of the database.
alter table spaces drop constraint if exists spaces_district_check;

create index if not exists spaces_country_idx on spaces (country);

-- Internal outreach contact info (WhatsApp / email used to reach out to a
-- café's owner about a partnership). This must never be readable through
-- the public anon key the browser ships with, unlike `spaces` which is
-- intentionally public — so it lives in its own table with RLS enabled and
-- NO policies at all. anon/authenticated get zero rows; only the
-- service-role key (seed scripts, admin tooling) can read or write, since
-- service_role bypasses RLS.
create table if not exists space_internal_contacts (
  space_id uuid primary key references spaces(id) on delete cascade,
  whatsapp text,
  email text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table space_internal_contacts enable row level security;

-- Storage bucket for café photos resolved from Google Places. Public read
-- (photos are meant to be shown on the site once a space is approved);
-- writes only ever happen from seed scripts via the service-role key.
insert into storage.buckets (id, name, public)
values ('space-photos', 'space-photos', true)
on conflict (id) do nothing;
