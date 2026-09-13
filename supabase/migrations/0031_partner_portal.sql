-- Limited partner access. Partners never receive permission to edit the source
-- fields of spaces; server actions enforce the same boundary as a second gate.
create table if not exists public.partner_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  space_id uuid not null unique references public.spaces(id) on delete cascade,
  username text not null unique,
  active boolean not null default true,
  force_password_change boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.partner_promotions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_scan_events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  partner_account_id uuid references public.partner_accounts(id) on delete set null,
  event_type text not null check (event_type in ('qr_scan', 'profile_view', 'social_click', 'promotion_view')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.partner_accounts enable row level security;
alter table public.partner_promotions enable row level security;
alter table public.partner_scan_events enable row level security;

create policy "partners read own account" on public.partner_accounts for select to authenticated
  using (user_id = auth.uid());
create policy "partners read own promotions" on public.partner_promotions for select to authenticated
  using (exists (select 1 from public.partner_accounts a where a.space_id = partner_promotions.space_id and a.user_id = auth.uid() and a.active));
create policy "public read active promotions" on public.partner_promotions for select to anon, authenticated
  using (active = true and (ends_at is null or ends_at >= now()));
create policy "partners read own events" on public.partner_scan_events for select to authenticated
  using (exists (select 1 from public.partner_accounts a where a.space_id = partner_scan_events.space_id and a.user_id = auth.uid() and a.active));

grant select on public.partner_accounts, public.partner_promotions, public.partner_scan_events to authenticated;
grant select on public.partner_promotions to anon;
