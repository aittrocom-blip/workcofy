-- Fixes from the RLS/security audit after 0032/0033 shipped.

-- 1. (HIGH) increment_playlist_click was left directly callable by anyone —
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and every
-- sibling security-definer RPC in this project (mission_progress_advance,
-- checkin_at_space, touch_daily_streak) explicitly revokes that. This one
-- didn't, so POST /rest/v1/rpc/increment_playlist_click with just the anon
-- key let anyone inflate click_count for any real playlist_id, or insert
-- unlimited garbage rows via arbitrary playlist_id strings. The app itself
-- only ever calls this from app/musica/actions.ts using the service-role
-- client, so locking it down there matches actual usage.
revoke all on function increment_playlist_click(text) from public, anon, authenticated;
grant execute on function increment_playlist_click(text) to service_role;

-- 2. (LOW/MEDIUM) partner_promotions' public read policy checked ends_at
-- but not starts_at, so a promotion scheduled for the future was visible
-- the moment a partner saved it instead of on its intended start date.
drop policy if exists "public read active promotions" on public.partner_promotions;
create policy "public read active promotions" on public.partner_promotions for select to anon, authenticated
  using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
