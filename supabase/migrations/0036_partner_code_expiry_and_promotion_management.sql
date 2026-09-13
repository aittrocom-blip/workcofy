-- Partner redemption rules: each new check-in invalidates the previous unused
-- code for this user and venue; the new code is valid for 10 minutes.
drop function if exists public.checkin_at_space(uuid, double precision, double precision);

create function public.checkin_at_space(p_space_id uuid, p_lat double precision, p_lng double precision)
returns table(success boolean, message text, coins_awarded int, redemption_code text, benefit_label text, redemption_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid(); v_lat double precision; v_lng double precision; v_distance_km double precision;
  v_rule record; v_benefit record; v_code text; v_expires_at timestamptz; v_coins int := 0; v_attempts int := 0;
begin
  if v_user_id is null then return query select false, 'not_authenticated', 0, null::text, null::text, null::timestamptz; return; end if;
  select latitude, longitude into v_lat, v_lng from spaces where id = p_space_id;
  if v_lat is null or v_lng is null then return query select false, 'space_not_found', 0, null::text, null::text, null::timestamptz; return; end if;
  v_distance_km := 6371 * 2 * asin(sqrt(power(sin(radians(p_lat - v_lat) / 2), 2) + cos(radians(v_lat)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v_lng) / 2), 2)));
  if v_distance_km > 0.15 then return query select false, 'too_far', 0, null::text, null::text, null::timestamptz; return; end if;

  -- The scan is recorded every time, but only the new code can be used.
  update benefit_redemptions set expires_at = now(), used_at = coalesce(used_at, now())
    where user_id = v_user_id and space_id = p_space_id and used_at is null;
  insert into space_checkins (user_id, space_id, distance_km) values (v_user_id, p_space_id, v_distance_km);
  select coins, label into v_rule from coin_rules where action = 'checkin' and active = true;
  if found then v_coins := v_rule.coins; insert into reward_events (user_id, action, label, coins, space_id) values (v_user_id, 'checkin', v_rule.label, v_rule.coins, p_space_id); end if;
  select id, label into v_benefit from space_benefits where space_id = p_space_id order by sort_order asc limit 1;
  if found then
    v_expires_at := now() + interval '10 minutes';
    loop
      v_attempts := v_attempts + 1; v_code := lpad((floor(random() * 1000000))::text, 6, '0');
      begin insert into benefit_redemptions (user_id, space_id, benefit_id, benefit_label, code, expires_at) values (v_user_id, p_space_id, v_benefit.id, v_benefit.label, v_code, v_expires_at); exit;
      exception when unique_violation then if v_attempts >= 5 then v_code := null; exit; end if; end;
    end loop;
  end if;
  return query select true, 'ok', v_coins, v_code, v_benefit.label, v_expires_at;
end; $$;

revoke all on function public.checkin_at_space(uuid, double precision, double precision) from public, anon;
grant execute on function public.checkin_at_space(uuid, double precision, double precision) to authenticated;
