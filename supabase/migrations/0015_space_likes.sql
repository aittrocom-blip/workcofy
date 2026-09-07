-- "Me gusta" — a public trust signal per space, separate from favorites
-- (favorites = save for later, private; likes = a public "people recommend
-- this place" count). One like per user per space, same shape as favorites.
create table if not exists space_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, space_id)
);

alter table space_likes enable row level security;

-- Mirrors favorites' RLS exactly: a user can only see/add/remove their own
-- row. The public count itself is exposed via spaces.like_count (below),
-- not by letting anyone read the full space_likes table — nobody needs to
-- see the list of who liked what, only the total.
drop policy if exists "Users can read their own likes" on space_likes;
create policy "Users can read their own likes"
  on space_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own likes" on space_likes;
create policy "Users can add their own likes"
  on space_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own likes" on space_likes;
create policy "Users can remove their own likes"
  on space_likes for delete
  using (auth.uid() = user_id);

-- Denormalized count on spaces, kept in sync by trigger (same approach as
-- view_count/click_count elsewhere) so the public ficha can read one plain
-- integer instead of every client needing permission to count space_likes.
alter table spaces add column if not exists like_count integer not null default 0;

create or replace function sync_space_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update spaces set like_count = (
    select count(*) from space_likes where space_id = coalesce(new.space_id, old.space_id)
  )
  where id = coalesce(new.space_id, old.space_id);
  return null;
end;
$$;

drop trigger if exists space_likes_sync_count on space_likes;
create trigger space_likes_sync_count
  after insert or delete on space_likes
  for each row execute function sync_space_like_count();
