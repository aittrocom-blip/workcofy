-- Spotify playlists aren't rows in our DB, so unlike favorites/course_favorites
-- (which just store an id and join back to a live spaces/courses table),
-- playlist_favorites needs its own display data captured at save time —
-- otherwise /favoritos would have nothing to render for a saved playlist,
-- and re-fetching from Spotify per row would 404 for editorial playlists
-- (see lib/spotify.ts FEATURED_PLAYLISTS comment) and break once a playlist
-- is deleted or renamed upstream.
alter table playlist_favorites add column if not exists name text;
alter table playlist_favorites add column if not exists image text;
alter table playlist_favorites add column if not exists owner text;
alter table playlist_favorites add column if not exists url text;
alter table playlist_favorites add column if not exists category_key text;
alter table playlist_favorites add column if not exists category_title text;
