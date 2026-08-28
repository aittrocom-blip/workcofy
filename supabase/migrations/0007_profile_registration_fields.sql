alter table profiles add column if not exists name text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists acquisition_source text;
alter table profiles add column if not exists marketing_consent boolean not null default false;
alter table profiles add column if not exists marketing_consent_at timestamptz;
alter table profiles add column if not exists terms_accepted boolean not null default false;
alter table profiles add column if not exists terms_version text;
alter table profiles add column if not exists terms_accepted_at timestamptz;

alter table profiles add constraint profiles_country_iso
  check (country is null or country ~ '^[a-z]{2}$');
alter table profiles add constraint profiles_text_len
  check (
    length(coalesce(name, '')) <= 120
    and length(coalesce(city, '')) <= 120
    and length(coalesce(acquisition_source, '')) <= 40
  );

-- Reads the extra fields signUp()'s options.data attaches to auth.users as
-- raw_user_meta_data — the client never gets a session until email
-- confirmation, so this trigger (not a client-side update) is the only way
-- to populate these columns at signup time. See the design spec's
-- "How new fields reach the database" section for the rejected alternatives.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, name, country, city, acquisition_source,
    marketing_consent, marketing_consent_at, terms_accepted, terms_version, terms_accepted_at
  )
  values (
    new.id, coalesce(new.email, ''),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'acquisition_source',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    case when (new.raw_user_meta_data->>'marketing_consent')::boolean then now() else null end,
    coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false),
    case when (new.raw_user_meta_data->>'terms_accepted')::boolean then 'v1' else null end,
    case when (new.raw_user_meta_data->>'terms_accepted')::boolean then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = '';
