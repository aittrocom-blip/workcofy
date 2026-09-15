create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  country text not null,
  city text not null,
  address text not null,
  space_type text not null,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.partner_applications enable row level security;
