-- Daily streak: consecutive Lima-calendar-days a user has visited Workcofy
-- logged in. No new table — three columns on profiles, advanced through a
-- security-definer RPC so the client can't just set streak_count directly.
alter table profiles add column if not exists streak_count int not null default 0;
alter table profiles add column if not exists streak_longest int not null default 0;
alter table profiles add column if not exists streak_last_active date;

-- Re-states the full authenticated-update column list (0009/0012's pattern)
-- without streak_* — those stay reachable only through the RPC below, never
-- a direct client update, or a user could just set their own streak.
revoke update on profiles from authenticated;
grant update (name, country, city, marketing_consent, marketing_consent_at, avatar_id) on profiles to authenticated;

-- Idempotent per calendar day: a second call the same day just returns the
-- current count. A gap of more than one day resets to 1 instead of 0, since
-- the visit that triggers this call always counts as day one of a new run.
create or replace function touch_daily_streak()
returns table(streak_count int, streak_longest int)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'America/Lima')::date;
  v_row record;
  v_new_count int;
  v_new_longest int;
begin
  if v_user_id is null then
    return;
  end if;

  select p.streak_count, p.streak_longest, p.streak_last_active into v_row
  from profiles p where p.id = v_user_id;

  if v_row.streak_last_active = v_today then
    v_new_count := v_row.streak_count;
    v_new_longest := v_row.streak_longest;
  elsif v_row.streak_last_active = v_today - 1 then
    v_new_count := v_row.streak_count + 1;
    v_new_longest := greatest(v_row.streak_longest, v_new_count);
  else
    v_new_count := 1;
    v_new_longest := greatest(v_row.streak_longest, 1);
  end if;

  update profiles set streak_count = v_new_count, streak_longest = v_new_longest, streak_last_active = v_today
  where id = v_user_id;

  return query select v_new_count, v_new_longest;
end;
$$;

revoke all on function touch_daily_streak() from public, anon;
grant execute on function touch_daily_streak() to authenticated;
