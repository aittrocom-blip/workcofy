-- Check-ins: "estuve aquí" backed by real GPS proximity, not an honor
-- system. Verification has to happen server-side — a client-side distance
-- check is trivial to bypass by calling the insert directly — so writes go
-- exclusively through checkin_at_space() below (same insert-locked-to-
-- trigger pattern as reward_events in 0011_rewards.sql).
create table if not exists space_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  distance_km double precision,
  created_at timestamptz not null default now()
);

create index if not exists space_checkins_user_id_idx on space_checkins(user_id);
create index if not exists space_checkins_space_id_idx on space_checkins(space_id);

alter table space_checkins enable row level security;

drop policy if exists "Users can read their own check-ins" on space_checkins;
create policy "Users can read their own check-ins"
  on space_checkins for select
  using (auth.uid() = user_id);

revoke insert, update, delete on space_checkins from authenticated;

-- p_lat/p_lng come from the browser's Geolocation API. Distance uses the
-- same haversine formula as lib/geo/haversine.ts, reimplemented in SQL so
-- the check can't be skipped client-side. 0.15 km (~150m) matches a
-- realistic "you're at this venue" radius for a café/coworking address.
-- One check-in per user per space per Lima calendar day — prevents
-- farming coins by spamming the button.
create or replace function checkin_at_space(p_space_id uuid, p_lat double precision, p_lng double precision)
returns table(success boolean, message text, coins_awarded int)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_lat double precision;
  v_lng double precision;
  v_distance_km double precision;
  v_today date := (now() at time zone 'America/Lima')::date;
  v_already boolean;
  v_rule record;
begin
  if v_user_id is null then
    return query select false, 'not_authenticated', 0;
    return;
  end if;

  select latitude, longitude into v_lat, v_lng from spaces where id = p_space_id;
  if v_lat is null or v_lng is null then
    return query select false, 'space_not_found', 0;
    return;
  end if;

  v_distance_km := 6371 * 2 * asin(sqrt(
    power(sin(radians(p_lat - v_lat) / 2), 2) +
    cos(radians(v_lat)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v_lng) / 2), 2)
  ));

  if v_distance_km > 0.15 then
    return query select false, 'too_far', 0;
    return;
  end if;

  select exists(
    select 1 from space_checkins
    where user_id = v_user_id and space_id = p_space_id
      and (created_at at time zone 'America/Lima')::date = v_today
  ) into v_already;

  if v_already then
    return query select false, 'already_checked_in_today', 0;
    return;
  end if;

  insert into space_checkins (user_id, space_id, distance_km) values (v_user_id, p_space_id, v_distance_km);

  select coins, label into v_rule from coin_rules where action = 'checkin' and active = true;
  if found then
    insert into reward_events (user_id, action, label, coins, space_id)
    values (v_user_id, 'checkin', v_rule.label, v_rule.coins, p_space_id);
    return query select true, 'ok', v_rule.coins;
    return;
  end if;

  return query select true, 'ok', 0;
end;
$$;

-- Uses auth.uid() internally rather than taking a user id param, so unlike
-- mission_progress_advance there's no impersonation risk in granting this
-- straight to authenticated.
revoke all on function checkin_at_space(uuid, double precision, double precision) from public, anon;
grant execute on function checkin_at_space(uuid, double precision, double precision) to authenticated;
