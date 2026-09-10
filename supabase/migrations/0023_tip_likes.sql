-- One vote per member and tip; only aggregate totals are public.
create table if not exists public.tip_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  tip_id uuid not null references public.tips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tip_id)
);
create index if not exists tip_likes_tip_id_idx on public.tip_likes(tip_id);
alter table public.tip_likes enable row level security;

create policy "Members read their own tip likes" on public.tip_likes
  for select to authenticated using (auth.uid() = user_id);
create policy "Members like published tips" on public.tip_likes
  for insert to authenticated with check (
    auth.uid() = user_id and exists (
      select 1 from public.tips where id = tip_id and published = true
    )
  );
create policy "Members remove their own tip likes" on public.tip_likes
  for delete to authenticated using (auth.uid() = user_id);

alter table public.tips add column if not exists like_count integer not null default 0;

-- Atomic deltas prevent concurrent votes from overwriting each other.
create or replace function public.sync_tip_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update public.tips set like_count = like_count + 1 where id = NEW.tip_id;
  elsif TG_OP = 'DELETE' then
    update public.tips set like_count = greatest(0, like_count - 1) where id = OLD.tip_id;
  end if;
  return null;
end;
$$;
revoke all on function public.sync_tip_like_count() from public;
create trigger tip_likes_sync_count after insert or delete on public.tip_likes
  for each row execute function public.sync_tip_like_count();

-- In the Supabase Table Editor, sort tips.like_count descending to rank tips.
