# Workcofy Rewards Phase 1 (Coins + Misiones + Carta especial) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing informational Coins catalog into a real per-user Rewards ledger, add a
missions system that pays bonus Rewards, and gate a monthly "Carta especial" partner perk behind
mission completion.

**Architecture:** One additive Supabase migration adds three new tables (`reward_events`,
`missions`, `mission_progress`) plus two `spaces` columns, with all writes to the two ledger
tables happening exclusively through `security definer` trigger functions fired by `reviews`/
`favorites` inserts — never from application code. The Next.js layer reads these tables directly
(public catalog reads via the existing anon-client `lib/data/*.ts` pattern; per-user reads via the
existing inline cookie-aware-client pattern already used in `/perfil` and `/favoritos`) and adds a
handful of small, focused UI pieces: a header balance badge, a homepage missions list, a `/perfil`
rewards panel, and a per-space "Carta especial" block.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + `@supabase/ssr` + `@supabase/supabase-js`), TypeScript, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-workcofy-rewards-phase1-design.md`

## Global Constraints

- Currency stays named **"Rewards"** in all user-facing copy (not "Coins", not "Puntos") — matches
  what's already live in `CoinsSection.tsx`.
- `missions` ships with **zero seed rows**. Every piece of UI that reads from it must render
  nothing (not an empty box, not a "no missions yet" placeholder) while it's empty — same rule
  already followed for the Beneficios homepage section when `space_benefits` is empty.
- `reward_events` and `mission_progress` are written **only** by `security definer` trigger
  functions. `insert`/`update`/`delete` are revoked from `authenticated` on both tables — no
  application code path may write to them directly.
- The "first review per space only earns Rewards once" rule and the "toggling a favorite on/off
  repeatedly doesn't re-trigger a mission" rule are both enforced at the database level (unique
  constraints / live recomputation), never by trusting application code to check first.
- Carta especial unlock threshold is the code constant `MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL = 2`,
  defined once in `lib/rewards/constants.ts` and imported everywhere it's needed — never
  duplicated as a bare literal.
- Month boundaries (for `monthly`-period missions and the Carta especial unlock check) are
  computed in UTC on both the database side (`date_trunc('month', now())`) and the application
  side (`Date.UTC(...)`) — deliberately not Lima-local time, so the two sides can never disagree
  about which "month" a completion falls into. A few hours of skew right at month boundary is an
  accepted simplification.
- This codebase's `lib/data/*.ts` functions (thin Supabase wrappers) are **not** unit-tested
  anywhere in the existing code (`lib/data/coins.ts`, `lib/data/reviews.ts`, `lib/data/spaces.ts`
  all have zero test files) — verification for this kind of function is `tsc --noEmit` +
  `npm run build` + manual dev-server checks, not Vitest. Follow that existing convention; do not
  introduce a new Supabase-mocking test pattern for this plan's data functions.
- Supabase migrations in this project are applied by hand (pasted into the Supabase SQL Editor) —
  this repo isn't linked via the Supabase CLI. Every migration task ends with the exact SQL to
  paste and manual verification queries to run afterward, not an automated test run.

---

### Task 1: Database migration — rewards ledger, missions, Carta especial columns

**Files:**
- Create: `supabase/migrations/0011_rewards.sql`

**Interfaces:**
- Consumes: existing `coin_rules(action, label, coins, active)` (from `0003_trust_layer.sql`),
  `reviews(id, user_id, space_id, created_at)` (from `0010_reviews.sql`),
  `favorites(user_id, space_id, created_at)` (from `0008_favorites.sql`), `spaces(id)`.
- Produces:
  - Table `reward_events(id uuid, user_id uuid, action text, label text, coins int, space_id uuid, created_at timestamptz)`.
  - Table `missions(id uuid, key text, label text, description text, tracked_action text, target_count int, coins int, period text, active boolean, sort_order int)` — **empty, no seed rows**.
  - Table `mission_progress(id uuid, user_id uuid, mission_id uuid, period_key text, completed_at timestamptz)`.
  - Columns `spaces.special_menu_enabled boolean not null default false`, `spaces.special_menu_content text`.
  - Trigger `reviews_award_reward` (function `award_reward_for_review()`) — inserts a
    `reward_events` row for the `full_review` `coin_rules` action on every `reviews` INSERT
    (never UPDATE).
  - Trigger `reviews_missions_progress` (function `reviews_advance_missions()`) and trigger
    `favorites_missions_progress` (function `favorites_advance_missions()`) — both call the shared
    function `mission_progress_advance(p_user_id uuid, p_tracked_action text, p_space_id uuid)`.

- [ ] **Step 1: Write the migration file**

```sql
-- Rewards Phase 1: Coins ledger + Misiones + Carta especial. See
-- docs/superpowers/specs/2026-08-28-workcofy-rewards-phase1-design.md.

-- 1. reward_events — the real Rewards ledger. Append-only; balance is
-- sum(coins) at read time, never a stored/cached column. label is
-- denormalized at insert time so a user's history stays readable even if a
-- coin_rules/missions label is edited later.
create table if not exists reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  label text not null,
  coins int not null,
  space_id uuid references spaces(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reward_events_user_id_idx on reward_events(user_id);

alter table reward_events enable row level security;

drop policy if exists "Users can read their own reward events" on reward_events;
create policy "Users can read their own reward events"
  on reward_events for select
  using (auth.uid() = user_id);

-- Only security definer trigger functions may write here — never the app.
revoke insert, update, delete on reward_events from authenticated;

-- 2. Reviews trigger — awards the existing full_review coin_rules action.
-- Fires only on INSERT. reviews already has unique(user_id, space_id), so a
-- user re-saving their review for the same space is an UPDATE, which this
-- trigger never sees — that's how "only the first time per space" holds,
-- with no app-layer bookkeeping and no race condition.
create or replace function award_reward_for_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rule record;
begin
  select coins, label into rule from coin_rules where action = 'full_review' and active = true;
  if found then
    insert into reward_events (user_id, action, label, coins, space_id)
    values (new.user_id, 'full_review', rule.label, rule.coins, new.space_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_award_reward on reviews;
create trigger reviews_award_reward
  after insert on reviews
  for each row execute function award_reward_for_review();

-- 3. missions — catalog. Ships EMPTY on purpose: mission content is defined
-- later by hand via the Supabase Table Editor, same pattern as
-- space_benefits/coin_redemptions. Public read so the (currently empty)
-- catalog can be shown to logged-out visitors once real rows exist.
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null,
  tracked_action text not null check (tracked_action in ('review', 'favorite')),
  target_count int not null,
  coins int not null,
  period text not null check (period in ('once', 'monthly')),
  active boolean not null default true,
  sort_order int not null default 0
);

alter table missions enable row level security;

drop policy if exists "Public can read active missions" on missions;
create policy "Public can read active missions"
  on missions for select
  to anon
  using (active = true);

-- 4. mission_progress — a completion MARKER, not an incrementing counter.
-- Counting inserts directly would be exploitable (favorites rows get
-- deleted and re-created by the existing toggle, so a raw counter could be
-- farmed by toggling the same space on/off). Instead the qualifying count
-- is recomputed live from the source table every time, and exactly one row
-- is written the moment that count first reaches the target — the
-- unique(user_id, mission_id, period_key) constraint makes the payout
-- idempotent under concurrent inserts.
create table if not exists mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  period_key text not null, -- 'lifetime' for period='once', 'YYYY-MM' (UTC) for period='monthly'
  completed_at timestamptz not null default now(),
  unique (user_id, mission_id, period_key)
);

alter table mission_progress enable row level security;

drop policy if exists "Users can read their own mission progress" on mission_progress;
create policy "Users can read their own mission progress"
  on mission_progress for select
  using (auth.uid() = user_id);

revoke insert, update, delete on mission_progress from authenticated;

create or replace function mission_progress_advance(p_user_id uuid, p_tracked_action text, p_space_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
  v_period_key text;
  v_qualifying_count int;
  v_rows int;
begin
  for m in select * from missions where tracked_action = p_tracked_action and active = true loop
    v_period_key := case when m.period = 'monthly' then to_char(now(), 'YYYY-MM') else 'lifetime' end;

    if p_tracked_action = 'review' then
      select count(distinct space_id) into v_qualifying_count from reviews
        where user_id = p_user_id and (m.period = 'once' or created_at >= date_trunc('month', now()));
    else
      select count(distinct space_id) into v_qualifying_count from favorites
        where user_id = p_user_id and (m.period = 'once' or created_at >= date_trunc('month', now()));
    end if;

    if v_qualifying_count >= m.target_count then
      insert into mission_progress (user_id, mission_id, period_key)
      values (p_user_id, m.id, v_period_key)
      on conflict (user_id, mission_id, period_key) do nothing;

      get diagnostics v_rows = row_count;
      if v_rows > 0 then
        insert into reward_events (user_id, action, label, coins, space_id)
        values (p_user_id, 'mission_' || m.key, m.label, m.coins, p_space_id);
      end if;
    end if;
  end loop;
end;
$$;

-- Postgres trigger functions take no arguments and read NEW directly, so
-- each source table gets a thin zero-arg wrapper that calls the shared
-- function above with the right tracked_action.
create or replace function reviews_advance_missions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform mission_progress_advance(new.user_id, 'review', new.space_id);
  return new;
end;
$$;

drop trigger if exists reviews_missions_progress on reviews;
create trigger reviews_missions_progress
  after insert on reviews
  for each row execute function reviews_advance_missions();

create or replace function favorites_advance_missions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform mission_progress_advance(new.user_id, 'favorite', new.space_id);
  return new;
end;
$$;

drop trigger if exists favorites_missions_progress on favorites;
create trigger favorites_missions_progress
  after insert on favorites
  for each row execute function favorites_advance_missions();

-- 5. Carta especial — set by hand per space for now (same manual-entry
-- pattern as spaces.verified / space_benefits). No structured items table;
-- special_menu_content is plain text, can be normalized later if a partner
-- needs anything richer.
alter table spaces add column if not exists special_menu_enabled boolean not null default false;
alter table spaces add column if not exists special_menu_content text;
```

- [ ] **Step 2: Apply the migration**

Paste the full contents of `supabase/migrations/0011_rewards.sql` into the Supabase SQL Editor for
the project's database and run it. Confirm it completes with no errors.

- [ ] **Step 3: Manually verify the review trigger**

In the Supabase SQL Editor, find a real `user_id` (from `auth.users` or `profiles`) and a real
`space_id` (from `spaces`) you can use for a throwaway test row, then run:

```sql
insert into reviews (user_id, space_id, rating, comment)
values ('<test-user-id>', '<test-space-id>', 5, 'Migration verification test')
on conflict (user_id, space_id) do update set rating = excluded.rating;

select * from reward_events where user_id = '<test-user-id>' order by created_at desc limit 5;
```

Expected: exactly one `reward_events` row with `action = 'full_review'` and `coins = 20` (the
seeded `coin_rules` value). Run the same `insert ... on conflict do update` a second time (an
`UPDATE`, not an `INSERT`) — expected: no new `reward_events` row appears.

- [ ] **Step 4: Manually verify the missions trigger with a throwaway test mission**

`missions` is empty, so insert one temporary test row to exercise the trigger path, then clean it
up:

```sql
insert into missions (key, label, description, tracked_action, target_count, coins, period)
values ('__test_mission', 'Test mission', 'Verification only', 'review', 1, 5, 'once');

-- Re-run the reviews insert/update from Step 3 (or insert a review for a
-- different space) to fire reviews_missions_progress again, then:
select * from mission_progress where user_id = '<test-user-id>';
select * from reward_events where action = '__test_mission_action_check' or action like 'mission_%';

-- Clean up so no test data survives:
delete from mission_progress where mission_id = (select id from missions where key = '__test_mission');
delete from reward_events where action = 'mission___test_mission';
delete from missions where key = '__test_mission';
```

Expected: one `mission_progress` row and one `reward_events` row with `action = 'mission___test_mission'`
and `coins = 5` appeared after the qualifying review existed, and both are gone after cleanup.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0011_rewards.sql
git commit -m "feat: add Rewards ledger, Misiones, and Carta especial migration"
```

---

### Task 2: Data layer — missions, rewards ledger, space type fields, shared constant

**Files:**
- Create: `lib/data/missions.ts`
- Create: `lib/data/rewards.ts`
- Create: `lib/rewards/constants.ts`
- Modify: `lib/data/spaceTypes.ts:15-51` (the `SpaceRecord` interface)

**Interfaces:**
- Consumes: `createServerSupabaseClient()` from `lib/supabase/server.ts` (anon client, for the
  public missions catalog only); the `missions`/`reward_events`/`mission_progress` tables from
  Task 1. `listRewardEvents` and `listMissionProgress` deliberately do **not** construct their own
  Supabase client — `reward_events`/`mission_progress` RLS requires a real `auth.uid()`, which
  only exists on the cookie-aware client each Server Component already builds inline (the
  established pattern in this codebase — see `app/perfil/page.tsx`'s and `app/favoritos/page.tsx`'s
  own inline `createServerClient` calls). These two functions instead accept that client as a
  parameter, so the cookie-aware construction stays exactly where it already lives.
- Produces:
  - `lib/data/missions.ts`: `interface Mission { id: string; key: string; label: string; description: string; trackedAction: 'review' | 'favorite'; targetCount: number; coins: number; period: 'once' | 'monthly'; sortOrder: number }`, `listMissions(): Promise<Mission[]>` (public catalog, anon client), `interface MissionProgressEntry { missionKey: string; completedAt: string }`, `listMissionProgress(supabase: SupabaseClient, userId: string): Promise<MissionProgressEntry[]>`, and the pure helper `cartaEspecialUnlockCountThisMonth(progress: MissionProgressEntry[]): number`.
  - `lib/data/rewards.ts`: `interface RewardEvent { id: string; label: string; coins: number; spaceName: string | null; createdAt: string }`, `listRewardEvents(supabase: SupabaseClient, userId: string): Promise<RewardEvent[]>`, and the pure helper `rewardsBalanceFrom(events: RewardEvent[]): number` (mirrors the existing `reviewStatsFrom(reviews)` pattern in `lib/data/reviews.ts`).
  - `lib/rewards/constants.ts`: `export const MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL = 2`.
  - `SpaceRecord` gains `special_menu_enabled: boolean` and `special_menu_content: string | null`.

- [ ] **Step 1: Create the shared Carta especial constant**

```ts
// lib/rewards/constants.ts
// Single source of truth for the Carta especial unlock threshold — imported
// by both the server-rendered /perfil page and the client-side
// CartaEspecialSection so the two can never disagree about the number.
export const MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL = 2
```

- [ ] **Step 2: Add the missions data function**

```ts
// lib/data/missions.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Mission {
  id: string
  key: string
  label: string
  description: string
  trackedAction: 'review' | 'favorite'
  targetCount: number
  coins: number
  period: 'once' | 'monthly'
  sortOrder: number
}

interface MissionRow {
  id: string
  key: string
  label: string
  description: string
  tracked_action: 'review' | 'favorite'
  target_count: number
  coins: number
  period: 'once' | 'monthly'
  sort_order: number
}

export async function listMissions(): Promise<Mission[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('missions')
    .select('id, key, label, description, tracked_action, target_count, coins, period, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list missions: ${error.message}`)

  return ((data ?? []) as MissionRow[]).map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    trackedAction: row.tracked_action,
    targetCount: row.target_count,
    coins: row.coins,
    period: row.period,
    sortOrder: row.sort_order,
  }))
}

export interface MissionProgressEntry {
  missionKey: string
  completedAt: string
}

interface MissionProgressRow {
  completed_at: string
  missions: { key: string } | { key: string }[] | null
}

export async function listMissionProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<MissionProgressEntry[]> {
  const { data, error } = await supabase
    .from('mission_progress')
    .select('completed_at, missions(key)')
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to list mission progress: ${error.message}`)

  return ((data ?? []) as MissionProgressRow[])
    .map((row) => {
      const mission = Array.isArray(row.missions) ? row.missions[0] : row.missions
      return mission ? { missionKey: mission.key, completedAt: row.completed_at } : null
    })
    .filter((entry): entry is MissionProgressEntry => entry !== null)
}

// Mirrors reviewStatsFrom(reviews) in lib/data/reviews.ts — a pure function
// over already-fetched rows, kept in sync with the trigger's own month
// boundary (Date.UTC, matching the migration's date_trunc('month', now())
// in UTC) so the two never disagree about which "month" a completion is in.
export function cartaEspecialUnlockCountThisMonth(progress: MissionProgressEntry[]): number {
  const now = new Date()
  const startOfMonthUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  return progress.filter((entry) => new Date(entry.completedAt).getTime() >= startOfMonthUtc).length
}
```

- [ ] **Step 3: Add the rewards ledger data function**

```ts
// lib/data/rewards.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RewardEvent {
  id: string
  label: string
  coins: number
  spaceName: string | null
  createdAt: string
}

interface RewardEventRow {
  id: string
  label: string
  coins: number
  created_at: string
  spaces: { name: string } | { name: string }[] | null
}

export async function listRewardEvents(supabase: SupabaseClient, userId: string): Promise<RewardEvent[]> {
  const { data, error } = await supabase
    .from('reward_events')
    .select('id, label, coins, created_at, spaces(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to list reward events: ${error.message}`)

  return ((data ?? []) as RewardEventRow[]).map((row) => {
    const space = Array.isArray(row.spaces) ? row.spaces[0] : row.spaces
    return {
      id: row.id,
      label: row.label,
      coins: row.coins,
      spaceName: space?.name ?? null,
      createdAt: row.created_at,
    }
  })
}

// Mirrors reviewStatsFrom(reviews) in lib/data/reviews.ts — balance is never
// stored, only ever computed from the ledger at read time.
export function rewardsBalanceFrom(events: RewardEvent[]): number {
  return events.reduce((sum, event) => sum + event.coins, 0)
}
```

- [ ] **Step 4: Add the Carta especial columns to `SpaceRecord`**

In `lib/data/spaceTypes.ts`, add two fields to the `SpaceRecord` interface, right after
`view_count` (the last existing field):

```ts
  active: boolean
  view_count: number
  special_menu_enabled: boolean
  special_menu_content: string | null
}
```

(This only changes the TypeScript type — `lib/data/spaces.ts`'s existing `select('*')` calls
already return these columns from the database once Task 1's migration has run; no change needed
there.)

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (`SpaceRecord` consumers that spread `...row as SpaceRecord` via
`normalizeSpace` in `lib/data/spaces.ts` don't need changes — the two new fields just flow through.)

- [ ] **Step 6: Commit**

```bash
git add lib/data/missions.ts lib/data/rewards.ts lib/rewards/constants.ts lib/data/spaceTypes.ts
git commit -m "feat: add missions/rewards data functions and Carta especial space fields"
```

---

### Task 3: Header Rewards balance badge

**Files:**
- Create: `components/layout/RewardsBadge.tsx`
- Modify: `components/layout/HeaderAuthLinks.tsx:45-84` (the logged-in branch)

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` from `lib/supabase/browserClient`; `reward_events`
  table from Task 1 (RLS already scopes reads to the current user).
- Produces: `components/layout/RewardsBadge.tsx` exports `RewardsBadge()` (no props) — renders
  nothing until the user's auth state resolves, then nothing if logged out, then a balance pill.
  Listens for a `window` `'workcofy:reward-earned'` event to refetch (dispatched by Task 4).

- [ ] **Step 1: Write the badge component**

```tsx
// components/layout/RewardsBadge.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function RewardsBadge() {
  const [userId, setUserId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadBalance(uid: string | null) {
      if (!uid) {
        setBalance(null)
        return
      }
      const { data } = await supabase.from('reward_events').select('coins').eq('user_id', uid)
      setBalance((data ?? []).reduce((sum, row) => sum + row.coins, 0))
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadBalance(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      loadBalance(uid)
    })

    function handleRewardEarned() {
      supabase.auth.getUser().then(({ data }) => loadBalance(data.user?.id ?? null))
    }
    window.addEventListener('workcofy:reward-earned', handleRewardEarned)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('workcofy:reward-earned', handleRewardEarned)
    }
  }, [])

  if (userId === null || balance === null) return null

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/w-coins.png" alt="" className="h-3.5 w-3.5" />
      {balance}
    </span>
  )
}
```

- [ ] **Step 2: Wire it into the Header's logged-in state**

In `components/layout/HeaderAuthLinks.tsx`, add the import at the top:

```tsx
import { RewardsBadge } from '@/components/layout/RewardsBadge'
```

Then, inside the `if (user) { ... }` block, add `<RewardsBadge />` right before the `Favoritos`
link so it reads first — replace:

```tsx
  if (user) {
    return (
      <div className={isDesktop ? 'hidden items-center gap-3 sm:flex' : 'flex flex-col gap-1'}>
        <Link
          href="/favoritos"
```

with:

```tsx
  if (user) {
    return (
      <div className={isDesktop ? 'hidden items-center gap-3 sm:flex' : 'flex flex-col gap-1'}>
        <div className={isDesktop ? 'contents' : 'px-2 py-1'}>
          <RewardsBadge />
        </div>
        <Link
          href="/favoritos"
```

(The wrapping `div` keeps `RewardsBadge`'s `null`-while-loading render from shifting the mobile
column's spacing; on desktop `contents` keeps it a plain flex sibling of the links.)

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open the app, log in as a test user. Expected: a small Rewards number appears
in the header next to "Favoritos". Log out — expected: it disappears (component returns `null`).

- [ ] **Step 4: Commit**

```bash
git add components/layout/RewardsBadge.tsx components/layout/HeaderAuthLinks.tsx
git commit -m "feat: show Rewards balance badge in the header"
```

---

### Task 4: Dispatch the reward-earned refresh event

**Files:**
- Modify: `components/space/ReviewsSection.tsx:106-142` (`ReviewForm`'s `handleSubmit`)
- Modify: `components/providers/FavoritesProvider.tsx:50-72` (`toggleFavorite`)

**Interfaces:**
- Consumes: nothing new.
- Produces: both call sites dispatch `window.dispatchEvent(new Event('workcofy:reward-earned'))`
  on a successful write — the exact event name `RewardsBadge` (Task 3) listens for.

- [ ] **Step 1: Dispatch after a successful review save**

In `components/space/ReviewsSection.tsx`, inside `ReviewForm`'s `handleSubmit`, the success path
currently ends with the `onSaved({...})` call inside the `try` block. Add the dispatch right after
it:

```tsx
      onSaved({
        id: data.id,
        userId,
        rating,
        comment: comment.trim() || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewerName: 'Tú',
      })
      window.dispatchEvent(new Event('workcofy:reward-earned'))
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setSaving(false)
    }
```

This fires on every save, including edits that award no new Rewards — harmless, since the badge
just refetches the real balance rather than assuming an increment happened.

- [ ] **Step 2: Dispatch after a successful favorite (insert only, not delete)**

In `components/providers/FavoritesProvider.tsx`, inside `toggleFavorite`, the `else` branch
performs the insert. Add the dispatch after it — replace:

```tsx
      if (alreadyFavorited) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('space_id', spaceId)
      } else {
        await supabase.from('favorites').insert({ user_id: userId, space_id: spaceId })
      }
```

with:

```tsx
      if (alreadyFavorited) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('space_id', spaceId)
      } else {
        await supabase.from('favorites').insert({ user_id: userId, space_id: spaceId })
        window.dispatchEvent(new Event('workcofy:reward-earned'))
      }
```

Only the insert branch dispatches — removing a favorite never earns Rewards, so there's nothing
for the badge to refresh for on delete.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. With Task 1's migration applied and a throwaway test mission inserted (same
approach as Task 1 Step 4, using `tracked_action = 'favorite'` this time), favorite a space in the
UI and confirm the header's Rewards badge (Task 3) updates without a page reload. Remove the test
mission afterward.

- [ ] **Step 4: Commit**

```bash
git add components/space/ReviewsSection.tsx components/providers/FavoritesProvider.tsx
git commit -m "feat: refresh the Rewards badge live after reviews and favorites"
```

---

### Task 5: Homepage Misiones list

**Files:**
- Modify: `components/home/CoinsSection.tsx` (add a `missions` prop and a third catalog block)
- Modify: `app/page.tsx` (fetch and pass `missions`)

**Interfaces:**
- Consumes: `Mission` type + `listMissions()` from Task 2 (`lib/data/missions.ts`).
- Produces: `CoinsSection` accepts a new prop `missions: Mission[]`; renders an additional
  "Misiones" column in the existing grid only when `missions.length > 0` — otherwise identical to
  today.

- [ ] **Step 1: Extend `CoinsSection` with a missions prop and block**

In `components/home/CoinsSection.tsx`, update the imports and props:

```tsx
import Image from 'next/image'
import type { CoinRule, CoinRedemption } from '@/lib/data/coins'
import type { Mission } from '@/lib/data/missions'

interface CoinsSectionProps {
  rules: CoinRule[]
  redemptions: CoinRedemption[]
  missions: Mission[]
}
```

Update the function signature and the empty-state guard:

```tsx
export function CoinsSection({ rules, redemptions, missions }: CoinsSectionProps) {
  if (rules.length === 0 && redemptions.length === 0 && missions.length === 0) return null
```

Add a third conditional block inside the existing `<div className="mt-6 grid gap-6 sm:grid-cols-2">`,
right after the `redemptions.length > 0 && (...)` block (before its closing `)}` and the grid's
closing `</div>`):

```tsx
            {missions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Misiones
                </h4>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {missions.map((mission) => (
                    <li
                      key={mission.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm"
                    >
                      <span>{mission.label}</span>
                      <span className="font-semibold text-workcofy-black">
                        +{mission.coins} <span className="text-workcofy-yellow">Rewards</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
```

- [ ] **Step 2: Fetch missions on the homepage and pass them down**

In `app/page.tsx`, add the import:

```tsx
import { listMissions } from '@/lib/data/missions'
```

Add `listMissions()` to the existing parallel fetch (find the `Promise.all([listCoinRules(), listCoinRedemptions()])` call) and pass the result through:

```tsx
  const [coinRules, coinRedemptions, missions] = await Promise.all([
    listCoinRules(),
    listCoinRedemptions(),
    listMissions(),
  ])
```

```tsx
      <CoinsSection rules={coinRules} redemptions={coinRedemptions} missions={missions} />
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, load the homepage. With `missions` still empty (no seed data), confirm the
Rewards section renders exactly as it does today — no empty "Misiones" heading or box. Insert one
throwaway test mission via SQL (as in Task 1 Step 4), reload — confirm a "Misiones" column now
appears with that mission's label and coin value. Delete the test mission afterward.

- [ ] **Step 4: Commit**

```bash
git add components/home/CoinsSection.tsx app/page.tsx
git commit -m "feat: list active missions on the homepage Rewards section"
```

---

### Task 6: `/perfil` Rewards panel (balance, history, missions, Carta especial status)

**Files:**
- Create: `components/account/RewardsPanel.tsx`
- Modify: `app/perfil/page.tsx`

**Interfaces:**
- Consumes: `listMissions()`, `listMissionProgress()`, `cartaEspecialUnlockCountThisMonth()` from
  Task 2 (`lib/data/missions.ts`); `listRewardEvents()`, `rewardsBalanceFrom()` from Task 2
  (`lib/data/rewards.ts`); `MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL` from Task 2
  (`lib/rewards/constants.ts`); the existing cookie-aware `createServerClient` pattern already
  used in `app/perfil/page.tsx`.
- Produces: `components/account/RewardsPanel.tsx` — a presentational component:
  `RewardsPanel({ balance, events, missions, completedMissionKeys, cartaEspecialCompletedThisMonth }: RewardsPanelProps)`.

- [ ] **Step 1: Write the presentational panel component**

```tsx
// components/account/RewardsPanel.tsx
import { MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL } from '@/lib/rewards/constants'
import type { Mission } from '@/lib/data/missions'
import type { RewardEvent } from '@/lib/data/rewards'

interface RewardsPanelProps {
  balance: number
  events: RewardEvent[]
  missions: Mission[]
  completedMissionKeys: Set<string>
  cartaEspecialCompletedThisMonth: number
}

export function RewardsPanel({
  balance,
  events,
  missions,
  completedMissionKeys,
  cartaEspecialCompletedThisMonth,
}: RewardsPanelProps) {
  const remaining = Math.max(0, MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL - cartaEspecialCompletedThisMonth)

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Tus Rewards</h2>
        <p className="mt-1 flex items-center gap-1.5 text-2xl font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/w-coins.png" alt="" className="h-5 w-5" />
          {balance}
        </p>

        {events.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
              >
                <span>
                  {event.label}
                  {event.spaceName && <span className="text-gray-400"> · {event.spaceName}</span>}
                </span>
                <span className="font-semibold text-workcofy-black">+{event.coins}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {missions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold tracking-tight">Misiones</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {missions.map((mission) => {
              const done = completedMissionKeys.has(mission.key)
              return (
                <li
                  key={mission.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>
                    {mission.label}
                    <span className="ml-2 text-xs text-gray-400">{done ? 'Completada' : 'Pendiente'}</span>
                  </span>
                  <span className="font-semibold text-workcofy-black">+{mission.coins}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold tracking-tight">Carta especial</h2>
        <p className="mt-2 text-sm text-gray-600">
          {remaining === 0
            ? 'Desbloqueada este mes — ya puedes verla en los espacios partner que la ofrecen.'
            : `Completa ${remaining} misión${remaining === 1 ? '' : 'es'} más este mes para desbloquearla.`}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Fetch the panel's data in `/perfil` and render it**

In `app/perfil/page.tsx`, add the imports:

```tsx
import { listMissions, listMissionProgress, cartaEspecialUnlockCountThisMonth } from '@/lib/data/missions'
import { listRewardEvents, rewardsBalanceFrom } from '@/lib/data/rewards'
import { RewardsPanel } from '@/components/account/RewardsPanel'
```

After the existing `profile` fetch (`const { data: profile } = await supabase.from('profiles')...`),
add the Rewards-related fetches — note `supabase` (the page's own cookie-aware client, already
constructed above this point) is passed into `listRewardEvents`/`listMissionProgress` so their
`reward_events`/`mission_progress` reads run under the real user session, per Task 2's design:

```tsx
  const events = await listRewardEvents(supabase, user.id)
  const balance = rewardsBalanceFrom(events)

  const missions = await listMissions()
  const progress = await listMissionProgress(supabase, user.id)
  const completedMissionKeys = new Set(progress.map((entry) => entry.missionKey))
  const cartaEspecialCompletedThisMonth = cartaEspecialUnlockCountThisMonth(progress)
```

Then render `<RewardsPanel>` right after the existing `<ProfileForm ... />` call, inside the same
returned JSX:

```tsx
      <ProfileForm
        initialName={profile?.name ?? ''}
        initialCountry={profile?.country ?? ''}
        initialCity={profile?.city ?? ''}
        initialMarketingConsent={profile?.marketing_consent ?? false}
      />
      <RewardsPanel
        balance={balance}
        events={events}
        missions={missions}
        completedMissionKeys={completedMissionKeys}
        cartaEspecialCompletedThisMonth={cartaEspecialCompletedThisMonth}
      />
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in as a test user who has written at least one review (from earlier
verification steps), visit `/perfil`. Expected: "Tus Rewards" shows a balance ≥ 20 with a
"Reseña completa" line in the history; "Misiones" section is absent (table still empty at this
point unless a throwaway test mission is still present); "Carta especial" shows "Completa 2
misiones más este mes para desbloquearla."

- [ ] **Step 5: Commit**

```bash
git add components/account/RewardsPanel.tsx app/perfil/page.tsx
git commit -m "feat: show Rewards balance, history, missions, and Carta especial status on /perfil"
```

---

### Task 7: Carta especial on the space page and map detail panel

**Files:**
- Create: `components/space/CartaEspecialSection.tsx`
- Modify: `app/spaces/[slug]/page.tsx`
- Modify: `components/discovery/SpaceDetailPanel.tsx`

**Interfaces:**
- Consumes: `MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL` from Task 2; `createBrowserSupabaseClient()`;
  `SpaceRecord.special_menu_enabled` / `special_menu_content` from Task 2; `mission_progress`
  table from Task 1.
- Produces: `components/space/CartaEspecialSection.tsx` exports
  `CartaEspecialSection({ content }: { content: string | null })`.

- [ ] **Step 1: Write the component**

```tsx
// components/space/CartaEspecialSection.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL } from '@/lib/rewards/constants'

interface CartaEspecialSectionProps {
  content: string | null
}

export function CartaEspecialSection({ content }: CartaEspecialSectionProps) {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [completedThisMonth, setCompletedThisMonth] = useState(0)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadStatus(uid: string | null) {
      if (!uid) {
        setCompletedThisMonth(0)
        setLoaded(true)
        return
      }
      const now = new Date()
      const startOfMonthUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
      const { count } = await supabase
        .from('mission_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('completed_at', startOfMonthUtc)
      setCompletedThisMonth(count ?? 0)
      setLoaded(true)
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadStatus(data.user?.id ?? null)
    })
  }, [])

  if (!loaded) return null

  const unlocked = completedThisMonth >= MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL
  const remaining = MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL - completedThisMonth

  return (
    <div className="mt-8 rounded-2xl border border-workcofy-yellow/40 bg-workcofy-yellow/5 p-5">
      <h3 className="text-sm font-semibold tracking-tight">Carta especial</h3>
      {!userId ? (
        <p className="mt-2 text-sm text-gray-500">
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="font-semibold text-black hover:underline"
          >
            Inicia sesión
          </Link>{' '}
          y completa misiones para desbloquear la carta especial de este espacio.
        </p>
      ) : unlocked ? (
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{content}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          Completa {remaining} misión{remaining === 1 ? '' : 'es'} más este mes en{' '}
          <Link href="/perfil" className="font-semibold text-black hover:underline">
            tu perfil
          </Link>{' '}
          para desbloquear la carta especial.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire it into the full space page**

In `app/spaces/[slug]/page.tsx`, add the import:

```tsx
import { CartaEspecialSection } from '@/components/space/CartaEspecialSection'
```

Add the block right before the existing `<ReviewsSection ... />` call at the end of the component:

```tsx
      {space.special_menu_enabled && <CartaEspecialSection content={space.special_menu_content} />}

      <ReviewsSection spaceId={space.id} initialReviews={reviews} initialStats={reviewStats} />
```

- [ ] **Step 3: Wire it into the map detail panel**

In `components/discovery/SpaceDetailPanel.tsx`, add the same import:

```tsx
import { CartaEspecialSection } from '@/components/space/CartaEspecialSection'
```

Add the block right after the Horario `<ul>` closes, at the end of the scrollable content
(before the panel's closing `</div>` tags):

```tsx
        </ul>

        {space.special_menu_enabled && <CartaEspecialSection content={space.special_menu_content} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. With `special_menu_enabled` still `false` for every space (its default),
confirm no "Carta especial" block appears anywhere. Then, in the Supabase SQL Editor, enable it
for one test space:

```sql
update spaces set special_menu_enabled = true, special_menu_content = 'Café gratis con tu Carta especial.'
where slug = '<a-real-space-slug>';
```

Reload that space's page — logged out: confirm the "Inicia sesión..." prompt shows. Logged in
without 2 mission completions this month: confirm the "Completa N misión(es) más..." prompt shows
with the correct count. Manually insert 2 `mission_progress` rows for the test user with
`completed_at = now()` (reusing the throwaway test mission from Task 1 Step 4, run twice with two
different space ids to get two distinct `mission_progress` rows, or just insert directly), reload:
confirm the actual `special_menu_content` text now renders. Revert the test space's columns back
to `false`/`null` afterward.

- [ ] **Step 5: Commit**

```bash
git add components/space/CartaEspecialSection.tsx app/spaces/\[slug\]/page.tsx components/discovery/SpaceDetailPanel.tsx
git commit -m "feat: show Carta especial on space pages, gated by monthly mission completion"
```
