alter table profiles add column if not exists gender text;
alter table profiles add constraint profiles_gender_valid
  check (gender is null or gender in ('hombre', 'mujer', 'prefiero_no_decir'));

-- Re-defines handle_new_user() (already redefined once in 0007) to also read
-- gender from raw_user_meta_data, same as every other registration field.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, name, country, city, acquisition_source, gender,
    marketing_consent, marketing_consent_at, terms_accepted, terms_version, terms_accepted_at
  )
  values (
    new.id, coalesce(new.email, ''),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'acquisition_source',
    new.raw_user_meta_data->>'gender',
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
