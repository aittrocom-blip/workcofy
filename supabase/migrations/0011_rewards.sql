-- Rewards Phase 1: Coins ledger + Misiones + Carta especial. See
-- docs/superpowers/specs/2026-08-28-workcofy-rewards-phase1-design.md.

-- 1. reward_events — the real Rewards ledger. Append-only; balance is
-- sum(coins) at read time, never a stored/cached column. label is
-- denormalized at insert time so a user's history stays readable even if a
-- coin_rules/missions label is edited later.
create table if not exists reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  label text not null,
  coins int not null,
  space_id uuid references spaces(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reward_events_user_id_idx on reward_events(user_id);

alter table reward_events enable row level security;

drop policy if exists "Users can read their own reward events" on reward_events;
create policy "Users can read their own reward events"
  on reward_events for select
  using (auth.uid() = user_id);

-- Only security definer trigger functions may write here — never the app.
revoke insert, update, delete on reward_events from authenticated;

-- 2. Reviews trigger — awards the existing full_review coin_rules action.
-- Fires only on INSERT. reviews already has unique(user_id, space_id), so a
-- user re-saving their review for the same space is an UPDATE, which this
-- trigger never sees — that's how "only the first time per space" holds,
-- with no app-layer bookkeeping and no race condition.
create or replace function award_reward_for_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rule record;
begin
  select coins, label into rule from coin_rules where action = 'full_review' and active = true;
  if found then
    insert into reward_events (user_id, action, label, coins, space_id)
    values (new.user_id, 'full_review', rule.label, rule.coins, new.space_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_award_reward on reviews;
create trigger reviews_award_reward
  after insert on reviews
  for each row execute function award_reward_for_review();

-- 3. missions — catalog. Ships EMPTY on purpose: mission content is defined
-- later by hand via the Supabase Table Editor, same pattern as
-- space_benefits/coin_redemptions. Public read so the (currently empty)
-- catalog can be shown to logged-out visitors once real rows exist.
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null,
  tracked_action text not null check (tracked_action in ('review', 'favorite')),
  target_count int not null,
  coins int not null,
  period text not null check (period in ('once', 'monthly')),
  active boolean not null default true,
  sort_order int not null default 0
);

alter table missions enable row level security;

drop policy if exists "Public can read active missions" on missions;
create policy "Public can read active missions"
  on missions for select
  to anon
  using (active = true);

-- 4. mission_progress — a completion MARKER, not an incrementing counter.
-- Counting inserts directly would be exploitable (favorites rows get
-- deleted and re-created by the existing toggle, so a raw counter could be
-- farmed by toggling the same space on/off). Instead the qualifying count
-- is recomputed live from the source table every time, and exactly one row
-- is written the moment that count first reaches the target — the
-- unique(user_id, mission_id, period_key) constraint makes the payout
-- idempotent under concurrent inserts.
create table if not exists mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  period_key text not null, -- 'lifetime' for period='once', 'YYYY-MM' (UTC) for period='monthly'
  completed_at timestamptz not null default now(),
  unique (user_id, mission_id, period_key)
);

alter table mission_progress enable row level security;

drop policy if exists "Users can read their own mission progress" on mission_progress;
create policy "Users can read their own mission progress"
  on mission_progress for select
  using (auth.uid() = user_id);

revoke insert, update, delete on mission_progress from authenticated;

create or replace function mission_progress_advance(p_user_id uuid, p_tracked_action text, p_space_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
  v_period_key text;
  v_qualifying_count int;
  v_rows int;
begin
  for m in select * from missions where tracked_action = p_tracked_action and active = true loop
    v_period_key := case when m.period = 'monthly' then to_char(now(), 'YYYY-MM') else 'lifetime' end;

    if p_tracked_action = 'review' then
      select count(distinct space_id) into v_qualifying_count from reviews
        where user_id = p_user_id and (m.period = 'once' or created_at >= date_trunc('month', now()));
    else
      select count(distinct space_id) into v_qualifying_count from favorites
        where user_id = p_user_id and (m.period = 'once' or created_at >= date_trunc('month', now()));
    end if;

    if v_qualifying_count >= m.target_count then
      insert into mission_progress (user_id, mission_id, period_key)
      values (p_user_id, m.id, v_period_key)
      on conflict (user_id, mission_id, period_key) do nothing;

      get diagnostics v_rows = row_count;
      if v_rows > 0 then
        insert into reward_events (user_id, action, label, coins, space_id)
        values (p_user_id, 'mission_' || m.key, m.label, m.coins, p_space_id);
      end if;
    end if;
  end loop;
end;
$$;

-- Postgres trigger functions take no arguments and read NEW directly, so
-- each source table gets a thin zero-arg wrapper that calls the shared
-- function above with the right tracked_action.
create or replace function reviews_advance_missions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform mission_progress_advance(new.user_id, 'review', new.space_id);
  return new;
end;
$$;

drop trigger if exists reviews_missions_progress on reviews;
create trigger reviews_missions_progress
  after insert on reviews
  for each row execute function reviews_advance_missions();

create or replace function favorites_advance_missions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform mission_progress_advance(new.user_id, 'favorite', new.space_id);
  return new;
end;
$$;

drop trigger if exists favorites_missions_progress on favorites;
create trigger favorites_missions_progress
  after insert on favorites
  for each row execute function favorites_advance_missions();

-- 5. Carta especial — set by hand per space for now (same manual-entry
-- pattern as spaces.verified / space_benefits). No structured items table;
-- special_menu_content is plain text, can be normalized later if a partner
-- needs anything richer.
alter table spaces add column if not exists special_menu_enabled boolean not null default false;
alter table spaces add column if not exists special_menu_content text;
