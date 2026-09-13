-- The check-in success screen has always shown a 6-digit "validation code"
-- for the cashier — but it was generated with Math.random() in the browser
-- (components/space/CheckInButton.tsx) and never stored anywhere, so there
-- was no way for anyone at the register to actually confirm it. This gives
-- the code a real row, minted server-side inside checkin_at_space, that a
-- Partner can validate through /partner.
create table if not exists benefit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  benefit_id uuid references space_benefits(id) on delete set null,
  -- Denormalized at mint time, same reasoning as reward_events.label —
  -- history stays readable even if the benefit's own text changes later.
  benefit_label text not null,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  validated_by uuid references partner_accounts(id) on delete set null
);

create index if not exists benefit_redemptions_user_id_idx on benefit_redemptions(user_id);
create index if not exists benefit_redemptions_space_id_idx on benefit_redemptions(space_id);
-- Only one *live* (unused) code with a given value per space at a time —
-- a collision against another space's code is harmless since every lookup
-- is scoped by space_id too.
create unique index if not exists benefit_redemptions_active_code_idx
  on benefit_redemptions(space_id, code) where used_at is null;

alter table benefit_redemptions enable row level security;

drop policy if exists "Users can read their own redemptions" on benefit_redemptions;
create policy "Users can read their own redemptions"
  on benefit_redemptions for select
  using (auth.uid() = user_id);

drop policy if exists "Partners can read their own space redemptions" on benefit_redemptions;
create policy "Partners can read their own space redemptions"
  on benefit_redemptions for select
  using (exists (
    select 1 from partner_accounts a
    where a.space_id = benefit_redemptions.space_id and a.user_id = auth.uid() and a.active
  ));

-- Only the security-definer functions below may write here.
revoke insert, update, delete on benefit_redemptions from authenticated;

-- checkin_at_space now also mints a redemption code for the space's first
-- active benefit (by sort_order), when one exists, and returns it — the
-- return shape grew three columns, so the function has to be dropped and
-- recreated rather than replaced.
drop function if exists checkin_at_space(uuid, double precision, double precision);

create function checkin_at_space(p_space_id uuid, p_lat double precision, p_lng double precision)
returns table(success boolean, message text, coins_awarded int, redemption_code text, benefit_label text, redemption_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_lat double precision;
  v_lng double precision;
  v_distance_km double precision;
  v_today date := (now() at time zone 'America/Lima')::date;
  v_already boolean;
  v_rule record;
  v_benefit record;
  v_code text;
  v_expires_at timestamptz;
  v_coins int := 0;
  v_attempts int := 0;
begin
  if v_user_id is null then
    return query select false, 'not_authenticated', 0, null::text, null::text, null::timestamptz;
    return;
  end if;

  select latitude, longitude into v_lat, v_lng from spaces where id = p_space_id;
  if v_lat is null or v_lng is null then
    return query select false, 'space_not_found', 0, null::text, null::text, null::timestamptz;
    return;
  end if;

  v_distance_km := 6371 * 2 * asin(sqrt(
    power(sin(radians(p_lat - v_lat) / 2), 2) +
    cos(radians(v_lat)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v_lng) / 2), 2)
  ));

  if v_distance_km > 0.15 then
    return query select false, 'too_far', 0, null::text, null::text, null::timestamptz;
    return;
  end if;

  select exists(
    select 1 from space_checkins
    where user_id = v_user_id and space_id = p_space_id
      and (created_at at time zone 'America/Lima')::date = v_today
  ) into v_already;

  if v_already then
    return query select false, 'already_checked_in_today', 0, null::text, null::text, null::timestamptz;
    return;
  end if;

  insert into space_checkins (user_id, space_id, distance_km) values (v_user_id, p_space_id, v_distance_km);

  select coins, label into v_rule from coin_rules where action = 'checkin' and active = true;
  if found then
    v_coins := v_rule.coins;
    insert into reward_events (user_id, action, label, coins, space_id)
    values (v_user_id, 'checkin', v_rule.label, v_rule.coins, p_space_id);
  end if;

  select id, label into v_benefit from space_benefits where space_id = p_space_id order by sort_order asc limit 1;
  if found then
    v_expires_at := now() + interval '1 hour';
    loop
      v_attempts := v_attempts + 1;
      v_code := lpad((floor(random() * 1000000))::text, 6, '0');
      begin
        insert into benefit_redemptions (user_id, space_id, benefit_id, benefit_label, code, expires_at)
        values (v_user_id, p_space_id, v_benefit.id, v_benefit.label, v_code, v_expires_at);
        exit;
      exception when unique_violation then
        if v_attempts >= 5 then
          v_code := null;
          exit;
        end if;
      end;
    end loop;
  end if;

  return query select true, 'ok', v_coins, v_code, v_benefit.label, v_expires_at;
end;
$$;

revoke all on function checkin_at_space(uuid, double precision, double precision) from public, anon;
grant execute on function checkin_at_space(uuid, double precision, double precision) to authenticated;

-- Called from the Partner portal (app/partner/actions.ts) when the cashier
-- types in the member's code. Uses auth.uid() to find the caller's own
-- partner_accounts row rather than trusting a space_id argument, so a
-- Partner can only ever validate codes for their own venue. The update is
-- guarded by `used_at is null` so two near-simultaneous validations of the
-- same code (e.g. a double-tap) can't both succeed.
create function validate_benefit_code(p_code text)
returns table(success boolean, message text, benefit_label text)
language plpgsql security definer set search_path = public as $$
declare
  v_partner record;
  v_redemption record;
  v_updated int;
begin
  select a.id, a.space_id into v_partner
  from partner_accounts a
  where a.user_id = auth.uid() and a.active;

  if not found then
    return query select false, 'not_a_partner', null::text;
    return;
  end if;

  select * into v_redemption
  from benefit_redemptions
  where code = btrim(p_code) and space_id = v_partner.space_id
  order by created_at desc
  limit 1;

  if not found then
    return query select false, 'not_found', null::text;
    return;
  end if;

  if v_redemption.used_at is not null then
    return query select false, 'already_used', v_redemption.benefit_label;
    return;
  end if;

  if v_redemption.expires_at < now() then
    return query select false, 'expired', v_redemption.benefit_label;
    return;
  end if;

  update benefit_redemptions
  set used_at = now(), validated_by = v_partner.id
  where id = v_redemption.id and used_at is null;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return query select false, 'already_used', v_redemption.benefit_label;
    return;
  end if;

  return query select true, 'ok', v_redemption.benefit_label;
end;
$$;

revoke all on function validate_benefit_code(text) from public, anon;
grant execute on function validate_benefit_code(text) to authenticated;
