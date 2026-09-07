-- Favoritos para cursos ("Aprende") — mismo modelo exacto que `favorites`
-- (espacios), como tabla propia en vez de una relación polimórfica: un save-
-- for-later privado por usuario, sin exponer nada a nadie más.
create table if not exists course_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table course_favorites enable row level security;

drop policy if exists "Users can read their own course favorites" on course_favorites;
create policy "Users can read their own course favorites"
  on course_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own course favorites" on course_favorites;
create policy "Users can add their own course favorites"
  on course_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own course favorites" on course_favorites;
create policy "Users can remove their own course favorites"
  on course_favorites for delete
  using (auth.uid() = user_id);
