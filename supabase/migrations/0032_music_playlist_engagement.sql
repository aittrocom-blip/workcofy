-- Engagement signals for Spotify playlists shown on /musica. Playlists are
-- fetched live from Spotify and never stored as rows here, so unlike
-- space_likes/favorites there's no parent table to hang a denormalized
-- count on — playlist_stats exists purely to hold that count, one row per
-- Spotify playlist id, created on demand by the trigger/function below.
create table if not exists playlist_stats (
  playlist_id text primary key,
  like_count integer not null default 0,
  click_count integer not null default 0
);

alter table playlist_stats enable row level security;

drop policy if exists "Anyone can read playlist stats" on playlist_stats;
create policy "Anyone can read playlist stats"
  on playlist_stats for select
  using (true);

-- "Me gusta" — public "people like this" signal, same shape as space_likes.
create table if not exists playlist_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);

alter table playlist_likes enable row level security;

drop policy if exists "Users can read their own playlist likes" on playlist_likes;
create policy "Users can read their own playlist likes"
  on playlist_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own playlist likes" on playlist_likes;
create policy "Users can add their own playlist likes"
  on playlist_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own playlist likes" on playlist_likes;
create policy "Users can remove their own playlist likes"
  on playlist_likes for delete
  using (auth.uid() = user_id);

-- Keeps playlist_stats.like_count in sync — mirrors sync_space_like_count,
-- but upserts since (unlike spaces) the target row may not exist yet.
create or replace function sync_playlist_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into playlist_stats (playlist_id, like_count)
  values (
    coalesce(new.playlist_id, old.playlist_id),
    (select count(*) from playlist_likes where playlist_id = coalesce(new.playlist_id, old.playlist_id))
  )
  on conflict (playlist_id) do update set like_count = excluded.like_count;
  return null;
end;
$$;

drop trigger if exists playlist_likes_sync_count on playlist_likes;
create trigger playlist_likes_sync_count
  after insert or delete on playlist_likes
  for each row execute function sync_playlist_like_count();

-- Favoritos — private save-for-later, same shape as favorites/course_favorites.
create table if not exists playlist_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);

alter table playlist_favorites enable row level security;

drop policy if exists "Users can read their own playlist favorites" on playlist_favorites;
create policy "Users can read their own playlist favorites"
  on playlist_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own playlist favorites" on playlist_favorites;
create policy "Users can add their own playlist favorites"
  on playlist_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own playlist favorites" on playlist_favorites;
create policy "Users can remove their own playlist favorites"
  on playlist_favorites for delete
  using (auth.uid() = user_id);

-- Click-through tracking on "Escuchar en Spotify". Called only from the
-- server via the service-role client (see app/musica/actions.ts), same
-- convention as spaces.view_count — never exposed to a direct client write.
create or replace function increment_playlist_click(p_playlist_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into playlist_stats (playlist_id, click_count)
  values (p_playlist_id, 1)
  on conflict (playlist_id) do update set click_count = playlist_stats.click_count + 1;
end;
$$;
