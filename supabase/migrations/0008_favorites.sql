create table if not exists favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, space_id)
);

alter table favorites enable row level security;

-- Unlike profiles, favorites are toggled while the user already has an
-- active session (post-login), so a normal RLS write policy scoped to the
-- caller's own rows is safe and simple — no trigger/metadata trick needed.
drop policy if exists "Users can read their own favorites" on favorites;
create policy "Users can read their own favorites"
  on favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own favorites" on favorites;
create policy "Users can add their own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own favorites" on favorites;
create policy "Users can remove their own favorites"
  on favorites for delete
  using (auth.uid() = user_id);
