-- Community space suggestions + admin "add a space" flow.
-- See conversation: admin can add spaces manually, and any logged-in user
-- can suggest one for admin to review.

-- 'library' (Bibliotecas) has been a real category in the app for a while
-- (lib/categories.ts, /espacios/bibliotecas) but was never added to this
-- CHECK — inserting one would fail. Existing values are kept as-is (no data
-- migration needed, nothing is removed) and 'library' is added.
alter table spaces drop constraint if exists spaces_category_check;
alter table spaces add constraint spaces_category_check check (category in (
  'cafe', 'work_cafe', 'coworking', 'meeting_room',
  'hotel', 'workshop', 'event', 'corporate', 'library'
));

create table if not exists space_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  district text not null,
  country text not null default 'pe',
  address text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_space_id uuid references spaces(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table space_suggestions enable row level security;

-- Same shape as favorites (0008): the user is always in an active session
-- when suggesting a space, so a plain auth.uid()-scoped policy is enough.
-- No update/delete policy for regular users — only the admin's service-role
-- actions (app/admin/sugerencias/actions.ts) move a suggestion out of
-- "pending", the same defense-in-depth pattern as every other admin write.
drop policy if exists "Users can read their own suggestions" on space_suggestions;
create policy "Users can read their own suggestions"
  on space_suggestions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own suggestions" on space_suggestions;
create policy "Users can create their own suggestions"
  on space_suggestions for insert
  with check (auth.uid() = user_id);
