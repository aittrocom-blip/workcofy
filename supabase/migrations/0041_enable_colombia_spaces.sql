-- Bogotá expansion: allow Colombian spaces in the shared spaces table.
alter table public.spaces drop constraint if exists spaces_country_check;
alter table public.spaces add constraint spaces_country_check check (country in ('pe', 'cl', 'co'));
