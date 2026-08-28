-- Lets a user edit their own profile (name/country/city/marketing_consent)
-- from /perfil. Column-level grant is the actual security boundary, not
-- just the RLS row check — without it, a hand-crafted request scoped to
-- "my own row" could still smuggle an is_admin change through the same
-- update. RLS restricts *which row*; this grant restricts *which columns*.
revoke update on profiles from authenticated;
grant update (name, country, city, marketing_consent, marketing_consent_at) on profiles to authenticated;

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
