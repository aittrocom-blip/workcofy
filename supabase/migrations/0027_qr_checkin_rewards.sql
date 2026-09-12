-- Minimal QR check-in rules: one check-in per venue/day and three venues/day.
insert into coin_rules (action, label, coins, sort_order, active)
values ('checkin', 'Check-in en un espacio', 10, 0, true)
on conflict (action) do update set label = excluded.label, coins = excluded.coins, active = true;

create or replace function enforce_daily_checkin_limit()
returns trigger language plpgsql as $$
declare
  v_today date := (now() at time zone 'America/Lima')::date;
begin
  if (
    select count(distinct space_id) from space_checkins
    where user_id = new.user_id
      and (created_at at time zone 'America/Lima')::date = v_today
      and space_id <> new.space_id
  ) >= 3 then
    raise exception 'daily_checkin_limit';
  end if;
  return new;
end;
$$;

drop trigger if exists space_checkins_daily_limit on space_checkins;
create trigger space_checkins_daily_limit
before insert on space_checkins for each row execute function enforce_daily_checkin_limit();
