# Workcofy — Rewards Phase 1: Coins + Misiones + Carta especial — Design Spec

Date: 2026-08-28
Status: Approved by user, pending spec self-review sign-off

## 1. Concept & scope

This phase turns the existing **informational** Coins catalog (`coin_rules` / `coin_redemptions`,
built in the Fase A trust-and-rewards spec, see
`docs/superpowers/specs/2026-08-26-workcofy-trust-and-rewards-design.md`) into a **real,
per-user system** with three connected pieces, built together in one cycle per the user's
explicit direction:

1. **Coins ("Rewards")** — a real ledger. Users earn Rewards for actions (starting with writing
   a review) and see a real balance, not just a static catalog.
2. **Misiones** — structured goals ("deja tu primera reseña", "guarda 3 favoritos", "deja 3
   reseñas este mes") that pay bonus Rewards on completion and drive engagement beyond one-off
   actions.
3. **Carta especial** — a monthly, partner-space-gated perk. A user who completes enough
   misiones in the current calendar month unlocks access to special partner menus for the rest
   of that month.

User-facing naming: the currency stays **"Rewards"** (matches what's already live in
`CoinsSection.tsx`, not the "Workcofy Coins" name from the original Fase A spec — confirmed with
the user, who chose to keep the shipped copy rather than rename it).

### Explicitly deferred (out of scope for this phase)

- **Premios / redemption fulfillment** — `coin_redemptions` stays an informational catalog; there
  is no "spend your balance" flow yet. That's the next phase in the user's stated order
  (Puntos → Misiones → Premios → Carta especial, since folded together here for Coins/Misiones/
  Carta especial — Premios remains separate).
- **Wallet prepago** — explicitly marked "futuro" by the user, not touched at all.
- **Partner self-serve portal** — `spaces.special_menu_enabled` / `special_menu_content` are set
  by hand via the Supabase Table Editor, same pattern as `verified` and `space_benefits` today.
  No admin UI in this phase.
- **Share-tracking missions** — `ShareButton` (native Web Share API) is client-only today and
  writes nothing to the database. A "comparte 3 espacios" mission is not buildable without adding
  server-side share tracking first; not included in the v1 mission seed.
- **Configurable Carta especial threshold** — the "complete 2 misiones this month" unlock rule is
  a code constant (`MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL = 2`), not stored in the database or
  tunable from any admin UI yet.

## 2. Data model

All changes are additive migrations on top of the existing schema (`profiles`, `spaces`,
`favorites`, `reviews`, `coin_rules`, `coin_redemptions`).

### 2.1 `reward_events` — the real ledger

```sql
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
```

Append-only. `label` is **denormalized at insert time** (e.g. "Reseña completa", "Deja tu primera
reseña") rather than joined live from `coin_rules`/`missions` — this keeps a user's history
readable even if a rule's label is edited later, and avoids needing a single FK across two
different source tables (flat actions vs. missions) for one `action` column.

**Balance is never stored** — it's `sum(coins)` over a user's rows, computed at read time. This
avoids a cached-balance-vs-ledger drift bug.

RLS: users read only their own rows (`auth.uid() = user_id`). `insert`/`update`/`delete` are
revoked from `authenticated` entirely — only `security definer` trigger functions (below) can
write, mirroring the existing `handle_new_user` → `profiles` pattern.

### 2.2 Reviews trigger — awards the existing `full_review` rule

```sql
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

create trigger reviews_award_reward
  after insert on reviews
  for each row execute function award_reward_for_review();
```

Fires only on `INSERT`. `reviews` already has `unique (user_id, space_id)` — a user re-saving
their review for the same space is an `UPDATE`, which this trigger never sees. This is how "only
the first time per space" is enforced, at the database level, with no app-layer bookkeeping and
no race condition.

### 2.3 `missions` — catalog

```sql
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
create policy "Public can read active missions" on missions for select to anon using (active = true);

insert into missions (key, label, description, tracked_action, target_count, coins, period, sort_order) values
  ('first_review', 'Deja tu primera reseña', 'Comparte tu opinión sobre un espacio por primera vez.', 'review', 1, 20, 'once', 1),
  ('favorite_three', 'Guarda 3 favoritos', 'Marca 3 espacios como favoritos.', 'favorite', 3, 15, 'once', 2),
  ('monthly_reviewer', 'Deja 3 reseñas este mes', 'Deja 3 reseñas dentro del mes calendario actual.', 'review', 3, 30, 'monthly', 3)
on conflict (key) do nothing;
```

Public read (same pattern as `coin_rules`) so the mission catalog can be shown to logged-out
visitors on the homepage, informationally — same spirit as the existing Coins section.

`tracked_action` is intentionally a small closed set (`review`, `favorite`) matching what's
actually persisted server-side today. Adding a new mission later that reuses one of these two
actions requires **no code change** — just a new row.

### 2.4 `mission_progress` — completion marker (not an incrementing counter)

```sql
create table if not exists mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  period_key text not null, -- 'lifetime' for period='once', 'YYYY-MM' for period='monthly'
  completed_at timestamptz not null default now(),
  unique (user_id, mission_id, period_key)
);
alter table mission_progress enable row level security;
create policy "Users can read their own mission progress" on mission_progress for select using (auth.uid() = user_id);
revoke insert, update, delete on mission_progress from authenticated;
```

**Design choice — completion marker, not a running counter.** An earlier draft of this design
incremented a counter on every insert into `reviews`/`favorites`. That's exploitable: `favorites`
rows can be deleted and re-created (the existing favorite toggle does exactly this), so a counter
would let a user farm "guarda 3 favoritos" by toggling the same space on/off three times. Instead,
completion is checked by **recomputing the qualifying count live** from the source table
(`count(distinct space_id)`, filtered to the current month when `period = 'monthly'`) every time a
relevant insert happens, and writing exactly one `mission_progress` row the moment that count first
reaches the target. The `unique (user_id, mission_id, period_key)` constraint makes the payout
idempotent under concurrent inserts — a second attempt to record the same completion violates the
constraint and pays nothing.

```sql
create or replace function advance_mission_progress(p_user_id uuid, p_tracked_action text, p_space_id uuid)
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

create trigger reviews_missions_progress after insert on reviews
  for each row execute function advance_mission_progress(new.user_id, 'review', new.space_id);
  -- (Postgres trigger functions can't take args directly — the plan will wrap this in a
  -- zero-arg trigger function per table that calls advance_mission_progress(new.*, ...))

create trigger favorites_missions_progress after insert on favorites
  for each row execute function advance_mission_progress(new.user_id, 'favorite', new.space_id);
  -- same wrapping note applies
```

(The two trigger declarations above are illustrative — Postgres trigger functions take no
arguments and read `NEW` directly, so the actual implementation needs a thin `reviews_advance_missions()`
/ `favorites_advance_missions()` wrapper function per table that calls `advance_mission_progress`
with the right arguments. The implementation plan will spell out both wrappers in full.)

**Known limitation, accepted for v1:** once a `period = 'once'` mission is completed, it can never
be completed again, by definition. With only one `monthly`-period mission seeded
(`monthly_reviewer`), a user who has already completed both `once` missions has exactly one
remaining path to unlock Carta especial in later months. This is fine for a v1 seed — more
monthly missions can be added later via a plain `insert into missions`, no code change required —
but it's worth the user knowing this explicitly rather than discovering it as a surprise.

### 2.5 Carta especial — `spaces` columns + live unlock check

```sql
alter table spaces add column if not exists special_menu_enabled boolean not null default false;
alter table spaces add column if not exists special_menu_content text;
```

`special_menu_content` is plain text (not a structured items table) — YAGNI, matches the existing
manual-entry pattern for `verified_amenities`/`space_benefits`. Can be normalized into a real table
later if a partner needs anything richer than free text.

**Unlock rule:** a user has Carta especial access for the current calendar month if they have at
least `MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL` (= 2, a code constant) rows in `mission_progress`
with `completed_at >= date_trunc('month', now())` — counting **any** mission completed this
month, regardless of whether that mission's own `period` is `once` or `monthly`. (An earlier
version of this rule only counted `monthly`-period completions toward the gate, which — with just
one seeded monthly mission — would have made the threshold mathematically unreachable. Counting
by `completed_at` timestamp instead of `period_key` fixes that and is also the more intuitive
reading of "cumplí 2 misiones este mes".)

No new table is needed for the unlock check itself — it's a live `count(*)` query, same spirit as
computing the Rewards balance.

## 3. Data layer & components

- **`lib/data/rewards.ts`**: `getRewardsBalance(userId): Promise<number>`,
  `listRewardEvents(userId): Promise<RewardEvent[]>` (joins `spaces(name)` for display where
  `space_id` is set).
- **`lib/data/missions.ts`**: `listMissions(): Promise<Mission[]>` (public catalog, like
  `listCoinRules`), `listMissionProgress(userId): Promise<MissionProgressRow[]>`,
  `getCartaEspecialStatus(userId): Promise<{ unlocked: boolean; completedThisMonth: number; required: number }>`.
- **`components/layout/RewardsBadge.tsx`** (client, in the Header next to Perfil/Favoritos):
  balance pill, refetches on mount and on `onAuthStateChange`. `ReviewForm` and the favorite
  toggle each dispatch a small `window` custom event (`workcofy:reward-earned`) on success; the
  badge listens for it so the number visibly ticks up right after the action, without needing a
  shared Context provider (only one component consumes this, unlike Favorites).
- **Homepage**: extend the existing Rewards section (or add a sibling `MissionsSection`) to list
  active missions from `listMissions()` — public, informational, same spirit as the existing
  `coin_rules`/`coin_redemptions` display.
- **`/perfil`**: adds (a) Rewards balance + a simple movement history list ("+20 Rewards · Reseña
  en Café de Lima · hace 2 días"), (b) mission progress (completed vs. available, per mission),
  (c) Carta especial status this month ("Desbloqueado" or "Completa 1 misión más para
  desbloquear"). All fetched server-side, same cookie-aware pattern already used on this page.
- **Space page / `SpaceDetailPanel`**: if `space.special_menu_enabled`, show a "Carta especial"
  block — the content if the current user is unlocked this month, otherwise a locked teaser
  pointing at `/perfil` to see mission progress.

## 4. Testing

- Unit tests for `lib/data/rewards.ts` and `lib/data/missions.ts` (mocked Supabase client,
  following the existing pattern used for `lib/data/reviews.ts`).
- Manual verification in dev (documented in the implementation plan): write a review → confirm
  `reward_events` gets a `full_review` row and, if it's the user's first review ever, a
  `mission_first_review` row too; edit that same review → confirm no new rows; favorite 3
  distinct spaces → confirm `mission_favorite_three` fires exactly once; un-favorite and
  re-favorite the same space repeatedly → confirm it does **not** re-trigger the mission.

## 5. Migration safety

- All new tables default to empty; existing users start with a Rewards balance of 0 and no
  mission progress — nothing retroactively awarded for reviews/favorites created before this
  migration ships (the triggers only fire on new inserts going forward). This is called out
  explicitly since a user who already wrote a review pre-migration will not receive backfilled
  Rewards for it — acceptable for a v1 launch, not silently "wrong."
- `spaces.special_menu_enabled` defaults to `false` — no space silently gains a special menu.
- Single migration file, `supabase/migrations/0011_rewards.sql`, applied the same way as prior
  migrations (pasted into the Supabase SQL Editor).
