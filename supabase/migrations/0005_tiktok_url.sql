-- Second social link alongside instagram_url, shown in the "Redes sociales"
-- section on the space detail page. Nullable — most spaces won't have one.
alter table spaces add column if not exists tiktok_url text;
