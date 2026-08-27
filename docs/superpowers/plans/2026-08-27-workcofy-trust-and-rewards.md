# Workcofy Trust & Rewards Layer (Fase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Workcofy's discovery experience around three visible concepts —
Workcofy, Workcofy Verified, Workcofy Coins — with a real computed Workcofy
Score, restructured amenities, a Verified badge, and database-driven (not
hardcoded) Coins info content. No user authentication is introduced in this
phase.

**Architecture:** Additive Postgres migration on the existing `spaces` table
plus three new tables (`space_benefits`, `coin_rules`, `coin_redemptions`).
Pure, unit-tested functions in `lib/` compute the score and shape amenity
data; presentational components in `components/` consume them with no
dedicated component tests, matching this codebase's existing convention
(zero `.test.tsx` files exist today — only pure-logic `.test.ts` files do).
Server-rendered pages fetch via `lib/data/*.ts`, following the exact pattern
already used by `lib/data/spaces.ts`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase/
Postgres, Vitest + `@testing-library/react` (jsdom).

**Spec:** `docs/superpowers/specs/2026-08-26-workcofy-trust-and-rewards-design.md`

## Global Constraints

- Never fabricate data. Every unknown amenity leaf is `null` and renders as
  "Información no disponible" — never inferred, never defaulted to `false`.
- Google Places (classic or New) has no wifi/outlet/noise-level/quiet-zone
  field for any place type. Seed scripts must not claim to derive
  `amenities` from Google — the column starts and stays at its default
  (`'{}'::jsonb`, which every group/leaf helper treats as "all unknown")
  until manual or Fase-B community data fills it in.
- `Workcofy Score` and `Workcofy Verified` are independent signals — Verified
  status must never feed into the Score formula.
- Exactly three user-visible product concepts: Workcofy, Workcofy Verified,
  Workcofy Coins. No new visible concept names.
- This project is **not** linked via the Supabase CLI (confirmed:
  `supabase projects list` doesn't show it). Every migration file is applied
  by pasting it into the Supabase SQL Editor by hand — the same process
  already used for `0001_create_spaces.sql` and `0002_expansion_geo.sql`.
- Yellow accent hex is exactly `#F4B942`, added as `workcofy.yellow` in
  `tailwind.config.ts` alongside the existing `workcofy.black` /
  `workcofy.gray`.
- Test runner: `npm run test` (Vitest). Run the single new/changed test file
  with `npx vitest run <path>` after each step that asks you to "run the
  test."

---

### Task 1: Schema migration — trust layer tables & columns

**Files:**
- Create: `supabase/migrations/0003_trust_layer.sql`

**Interfaces:**
- Produces: columns `spaces.amenities jsonb`, `spaces.verified boolean`,
  `spaces.verified_at timestamptz`, `spaces.verified_amenities text[]`,
  `spaces.instagram_url text`; tables `space_benefits`, `coin_rules`,
  `coin_redemptions`. Every later task that touches Supabase depends on this
  migration having been applied to the live project.

This task has no automated test (it's SQL applied by hand), so instead of a
red/green test cycle, verify it by running the confirmation query in Step 3
against the Supabase SQL Editor and checking the output matches.

- [ ] **Step 1: Write the migration file**

```sql
-- Trust & Rewards layer (Fase A): Workcofy Score inputs, Workcofy Verified,
-- Coins info tables. See docs/superpowers/specs/2026-08-26-workcofy-trust-and-rewards-design.md.

-- The 9 flat boolean amenity columns from 0001 are replaced by a single
-- structured `amenities` jsonb column (see below) — confirmed via grep that
-- none of them are read by any component or page, only by
-- lib/data/spaceTypes.ts and one test fixture, both updated in Task 3.
alter table spaces drop column if exists wifi_available;
alter table spaces drop column if exists power_outlets;
alter table spaces drop column if exists laptop_friendly;
alter table spaces drop column if exists meeting_friendly;
alter table spaces drop column if exists workshop_friendly;
alter table spaces drop column if exists event_friendly;
alter table spaces drop column if exists private_rooms;
alter table spaces drop column if exists outdoor_seating;
alter table spaces drop column if exists parking;

-- Every leaf is true | false | null. null means "Información no disponible"
-- and must never be treated as false. Nothing populates this from Google —
-- see Global Constraints above — it starts empty and is filled in by hand
-- or by Fase B community data.
alter table spaces add column if not exists amenities jsonb not null default '{}'::jsonb;

-- Workcofy Verified: independent from `partner_status` (commercial
-- affiliation, stays internal/never rendered). Set by hand via Supabase
-- Table Editor for now — no admin panel in this phase.
alter table spaces add column if not exists verified boolean not null default false;
alter table spaces add column if not exists verified_at timestamptz;
alter table spaces add column if not exists verified_amenities text[] not null default '{}';

-- Public-facing Instagram link. Not available from any API this project
-- calls (Google Places doesn't expose it either) — always manual entry.
alter table spaces add column if not exists instagram_url text;

create table if not exists space_benefits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  label text not null,
  icon text,
  sort_order int not null default 0
);

alter table space_benefits enable row level security;

create policy "Public can read benefits of active spaces"
  on space_benefits for select
  to anon
  using (exists (
    select 1 from spaces where spaces.id = space_benefits.space_id and spaces.active = true
  ));

create table if not exists coin_rules (
  id uuid primary key default gen_random_uuid(),
  action text not null unique,
  label text not null,
  coins int not null,
  sort_order int not null default 0,
  active boolean not null default true
);

alter table coin_rules enable row level security;

create policy "Public can read active coin rules"
  on coin_rules for select
  to anon
  using (active = true);

-- Seed rows — configurable from the DB per the user's requirement, not
-- hardcoded in any component. No check-in row: the user explicitly decided
-- check-ins are not needed.
insert into coin_rules (action, label, coins, sort_order) values
  ('rate_space', 'Evaluar un espacio', 5, 1),
  ('rate_amenities', 'Evaluar amenities', 5, 2),
  ('upload_photo', 'Subir una foto útil', 10, 3),
  ('full_review', 'Reseña completa', 20, 4)
on conflict (action) do nothing;

create table if not exists coin_redemptions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  coins_required int not null,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true
);

alter table coin_redemptions enable row level security;

create policy "Public can read active coin redemptions"
  on coin_redemptions for select
  to anon
  using (active = true);

insert into coin_redemptions (label, coins_required, icon, sort_order) values
  ('Café / beneficio', 500, '☕', 1),
  ('Horas de trabajo', 1000, '💻', 2),
  ('Experiencia Workcofy', 2500, '🧑‍💻', 3)
on conflict (label) do nothing;
```

- [ ] **Step 2: Apply it**

Paste the full file content into the Supabase SQL Editor for this project
and run it.

- [ ] **Step 3: Verify**

Run this in the same SQL Editor and confirm it returns 4 rows for
`coin_rules` and 3 for `coin_redemptions`, and that `spaces` has the new
columns with zero rows unexpectedly non-default:

```sql
select
  (select count(*) from coin_rules) as coin_rules_count,
  (select count(*) from coin_redemptions) as coin_redemptions_count,
  (select count(*) from spaces where amenities <> '{}'::jsonb) as spaces_with_amenities,
  (select count(*) from spaces where verified = true) as verified_spaces;
```

Expected: `coin_rules_count = 4`, `coin_redemptions_count = 3`,
`spaces_with_amenities = 0`, `verified_spaces = 0`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_trust_layer.sql
git commit -m "feat: add trust layer migration (amenities, verified, coins tables)"
```

---

### Task 2: Amenities data module

**Files:**
- Create: `lib/amenities/types.ts`
- Test: `lib/amenities/types.test.ts`

**Interfaces:**
- Produces: `AmenitiesData`, `DEFAULT_AMENITIES`, `AMENITY_LABELS`,
  `AMENITY_GROUP_LABELS`, `averageKnownAmenities(group): number | null` —
  consumed by Task 4 (score), Task 7 (amenities section component).

- [ ] **Step 1: Write the failing test**

```ts
// lib/amenities/types.test.ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, averageKnownAmenities } from './types'

describe('DEFAULT_AMENITIES', () => {
  it('has all three groups with every leaf null', () => {
    expect(DEFAULT_AMENITIES.para_trabajar).toEqual({
      wifi: null, enchufes: null, mesas_comodas: null, iluminacion: null,
    })
    expect(DEFAULT_AMENITIES.para_llamadas).toEqual({
      videollamadas: null, zona_tranquila: null, booth: null,
    })
    expect(DEFAULT_AMENITIES.servicios).toEqual({
      cafe: null, agua: null, banos: null, impresiones: null, pizarra: null, sala_reuniones: null,
    })
  })
})

describe('averageKnownAmenities', () => {
  it('returns null when every leaf is unknown', () => {
    expect(averageKnownAmenities({ a: null, b: null })).toBeNull()
  })

  it('ignores null leaves and averages only known ones', () => {
    expect(averageKnownAmenities({ a: true, b: null, c: false })).toBe(50)
  })

  it('returns 100 when every known leaf is true', () => {
    expect(averageKnownAmenities({ a: true, b: true })).toBe(100)
  })

  it('returns 0 when every known leaf is false', () => {
    expect(averageKnownAmenities({ a: false, b: false })).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/amenities/types.test.ts`
Expected: FAIL — `./types` has no exported member `DEFAULT_AMENITIES` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/amenities/types.ts
export interface ParaTrabajarAmenities {
  wifi: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  impresiones: boolean | null
  pizarra: boolean | null
  sala_reuniones: boolean | null
}

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
}

export const DEFAULT_AMENITIES: AmenitiesData = {
  para_trabajar: { wifi: null, enchufes: null, mesas_comodas: null, iluminacion: null },
  para_llamadas: { videollamadas: null, zona_tranquila: null, booth: null },
  servicios: {
    cafe: null, agua: null, banos: null, impresiones: null, pizarra: null, sala_reuniones: null,
  },
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  enchufes: 'Enchufes',
  mesas_comodas: 'Mesas cómodas',
  iluminacion: 'Buena iluminación',
  videollamadas: 'Videollamadas',
  zona_tranquila: 'Zona tranquila',
  booth: 'Booth / espacio privado',
  cafe: 'Café',
  agua: 'Agua',
  banos: 'Baños',
  impresiones: 'Impresiones',
  pizarra: 'Pizarra',
  sala_reuniones: 'Sala de reuniones',
}

export const AMENITY_GROUP_LABELS: Record<keyof AmenitiesData, string> = {
  para_trabajar: 'Para trabajar',
  para_llamadas: 'Para llamadas',
  servicios: 'Servicios',
}

export function averageKnownAmenities(group: Record<string, boolean | null>): number | null {
  const known = Object.values(group).filter((value): value is boolean => value !== null)
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/amenities/types.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/amenities/types.ts lib/amenities/types.test.ts
git commit -m "feat: add amenities data module with grouped taxonomy"
```

---

### Task 3: Update `SpaceRecord` for the trust layer

**Files:**
- Modify: `lib/data/spaceTypes.ts`
- Modify: `lib/filters/sortSpaces.test.ts`

**Interfaces:**
- Consumes: `AmenitiesData`, `DEFAULT_AMENITIES` from Task 2.
- Produces: `SpaceRecord` gains `amenities: AmenitiesData`, `verified: boolean`,
  `verified_at: string | null`, `verified_amenities: string[]`,
  `instagram_url: string | null`; loses the 9 boolean amenity fields. Every
  later task that constructs or reads a `SpaceRecord` uses this shape.

- [ ] **Step 1: Update the type**

In `lib/data/spaceTypes.ts`, replace the 9 boolean amenity fields
(`wifi_available` through `parking`) with the new fields, and import
`AmenitiesData`:

```ts
import type { OpeningHours } from '@/lib/hours/openingHours'
import type { AmenitiesData } from '@/lib/amenities/types'

export interface SpacePhoto {
  photo_reference?: string
  url?: string
  width: number
  height: number
}

export interface SpaceRecord {
  id: string
  name: string
  slug: string
  category: string
  district: string
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  google_maps_url: string | null
  phone: string | null
  website: string | null
  instagram_url: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  photos: SpacePhoto[] | null
  description: string | null
  amenities: AmenitiesData
  noise_level: string | null
  seating_capacity: number | null
  recommended_stay_minutes: number | null
  workcofy_score: number | null
  workcofy_notes: string | null
  verified: boolean
  verified_at: string | null
  verified_amenities: string[]
  partner_status: string
  /** Provenance of this row: fabricated dev fixtures vs. real Google Places data. */
  data_source: 'mock' | 'google'
  active: boolean
}

export type SpaceWithDistance = SpaceRecord & { distanceKm: number | null }
```

- [ ] **Step 2: Fix the now-broken test fixture**

In `lib/filters/sortSpaces.test.ts`, update `makeSpace()`:

```ts
import { describe, expect, it } from 'vitest'
import { sortSpaces } from './sortSpaces'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceWithDistance>): SpaceWithDistance {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: null,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true,
    distanceKm: null,
    ...overrides,
  }
}

// ... rest of file unchanged
```

Keep the four existing `describe`/`it` blocks exactly as they are — only
`makeSpace()` changes.

- [ ] **Step 3: Run the test suite to verify it still passes**

Run: `npx vitest run lib/filters/sortSpaces.test.ts`
Expected: PASS (4 tests, unchanged behavior)

- [ ] **Step 4: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors. (This will surface any other file still constructing a
`SpaceRecord` with the old boolean fields — there should be none; `lib/data/spaces.ts`
reads rows via `as SpaceRecord` and doesn't construct fixtures.)

- [ ] **Step 5: Commit**

```bash
git add lib/data/spaceTypes.ts lib/filters/sortSpaces.test.ts
git commit -m "refactor: replace flat amenity booleans with amenities/verified fields on SpaceRecord"
```

---

### Task 4: Workcofy Score algorithm

**Files:**
- Create: `lib/score/workcofyScore.ts`
- Test: `lib/score/workcofyScore.test.ts`

**Interfaces:**
- Consumes: `SpaceRecord` (Task 3), `DEFAULT_AMENITIES` (Task 2).
- Produces: `computeWorkcofyScore(space: SpaceRecord): number | null` —
  consumed by Task 5 (`WorkcofyScoreBadge`), Task 10 (`SpaceCard`), Task 11
  (`selectFeaturedSpaces`).

- [ ] **Step 1: Write the failing tests**

```ts
// lib/score/workcofyScore.test.ts
import { describe, expect, it } from 'vitest'
import { computeWorkcofyScore } from './workcofyScore'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceRecord>): SpaceRecord {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: null,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true,
    ...overrides,
  }
}

describe('computeWorkcofyScore', () => {
  it('returns null when there is no rating and no known amenity', () => {
    expect(computeWorkcofyScore(makeSpace({}))).toBeNull()
  })

  it('uses the manual override when workcofy_score is set, ignoring everything else', () => {
    const space = makeSpace({ rating: 1, review_count: 1, workcofy_score: 77 })
    expect(computeWorkcofyScore(space)).toBe(77)
  })

  it('scores from rating alone at full weight when no amenity is known (the common case at launch)', () => {
    const space = makeSpace({ rating: 4.6, review_count: 300 })
    const score = computeWorkcofyScore(space)
    expect(score).not.toBeNull()
    // 4.6/5 * 100 = 92, high confidence at 300 reviews, so it should land close to 92, not near 60.
    expect(score as number).toBeGreaterThan(85)
  })

  it('discounts a high rating with very few reviews toward the midpoint', () => {
    const fewReviews = makeSpace({ rating: 5, review_count: 1 })
    const manyReviews = makeSpace({ rating: 5, review_count: 300 })
    const scoreFew = computeWorkcofyScore(fewReviews) as number
    const scoreMany = computeWorkcofyScore(manyReviews) as number
    expect(scoreFew).toBeLessThan(scoreMany)
  })

  it('scores from amenities alone when there is no rating', () => {
    const space = makeSpace({
      amenities: { ...DEFAULT_AMENITIES, para_trabajar: { wifi: true, enchufes: true, mesas_comodas: null, iluminacion: null } },
    })
    expect(computeWorkcofyScore(space)).toBe(100)
  })

  it('blends both components when both are known', () => {
    const ratingOnly = makeSpace({ rating: 4.6, review_count: 300 })
    const both = makeSpace({
      rating: 4.6, review_count: 300,
      amenities: { ...DEFAULT_AMENITIES, para_trabajar: { wifi: false, enchufes: false, mesas_comodas: false, iluminacion: false } },
    })
    const scoreRatingOnly = computeWorkcofyScore(ratingOnly) as number
    const scoreBoth = computeWorkcofyScore(both) as number
    // All amenities false pulls the blended score down from the rating-only score.
    expect(scoreBoth).toBeLessThan(scoreRatingOnly)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/score/workcofyScore.test.ts`
Expected: FAIL — module `./workcofyScore` doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
// lib/score/workcofyScore.ts
import type { SpaceRecord } from '@/lib/data/spaceTypes'

const RATING_WEIGHT = 60
const AMENITIES_WEIGHT = 40
// review_count at which confidence effectively saturates to 1
const CONFIDENCE_REVIEW_BASELINE = 50

function ratingComponent(rating: number, reviewCount: number): number {
  const normalized = (rating / 5) * 100
  const confidence = Math.min(
    1,
    Math.log10(reviewCount + 1) / Math.log10(CONFIDENCE_REVIEW_BASELINE)
  )
  // Below full confidence, pull toward the neutral midpoint (50) rather than
  // discarding the rating — a single 5-star review shouldn't read as a flat 100.
  return normalized * confidence + 50 * (1 - confidence)
}

function amenitiesComponent(space: SpaceRecord): number | null {
  const known = Object.values(space.amenities.para_trabajar).filter(
    (value): value is boolean => value !== null
  )
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}

export function computeWorkcofyScore(space: SpaceRecord): number | null {
  if (space.workcofy_score != null) return space.workcofy_score

  const rating = space.rating != null ? ratingComponent(space.rating, space.review_count ?? 0) : null
  const amenities = amenitiesComponent(space)

  if (rating == null && amenities == null) return null
  if (rating == null) return Math.round(amenities as number)
  if (amenities == null) return Math.round(rating)

  return Math.round(rating * (RATING_WEIGHT / 100) + amenities * (AMENITIES_WEIGHT / 100))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/score/workcofyScore.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/score/workcofyScore.ts lib/score/workcofyScore.test.ts
git commit -m "feat: compute Workcofy Score from rating confidence and known amenities"
```

---

### Task 5: Yellow accent token + real `WorkcofyScoreBadge`

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `components/space/WorkcofyScoreBadge.tsx`
- Modify: `app/spaces/[slug]/page.tsx:66` (its one call site, updated ahead of the full page rebuild in Task 9 so the project keeps building)

**Interfaces:**
- Consumes: `computeWorkcofyScore` (Task 4).
- Produces: `WorkcofyScoreBadge` now takes `{ space: SpaceRecord }` instead of
  `{ score: number | null }` — Task 9 relies on this new prop shape.

- [ ] **Step 1: Add the yellow token**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        workcofy: { black: '#0a0a0a', gray: '#6b7280', yellow: '#F4B942' },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Rewrite the badge to compute a real score**

```tsx
// components/space/WorkcofyScoreBadge.tsx
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface WorkcofyScoreBadgeProps {
  space: SpaceRecord
}

export function WorkcofyScoreBadge({ space }: WorkcofyScoreBadgeProps) {
  const score = computeWorkcofyScore(space)

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <h2 className="text-sm font-semibold tracking-tight">Workcofy Score</h2>
      {score != null ? (
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {score}
          <span className="text-lg font-semibold text-workcofy-yellow">/100</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Workcofy Score próximamente</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update the one call site**

In `app/spaces/[slug]/page.tsx`, change:

```tsx
<WorkcofyScoreBadge score={space.workcofy_score} />
```

to:

```tsx
<WorkcofyScoreBadge space={space} />
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts components/space/WorkcofyScoreBadge.tsx app/spaces/[slug]/page.tsx
git commit -m "feat: add yellow accent token and wire WorkcofyScoreBadge to the real score"
```

---

### Task 6: Category options — add Hoteles, relabel Salas de reunión

**Files:**
- Modify: `lib/categories.ts`
- Test: `lib/categories.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/categories.test.ts
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS } from './categories'

describe('CATEGORY_OPTIONS', () => {
  it('includes an inactive hotel option labeled Hoteles', () => {
    const hotel = CATEGORY_OPTIONS.find((option) => option.value === 'hotel')
    expect(hotel).toEqual({ value: 'hotel', label: 'Hoteles', active: false })
  })

  it('labels meeting_room as Salas de reunión', () => {
    const meetingRoom = CATEGORY_OPTIONS.find((option) => option.value === 'meeting_room')
    expect(meetingRoom?.label).toBe('Salas de reunión')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/categories.test.ts`
Expected: FAIL — no `hotel` entry found (`undefined`).

- [ ] **Step 3: Update the options**

```ts
// lib/categories.ts
export type CategoryValue =
  | 'cafe'
  | 'work_cafe'
  | 'coworking'
  | 'meeting_room'
  | 'hotel'
  | 'workshop'
  | 'event'
  | 'corporate'

export interface CategoryOption {
  value: CategoryValue
  label: string
  active: boolean
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'cafe', label: 'Cafés', active: true },
  { value: 'work_cafe', label: 'Work Cafés', active: true },
  { value: 'coworking', label: 'Coworking', active: false },
  { value: 'meeting_room', label: 'Salas de reunión', active: false },
  { value: 'hotel', label: 'Hoteles', active: false },
  { value: 'workshop', label: 'Workshops', active: false },
  { value: 'event', label: 'Eventos', active: false },
]

export const ACTIVE_CATEGORY_VALUES: CategoryValue[] = CATEGORY_OPTIONS.filter(
  (c) => c.active
).map((c) => c.value)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/categories.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/categories.ts lib/categories.test.ts
git commit -m "feat: add Hoteles category option and relabel Salas de reunión"
```

---

### Task 7: `VerifiedBadge` and `AmenitiesSection` components

**Files:**
- Create: `lib/amenities/groupedAmenityEntries.ts`
- Test: `lib/amenities/groupedAmenityEntries.test.ts`
- Create: `components/space/VerifiedBadge.tsx`
- Create: `components/space/AmenitiesSection.tsx`

**Interfaces:**
- Consumes: `AmenitiesData`, `AMENITY_LABELS`, `AMENITY_GROUP_LABELS` (Task 2).
- Produces: `groupedAmenityEntries(amenities): AmenityGroupEntries[]`,
  `<VerifiedBadge />`, `<AmenitiesSection amenities={AmenitiesData} />` —
  consumed by Task 9 (space detail page) and Task 10 (`SpaceCard`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/amenities/groupedAmenityEntries.test.ts
import { describe, expect, it } from 'vitest'
import { groupedAmenityEntries } from './groupedAmenityEntries'
import { DEFAULT_AMENITIES } from './types'

describe('groupedAmenityEntries', () => {
  it('produces one entry group per amenity group, in schema order', () => {
    const groups = groupedAmenityEntries(DEFAULT_AMENITIES)
    expect(groups.map((g) => g.groupKey)).toEqual(['para_trabajar', 'para_llamadas', 'servicios'])
  })

  it('labels each group and each entry', () => {
    const groups = groupedAmenityEntries(DEFAULT_AMENITIES)
    expect(groups[0].groupLabel).toBe('Para trabajar')
    expect(groups[0].entries).toContainEqual({ key: 'wifi', label: 'WiFi', value: null })
  })

  it('carries through known values unchanged', () => {
    const amenities = {
      ...DEFAULT_AMENITIES,
      para_trabajar: { ...DEFAULT_AMENITIES.para_trabajar, wifi: true },
    }
    const groups = groupedAmenityEntries(amenities)
    expect(groups[0].entries).toContainEqual({ key: 'wifi', label: 'WiFi', value: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/amenities/groupedAmenityEntries.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
// lib/amenities/groupedAmenityEntries.ts
import { AMENITY_GROUP_LABELS, AMENITY_LABELS, type AmenitiesData } from './types'

export interface AmenityEntry {
  key: string
  label: string
  value: boolean | null
}

export interface AmenityGroupEntries {
  groupKey: keyof AmenitiesData
  groupLabel: string
  entries: AmenityEntry[]
}

export function groupedAmenityEntries(amenities: AmenitiesData): AmenityGroupEntries[] {
  return (Object.keys(amenities) as (keyof AmenitiesData)[]).map((groupKey) => ({
    groupKey,
    groupLabel: AMENITY_GROUP_LABELS[groupKey],
    entries: Object.entries(amenities[groupKey]).map(([key, value]) => ({
      key,
      label: AMENITY_LABELS[key] ?? key,
      value: value as boolean | null,
    })),
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/amenities/groupedAmenityEntries.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Write `VerifiedBadge`**

```tsx
// components/space/VerifiedBadge.tsx
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-workcofy-yellow/20 px-2.5 py-1 text-xs font-semibold text-workcofy-black">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Workcofy Verified
    </span>
  )
}
```

- [ ] **Step 6: Write `AmenitiesSection`**

```tsx
// components/space/AmenitiesSection.tsx
import { groupedAmenityEntries } from '@/lib/amenities/groupedAmenityEntries'
import type { AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const groups = groupedAmenityEntries(amenities)

  return (
    <div className="mt-4">
      {groups.map((group) => (
        <div key={group.groupKey} className="mt-5 first:mt-0">
          <h3 className="text-sm font-semibold tracking-tight">{group.groupLabel}</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {group.entries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2">
                {entry.value === true && <span className="text-workcofy-yellow">✓</span>}
                {entry.value === false && <span className="text-gray-300">✕</span>}
                {entry.value === null && <span className="text-gray-300">·</span>}
                <span className={entry.value === null ? 'text-gray-400' : ''}>
                  {entry.value === null ? `${entry.label} — Información no disponible` : entry.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/amenities/groupedAmenityEntries.ts lib/amenities/groupedAmenityEntries.test.ts components/space/VerifiedBadge.tsx components/space/AmenitiesSection.tsx
git commit -m "feat: add VerifiedBadge and grouped AmenitiesSection components"
```

---

### Task 8: Coins & Benefits data layer

**Files:**
- Create: `lib/data/coins.ts`
- Create: `lib/data/benefits.ts`

**Interfaces:**
- Produces: `listCoinRules(): Promise<CoinRule[]>`,
  `listCoinRedemptions(): Promise<CoinRedemption[]>`,
  `listSpaceBenefits(spaceId: string): Promise<SpaceBenefit[]>`,
  `anySpaceHasBenefits(): Promise<boolean>` — consumed by Task 9 (space
  detail page) and Task 12 (home Coins/Benefits sections).

No dedicated test: this follows the exact existing pattern in
`lib/data/spaces.ts`, which also has no test file (data-layer functions here
are thin Supabase query wrappers, not business logic).

- [ ] **Step 1: Write `lib/data/coins.ts`**

```ts
// lib/data/coins.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CoinRule {
  id: string
  action: string
  label: string
  coins: number
  sort_order: number
}

export interface CoinRedemption {
  id: string
  label: string
  coins_required: number
  icon: string | null
  sort_order: number
}

export async function listCoinRules(): Promise<CoinRule[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('coin_rules')
    .select('id, action, label, coins, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list coin rules: ${error.message}`)
  return data ?? []
}

export async function listCoinRedemptions(): Promise<CoinRedemption[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('coin_redemptions')
    .select('id, label, coins_required, icon, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list coin redemptions: ${error.message}`)
  return data ?? []
}
```

- [ ] **Step 2: Write `lib/data/benefits.ts`**

```ts
// lib/data/benefits.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface SpaceBenefit {
  id: string
  space_id: string
  label: string
  icon: string | null
  sort_order: number
}

export async function listSpaceBenefits(spaceId: string): Promise<SpaceBenefit[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('space_benefits')
    .select('id, space_id, label, icon, sort_order')
    .eq('space_id', spaceId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to list benefits for space ${spaceId}: ${error.message}`)
  return data ?? []
}

export async function anySpaceHasBenefits(): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  const { count, error } = await supabase
    .from('space_benefits')
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(`Failed to check for benefits: ${error.message}`)
  return (count ?? 0) > 0
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/data/coins.ts lib/data/benefits.ts
git commit -m "feat: add coins and benefits data-layer functions"
```

---

### Task 9: Rebuild the space detail page

**Files:**
- Modify: `app/spaces/[slug]/page.tsx`

**Interfaces:**
- Consumes: `WorkcofyScoreBadge` (Task 5), `VerifiedBadge`/`AmenitiesSection`
  (Task 7), `listSpaceBenefits` (Task 8), `AMENITY_LABELS` (Task 2).

Known gap, out of scope for this task: today's 30 Lima spaces store only a
Google `photo_reference` (no `url`), because the original
`scripts/seed-google-places.ts` never downloads photos — only the newer
Chile/Perú expansion script does. This page only renders photos that have a
resolved `url`, so Lima spaces show the gray placeholder until that script
is updated separately (not part of this plan).

- [ ] **Step 1: Rewrite the page**

```tsx
// app/spaces/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { listSpaceBenefits } from '@/lib/data/benefits'
import { districtLabel } from '@/lib/districts'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from '@/lib/hours/openingHours'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { WorkcofyScoreBadge } from '@/components/space/WorkcofyScoreBadge'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import { AmenitiesSection } from '@/components/space/AmenitiesSection'
import { AMENITY_LABELS } from '@/lib/amenities/types'

interface SpacePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: SpacePageProps) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) return {}
  const label = districtLabel(space.district)
  return {
    title: `${space.name} | Workcofy`,
    description: `Encuentra ubicación, horario, valoración y cómo llegar a ${space.name} en ${label}.`,
    openGraph: {
      title: `${space.name} | Workcofy`,
      description: `Encuentra ubicación, horario, valoración y cómo llegar a ${space.name} en ${label}.`,
    },
  }
}

export default async function SpacePage({ params }: SpacePageProps) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) notFound()

  const benefits = await listSpaceBenefits(space.id)
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayIndex = now.getDay()
  const renderablePhotos = (space.photos ?? []).filter(
    (photo): photo is typeof photo & { url: string } => Boolean(photo.url)
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
      {renderablePhotos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {renderablePhotos.map((photo, index) => (
            <img
              key={index}
              src={photo.url}
              alt={`${space.name} — foto ${index + 1}`}
              className="h-64 w-auto flex-none rounded-3xl object-cover shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:h-80"
            />
          ))}
        </div>
      ) : (
        <div className="h-64 w-full rounded-3xl bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:h-80" />
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{space.name}</h1>
        {space.verified && <VerifiedBadge />}
      </div>
      <p className="mt-1 text-gray-500">{districtLabel(space.district)}</p>
      {space.data_source === 'mock' && (
        <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          Datos de ejemplo
        </span>
      )}
      <div className="mt-3 flex items-center gap-3 text-sm">
        {space.rating != null && (
          <span>
            ★ {space.rating.toFixed(1)} ({space.review_count ?? 0} reseñas)
          </span>
        )}
        <span className={openNow ? 'font-semibold text-black' : 'text-gray-500'}>
          {openNow ? 'Abierto ahora' : 'Cerrado'}
        </span>
      </div>
      {space.address && <p className="mt-2 text-sm text-gray-600">{space.address}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        {space.phone && (
          <a href={`tel:${space.phone}`} className="hover:text-black">
            {space.phone}
          </a>
        )}
        {space.website && (
          <a href={space.website} target="_blank" rel="noreferrer" className="hover:text-black">
            Sitio web
          </a>
        )}
        {space.instagram_url && (
          <a href={space.instagram_url} target="_blank" rel="noreferrer" className="hover:text-black">
            Instagram
          </a>
        )}
      </div>

      <a
        href={buildDirectionsUrl(space)}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
      >
        Cómo llegar
      </a>

      <WorkcofyScoreBadge space={space} />

      {space.verified && space.verified_amenities.length > 0 && (
        <div className="mt-6 rounded-2xl border border-workcofy-yellow/40 bg-workcofy-yellow/10 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Workcofy comprobó este espacio</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {space.verified_amenities.map((key) => (
              <li key={key}>✓ {AMENITY_LABELS[key] ?? key}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-10 text-xl font-bold tracking-tight">Amenities</h2>
      <AmenitiesSection amenities={space.amenities} />

      {benefits.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold tracking-tight">Beneficios Workcofy</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {benefits.map((benefit) => (
              <li key={benefit.id} className="flex items-center gap-2">
                {benefit.icon && <span>{benefit.icon}</span>}
                {benefit.label}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-10 text-xl font-bold tracking-tight">Horario</h2>
      <ul className="mt-3 overflow-hidden rounded-2xl border border-gray-100 text-sm">
        {WEEK_DISPLAY_ORDER.map((dayIndex) => (
          <li
            key={dayIndex}
            className={`flex justify-between border-b border-gray-100 px-4 py-2.5 last:border-b-0 ${
              dayIndex === todayIndex ? 'bg-gray-50 font-semibold' : ''
            }`}
          >
            <span>
              {DAY_LABELS[dayIndex]}
              {dayIndex === todayIndex && ' · Hoy'}
            </span>
            <span>{formatPeriodForDay(space.opening_hours, dayIndex)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, open `/spaces/<any existing slug>`, confirm: page renders,
no console errors, Amenities section shows all groups as "Información no
disponible" (since `amenities` is `{}` for every existing row today), Score
shows a real number (Lima spaces have Google ratings) or "próximamente".

- [ ] **Step 4: Commit**

```bash
git add "app/spaces/[slug]/page.tsx"
git commit -m "feat: expand space detail page with amenities, verified checklist, benefits"
```

---

### Task 10: `SpaceCard` — Score, Verified badge, real photo

**Files:**
- Modify: `components/discovery/SpaceCard.tsx`

**Interfaces:**
- Consumes: `computeWorkcofyScore` (Task 4), `VerifiedBadge` (Task 7).

- [ ] **Step 1: Rewrite the card**

```tsx
// components/discovery/SpaceCard.tsx
import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow, formatPeriodForDay } from '@/lib/hours/openingHours'
import { districtLabel } from '@/lib/districts'
import { buildDirectionsUrl } from '@/lib/directions'
import { getLimaNow } from '@/lib/geo/limaTime'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { VerifiedBadge } from '@/components/space/VerifiedBadge'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceCardProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
  origin?: { lat: number; lng: number } | null
}

export function SpaceCard({ space, isSelected, onSelect, origin = null }: SpaceCardProps) {
  const now = getLimaNow()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayHours = formatPeriodForDay(space.opening_hours, now.getDay())
  const score = computeWorkcofyScore(space)
  const coverPhoto = space.photos?.find((photo) => photo.url)

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] ${
        isSelected ? 'border-black' : 'border-transparent'
      }`}
    >
      <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gray-100 transition-transform duration-200 group-hover:scale-[1.02]">
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto.url} alt={space.name} className="h-full w-full object-cover" />
        )}
        {space.verified && (
          <div className="absolute left-2 top-2">
            <VerifiedBadge />
          </div>
        )}
      </div>
      <h3 className="mt-3 font-semibold tracking-tight">{space.name}</h3>
      <p className="text-sm text-gray-500">{districtLabel(space.district)}</p>
      {space.data_source === 'mock' && (
        <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
          Datos de ejemplo
        </span>
      )}
      <div className="mt-1.5 flex items-center gap-2 text-sm">
        {space.rating != null && <span>★ {space.rating.toFixed(1)}</span>}
        {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
      </div>
      {score != null && (
        <p className="mt-1 text-xs font-semibold">
          Workcofy Score <span className="text-workcofy-yellow">{score}</span>
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">{openNow ? `Abierto · ${todayHours}` : 'Cerrado'}</p>
      <div className="mt-3.5 flex gap-2">
        <Link
          href={`/spaces/${space.slug}`}
          onClick={(event) => event.stopPropagation()}
          className="rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.97]"
        >
          Ver espacio
        </Link>
        <a
          href={buildDirectionsUrl(space, origin)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-black"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, open `/near-me` or `/`, confirm cards render with Score
line, no broken images (spaces with no `url` photo show the gray box, not a
broken `<img>`).

- [ ] **Step 4: Commit**

```bash
git add components/discovery/SpaceCard.tsx
git commit -m "feat: show Workcofy Score, Verified badge, and real photo on SpaceCard"
```

---

### Task 11: "Espacios destacados" — selection logic + component

**Files:**
- Create: `lib/discovery/selectFeaturedSpaces.ts`
- Test: `lib/discovery/selectFeaturedSpaces.test.ts`
- Create: `components/home/FeaturedSpaces.tsx`

**Interfaces:**
- Consumes: `computeWorkcofyScore` (Task 4), `SpaceCard` (Task 10).
- Produces: `selectFeaturedSpaces(spaces, limit?): SpaceRecord[]`,
  `<FeaturedSpaces spaces={SpaceRecord[]} />` — consumed by Task 13
  (`app/page.tsx`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/discovery/selectFeaturedSpaces.test.ts
import { describe, expect, it } from 'vitest'
import { selectFeaturedSpaces } from './selectFeaturedSpaces'
import { DEFAULT_AMENITIES } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceRecord>): SpaceRecord {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, instagram_url: null,
    rating: null, review_count: null, price_level: null, opening_hours: null,
    photos: null, description: null, amenities: DEFAULT_AMENITIES,
    noise_level: null, seating_capacity: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null,
    verified: false, verified_at: null, verified_amenities: [],
    partner_status: 'none', data_source: 'mock', active: true,
    ...overrides,
  }
}

describe('selectFeaturedSpaces', () => {
  it('orders by Workcofy Score descending', () => {
    const spaces = [
      makeSpace({ id: 'low', rating: 3.5, review_count: 100 }),
      makeSpace({ id: 'high', rating: 4.9, review_count: 100 }),
    ]
    expect(selectFeaturedSpaces(spaces).map((s) => s.id)).toEqual(['high', 'low'])
  })

  it('breaks ties by review_count descending', () => {
    const spaces = [
      makeSpace({ id: 'fewer', workcofy_score: 80, review_count: 10 }),
      makeSpace({ id: 'more', workcofy_score: 80, review_count: 500 }),
    ]
    expect(selectFeaturedSpaces(spaces).map((s) => s.id)).toEqual(['more', 'fewer'])
  })

  it('respects the limit', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: String(i), workcofy_score: i })
    )
    expect(selectFeaturedSpaces(spaces, 3)).toHaveLength(3)
  })

  it('defaults the limit to 6', () => {
    const spaces = Array.from({ length: 10 }, (_, i) =>
      makeSpace({ id: String(i), workcofy_score: i })
    )
    expect(selectFeaturedSpaces(spaces)).toHaveLength(6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/discovery/selectFeaturedSpaces.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
// lib/discovery/selectFeaturedSpaces.ts
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

export function selectFeaturedSpaces(spaces: SpaceRecord[], limit = 6): SpaceRecord[] {
  return [...spaces]
    .sort((a, b) => {
      const scoreA = computeWorkcofyScore(a) ?? -1
      const scoreB = computeWorkcofyScore(b) ?? -1
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.review_count ?? 0) - (a.review_count ?? 0)
    })
    .slice(0, limit)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/discovery/selectFeaturedSpaces.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the component**

```tsx
// components/home/FeaturedSpaces.tsx
import { selectFeaturedSpaces } from '@/lib/discovery/selectFeaturedSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

interface FeaturedSpacesProps {
  spaces: SpaceRecord[]
}

export function FeaturedSpaces({ spaces }: FeaturedSpacesProps) {
  const featured = selectFeaturedSpaces(spaces)
  if (featured.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h2 className="text-2xl font-bold tracking-tight">Espacios destacados para ti</h2>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {featured.map((space) => (
          <div key={space.id} className="w-64 flex-none">
            <SpaceCard
              space={{ ...space, distanceKm: null }}
              isSelected={false}
              onSelect={() => {}}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/discovery/selectFeaturedSpaces.ts lib/discovery/selectFeaturedSpaces.test.ts components/home/FeaturedSpaces.tsx
git commit -m "feat: add Espacios destacados carousel selected by Workcofy Score"
```

---

### Task 12: Verified explainer, Coins, and Benefits home sections

**Files:**
- Create: `components/home/VerifiedExplainer.tsx`
- Create: `components/home/CoinsSection.tsx`
- Create: `components/home/BenefitsTeaser.tsx`

**Interfaces:**
- Consumes: `CoinRule`, `CoinRedemption` types (Task 8).
- Produces: `<VerifiedExplainer />`, `<CoinsSection rules redemptions />`,
  `<BenefitsTeaser />` — consumed by Task 13 (`app/page.tsx`).

- [ ] **Step 1: Write `VerifiedExplainer`**

```tsx
// components/home/VerifiedExplainer.tsx
export function VerifiedExplainer() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 md:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-workcofy-yellow/20 px-3 py-1 text-xs font-semibold text-workcofy-black">
          ✓ Workcofy Verified
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
          Workcofy comprobó que estos espacios cumplen nuestros estándares mínimos para trabajar.
        </h2>
        <p className="mt-2 max-w-2xl text-gray-500">
          No todos los lugares del mapa están verificados — seguimos mostrando los espacios
          descubiertos y evaluados por la comunidad. El sello Verified indica, además, que
          Workcofy visitó el lugar y confirmó puntos concretos como wifi, enchufes o zona
          tranquila.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Write `CoinsSection`**

```tsx
// components/home/CoinsSection.tsx
import type { CoinRule, CoinRedemption } from '@/lib/data/coins'

interface CoinsSectionProps {
  rules: CoinRule[]
  redemptions: CoinRedemption[]
}

export function CoinsSection({ rules, redemptions }: CoinsSectionProps) {
  if (rules.length === 0 && redemptions.length === 0) return null

  return (
    <section id="coins" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 md:px-8">
      <h2 className="text-2xl font-bold tracking-tight">🪙 Workcofy Coins</h2>
      <p className="mt-1 max-w-xl text-gray-500">
        Ganás Coins por ayudar a construir la información de Workcofy.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {rules.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-500">Cómo funciona</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>{rule.label}</span>
                  <span className="font-semibold">+{rule.coins} Coins</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {redemptions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-500">Usa tus Coins</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>
                    {redemption.icon} {redemption.label}
                  </span>
                  <span className="font-semibold">{redemption.coins_required} Coins</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write `BenefitsTeaser`**

```tsx
// components/home/BenefitsTeaser.tsx
export function BenefitsTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-3xl bg-black px-8 py-10 text-white md:px-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Beneficios Workcofy</h2>
        <p className="mt-2 max-w-xl text-gray-300">
          Algunos espacios ofrecen beneficios exclusivos para la comunidad Workcofy — café de
          cortesía, impresiones, uso de booth y más. Los vas a ver directamente en la ficha de
          cada espacio que los tenga.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/home/VerifiedExplainer.tsx components/home/CoinsSection.tsx components/home/BenefitsTeaser.tsx
git commit -m "feat: add Verified explainer, Coins, and Benefits home sections"
```

---

### Task 13: Wire the new sections into the home page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `FeaturedSpaces` (Task 11), `VerifiedExplainer`/`CoinsSection`/
  `BenefitsTeaser` (Task 12), `listCoinRules`/`listCoinRedemptions` (Task 8),
  `anySpaceHasBenefits` (Task 8).

- [ ] **Step 1: Rewrite the page**

```tsx
// app/page.tsx
import { listSpaces } from '@/lib/data/spaces'
import { listCoinRules, listCoinRedemptions } from '@/lib/data/coins'
import { anySpaceHasBenefits } from '@/lib/data/benefits'
import { Hero } from '@/components/home/Hero'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'
import { FeaturedSpaces } from '@/components/home/FeaturedSpaces'
import { VerifiedExplainer } from '@/components/home/VerifiedExplainer'
import { CoinsSection } from '@/components/home/CoinsSection'
import { BenefitsTeaser } from '@/components/home/BenefitsTeaser'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: { q?: string; district?: string; category?: string; sort?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [spaces, coinRules, coinRedemptions, hasBenefits] = await Promise.all([
    listSpaces({
      search: searchParams.q,
      district: searchParams.district,
      category: searchParams.category,
    }),
    listCoinRules(),
    listCoinRedemptions(),
    anySpaceHasBenefits(),
  ])

  return (
    <div>
      <Hero />
      <DiscoveryView spaces={spaces} />
      <FeaturedSpaces spaces={spaces} />
      <VerifiedExplainer />
      <CoinsSection rules={coinRules} redemptions={coinRedemptions} />
      {hasBenefits && <BenefitsTeaser />}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, open `/`, confirm the page renders top to bottom: Hero →
map+list → Espacios destacados → Verified explainer → Workcofy Coins (4
rules + 3 redemptions from the DB) → no Benefits section (since
`space_benefits` is empty right after Task 1's migration).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble home page with featured spaces, Verified, and Coins sections"
```

---

### Task 14: Header — Workcofy Coins nav link

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Add the link to both nav blocks**

In the desktop `<nav>` (after the "Distritos" `Link`, before it closes):

```tsx
<Link href="/#coins" className="transition-colors hover:text-black">
  Workcofy Coins
</Link>
```

In the mobile `<nav>` (after the "Distritos" `Link`, same pattern as its
siblings):

```tsx
<Link
  href="/#coins"
  onClick={() => setMobileMenuOpen(false)}
  className="rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
>
  Workcofy Coins
</Link>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, confirm "Workcofy Coins" appears in both the desktop nav
and the mobile menu, and clicking it scrolls to the Coins section on `/`
(the `scroll-mt-20` on `#coins` keeps it clear of the sticky header).

- [ ] **Step 4: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat: add Workcofy Coins link to header navigation"
```

---

### Task 15: Hero — heavier type scale and yellow accent

**Files:**
- Modify: `components/home/Hero.tsx`

**Interfaces:**
- Consumes: `workcofy.yellow` Tailwind token (Task 5 — do this task after
  Task 5, otherwise `text-workcofy-yellow` resolves to nothing).

No test: this is a pure JSX/class change to existing static markup, same as
the rest of `components/home/`, which has no test files today.

- [ ] **Step 1: Update the headline weight and accent**

```tsx
// components/home/Hero.tsx
import Link from 'next/link'
import { SearchBox } from '@/components/home/SearchBox'

export function Hero() {
  return (
    <section className="px-4 py-16 text-center md:px-8 md:py-24">
      <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
        Encuentra tu mejor lugar para <span className="text-workcofy-yellow">trabajar</span>.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 md:text-lg">
        Espacios descubiertos, evaluados y verificados por nuestra comunidad.
      </p>
      <div className="mx-auto mt-8 max-w-xl">
        <SearchBox />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
        <Link
          href="/miraflores"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          Miraflores
        </Link>
        <Link
          href="/san-isidro"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          San Isidro
        </Link>
        <Link
          href="/barranco"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          Barranco
        </Link>
      </div>
    </section>
  )
}
```

This also updates the headline and subtitle copy to match the spec's
Section 3 wording ("Encuentra tu mejor lugar para trabajar." /
"Espacios descubiertos, evaluados y verificados por nuestra comunidad.") —
the district chips and search box are unchanged.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, open `/`, confirm the headline reads at the heavier
weight/size with "trabajar" in yellow, and the rest of the hero (search,
chips) is unchanged.

- [ ] **Step 4: Commit**

```bash
git add components/home/Hero.tsx
git commit -m "feat: restyle hero headline with heavier weight and yellow accent"
```

**Note on `DiscoveryView`/`FiltersBar`:** the spec called for a "restyle
visual" on the map+list block, but its existing black/white/rounded chip
styling already matches this design's direction (black = primary, yellow =
sparse accent, never a large fill) — there's no concrete change to make on
that front without inventing an unrequested redesign. Task 16 below does
touch `DiscoveryView.tsx`, but for an unrelated reason (a new interaction,
not a visual restyle).

---

### Task 16: Floating space card on marker selection

**Files:**
- Modify: `components/discovery/DiscoveryView.tsx`

**Interfaces:**
- Consumes: `SpaceCard` (Task 10) — reused as-is, no new component. `SpaceCard`
  already renders `Abierto · <today's hours range>` or `Cerrado` (see
  `lib/hours/openingHours.ts`'s `formatPeriodForDay`), so the closing time
  this task's user request asked for ("indicar si está abierto... y en
  cuánto cierran") is already produced by existing code — this task is
  purely about *where* that card appears, not new data.

Added mid-plan at the user's request, after seeing the reference screenshot
again: when a map marker is selected, its `SpaceCard` should float over the
map (like the reference's "Kaldis Specialty Coffee" card), not only
highlight in the side list as it does today.

**Scope decision:** anchoring the card to the marker's exact on-screen pixel
position would require adapter-specific positioning code for both
`GoogleMapAdapter` (Google Maps `OverlayView`) and `MockMapAdapter`
(MapLibre marker DOM tracking) — real work, and a second implementation to
keep in sync. Instead, the card floats at a fixed corner of the map panel
(bottom-right on desktop) whenever a space is selected, regardless of which
adapter is rendering. This delivers the same "click a pin, see its card
over the map" behavior the user asked for without doubling the positioning
logic. Desktop only (`md:` breakpoint) — on mobile the map is a short 45vh
strip directly above the full list, so a floating card there would cover
most of the map and duplicate the list item right below it.

No test: this is a presentational/layout change to an existing component,
consistent with the rest of `components/discovery/`, which has no test
files today (its logic lives in tested `lib/filters/*` modules instead).

- [ ] **Step 1: Add the floating card**

In `components/discovery/DiscoveryView.tsx`, the map sits in this wrapper
(existing code, near the top of the returned JSX):

```tsx
<div className="order-1 h-[45vh] md:order-2 md:h-full md:w-3/5">
  <MapView
    center={coordinate}
    zoom={14}
    markers={markers}
    selectedMarkerId={selectedId}
    onMarkerSelect={setSelectedId}
    userLocation={status === 'granted' ? coordinate : null}
  />
</div>
```

Change it to add a `relative` wrapper and the floating card, using the
already-computed `sorted` array to look up the selected space:

```tsx
<div className="relative order-1 h-[45vh] md:order-2 md:h-full md:w-3/5">
  <MapView
    center={coordinate}
    zoom={14}
    markers={markers}
    selectedMarkerId={selectedId}
    onMarkerSelect={setSelectedId}
    userLocation={status === 'granted' ? coordinate : null}
  />
  {selectedSpace && (
    <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-end p-4 md:flex">
      <div className="pointer-events-auto w-80">
        <SpaceCard
          space={selectedSpace}
          isSelected
          onSelect={() => {}}
          origin={status === 'granted' ? coordinate : null}
        />
      </div>
    </div>
  )}
</div>
```

Add the import and the lookup near the other `useMemo`s:

```tsx
import { SpaceCard } from '@/components/discovery/SpaceCard'
```

```tsx
const selectedSpace = sorted.find((space) => space.id === selectedId) ?? null
```

(`sorted` already exists in this file — it's the `useMemo` that calls
`sortSpaces(withDistance, filters.sort)`. Add the `selectedSpace` line right
after it.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify in the browser**

Run `npm run dev`, open `/` or `/near-me` on a desktop-width viewport, click
a marker on the map. Confirm: the corresponding `SpaceCard` appears floating
in the bottom-right of the map, showing the open/closed line with today's
hours; the same card in the side list is highlighted (existing behavior,
unchanged); clicking a different marker swaps the floating card; resizing
to a mobile width hides the floating card (list-only, as before).

- [ ] **Step 4: Commit**

```bash
git add components/discovery/DiscoveryView.tsx
git commit -m "feat: float selected space's card over the map on marker click"
```

## Post-plan checklist

- [ ] Run the full test suite once more: `npm run test` — expect all green.
- [ ] Run `npm run lint` — fix anything it flags before considering this done.
- [ ] Confirm Task 1's migration is applied to the live Supabase project
  (this plan cannot apply it for you — no linked Supabase CLI project).
