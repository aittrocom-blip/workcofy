-- Local Workcofy catalog for curated Spotify playlists. Spotify is only the
-- source of discovery/synchronization; visitors read this stable catalog.
create table if not exists public.music_playlists (
  id text primary key,
  category_key text not null,
  category_title text not null,
  name text not null,
  owner text,
  image_url text,
  spotify_url text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.music_playlists enable row level security;
drop policy if exists "Anyone can read active music catalog" on public.music_playlists;
create policy "Anyone can read active music catalog" on public.music_playlists for select to anon, authenticated using (active = true);
grant select on public.music_playlists to anon, authenticated;

insert into public.music_playlists (id, category_key, category_title, name, owner, image_url, spotify_url, sort_order)
values
('37i9dQZF1DX0wMD4IoQ5aJ','focus','Concentración profunda','Electronic Focus','Spotify','https://i.scdn.co/image/ab67706f0000000251a837a657686b08f7359f4e','https://open.spotify.com/playlist/37i9dQZF1DX0wMD4IoQ5aJ',1),
('70P9TRjdmwxUQyH03yNlUZ','focus','Concentración profunda','Anxiety Focus Music','Beat Tree Records','https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72cebc102d60931ef98e985b3fa','https://open.spotify.com/playlist/70P9TRjdmwxUQyH03yNlUZ',2),
('37i9dQZF1DX8Uebhn9wzrS','lofi','Lo-fi para trabajar','chill lofi study beats','Spotify','https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cba237b11ebbe59a425db3033','https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS',1),
('2Al9G2jrWkwDlRFMZaw1GX','lofi','Lo-fi para trabajar','lofi Jazz cafe','Chill Select','https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cba237b11ebbe59a425db3033','https://open.spotify.com/playlist/2Al9G2jrWkwDlRFMZaw1GX',2),
('1vmPeUv7I9SbldjHpfuXWu','coffee','Café & trabajo','WORK CAFÉ','Santander España','https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c22c6f68b70ac02c2f84979aa','https://open.spotify.com/playlist/1vmPeUv7I9SbldjHpfuXWu',1),
('0W1OHOYxgiJJKYHrY2dsL1','coffee','Café & trabajo','Cozy Coffee Shop Jazz','Calypto','https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da844a8cdc091f267ce1d8554e9b','https://open.spotify.com/playlist/0W1OHOYxgiJJKYHrY2dsL1',2),
('4uAjKH707f6tvAp9NqPe5w','reading','Lectura y estudio','Piano for studying/reading','Alda','https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c6f54d139c556f68c21f0333c','https://open.spotify.com/playlist/4uAjKH707f6tvAp9NqPe5w',1),
('37i9dQZF1DX9sIqqvKsjG8','reading','Lectura y estudio','Instrumental Study','Spotify',null,'https://open.spotify.com/playlist/37i9dQZF1DX9sIqqvKsjG8',2),
('5IZ8B5Io6dSJ5h11QgKZ7k','energy','Energía productiva','Home Office Working From Home','sense.','https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c2d335e9859e6e866471c445f','https://open.spotify.com/playlist/5IZ8B5Io6dSJ5h11QgKZ7k',1),
('3hlnFDbfaIVdFVIiei8u6x','nature','Ruido y naturaleza','White Noise Nature Sounds','Sleep Music Garden','https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84e196198212f7fe9b20a300af','https://open.spotify.com/playlist/3hlnFDbfaIVdFVIiei8u6x',1)
on conflict (id) do update set image_url = excluded.image_url, name = excluded.name, owner = excluded.owner, updated_at = now();
