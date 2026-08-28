create extension if not exists pgcrypto;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  -- References profiles(id) rather than auth.users(id) directly (unlike
  -- favorites) so PostgREST can embed the reviewer's name via a normal
  -- foreign-table select — profiles.id is already 1:1 with auth.users.id
  -- via its own trigger-backed FK, so this changes nothing about who can
  -- own a review, only which table the join path goes through.
  user_id uuid not null references profiles(id) on delete cascade,
  space_id uuid not null references spaces(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, space_id)
);

create index if not exists reviews_space_id_idx on reviews (space_id);

alter table reviews enable row level security;

-- Reviews are public content, same as the spaces they're attached to —
-- anyone (including anon visitors) can read them.
drop policy if exists "Anyone can read reviews" on reviews;
create policy "Anyone can read reviews"
  on reviews for select
  using (true);

drop policy if exists "Users can create their own reviews" on reviews;
create policy "Users can create their own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

-- Same defense-in-depth as profiles: the RLS check alone would let a
-- crafted request retarget user_id on an update of "your own" row —
-- the column grant below is what actually prevents that.
drop policy if exists "Users can update their own reviews" on reviews;
create policy "Users can update their own reviews"
  on reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reviews" on reviews;
create policy "Users can delete their own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

revoke update on reviews from authenticated;
grant update (rating, comment, updated_at) on reviews to authenticated;
