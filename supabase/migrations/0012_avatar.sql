-- supabase/migrations/0012_avatar.sql
-- Adds the avatar-selection column for the Explorar sidebar redesign. See
-- docs/superpowers/specs/2026-08-29-workcofy-explorar-sidebar-redesign-design.md.
--
-- Nullable: null means "hasn't picked one yet" (triggers the first-login
-- picker modal client-side). No FK/enum at the DB level — validity is
-- enforced in the application against the small, fixed lib/avatars.ts set.
alter table profiles add column if not exists avatar_id text;

-- Re-states the full authenticated-update column list (not just adding
-- avatar_id) because `revoke` + `grant` together is how this table's
-- column-level grant is kept as a single source of truth — see
-- 0009_profiles_update_policy.sql, which already shipped the first four
-- columns. This migration doesn't edit that file (it's already applied in
-- production) — it re-issues the same idempotent revoke+grant pair with
-- avatar_id appended.
revoke update on profiles from authenticated;
grant update (name, country, city, marketing_consent, marketing_consent_at, avatar_id) on profiles to authenticated;
