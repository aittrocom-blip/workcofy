-- Tracks how many times each space's detail page has been opened. Written
-- only from the server via the service-role client (see lib/data/spaces.ts
-- incrementViewCount) — never exposed to anon writes, since RLS on `spaces`
-- only grants anon a read policy.
alter table spaces add column if not exists view_count integer not null default 0;
