create table public.trivia_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  display_name text not null,
  question_ids integer[] not null,
  position integer not null default 0 check (position between 0 and 5),
  answers jsonb not null default '[]',
  correct integer not null default 0 check (correct between 0 and 5),
  elapsed_ms integer not null default 0 check (elapsed_ms >= 0),
  question_started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(user_id, day)
);
alter table public.trivia_attempts enable row level security;
-- All access goes through authenticated server endpoints. Players cannot
-- submit scores, change deadlines, inspect opponents' answers or read user IDs.
revoke all on public.trivia_attempts from anon, authenticated;
grant all on public.trivia_attempts to service_role;
create index trivia_daily_ranking on public.trivia_attempts(day, correct desc, elapsed_ms, finished_at) where finished_at is not null;
