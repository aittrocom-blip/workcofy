-- Saved search alerts for Oportunidades: a user saves the filter combo
-- they're viewing, and the daily cron re-runs it and emails them only the
-- items published after their last notification. No update policy for
-- authenticated — last_notified_at is only ever advanced by the admin
-- client from the cron, never by the user directly.
create table if not exists saved_opportunity_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  filters jsonb not null default '{}',
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists saved_opportunity_alerts_user_id_idx on saved_opportunity_alerts(user_id);

-- Same filter combo saved twice would double-email the user every run —
-- the expression index enforces one row per (user, exact filter set).
create unique index if not exists saved_opportunity_alerts_user_filters_idx
  on saved_opportunity_alerts (user_id, (filters::text));

alter table saved_opportunity_alerts enable row level security;

drop policy if exists "Users can read their own saved alerts" on saved_opportunity_alerts;
create policy "Users can read their own saved alerts"
  on saved_opportunity_alerts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own saved alerts" on saved_opportunity_alerts;
create policy "Users can create their own saved alerts"
  on saved_opportunity_alerts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved alerts" on saved_opportunity_alerts;
create policy "Users can delete their own saved alerts"
  on saved_opportunity_alerts for delete
  using (auth.uid() = user_id);
