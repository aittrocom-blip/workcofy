# Workcofy Espacios Dashboard Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/near-me`'s current always-full-screen-map default with a list-first dashboard
(stats, recommendations, a searchable/filterable list, a small map panel), while keeping the existing
full-screen map experience fully intact behind a "Mapa" toggle.

**Architecture:** `app/near-me/page.tsx` branches on `?view=map` — that value renders the existing
`<DiscoveryView fullScreen>` completely unchanged; anything else renders a new
`<EspaciosDashboard>` client component built by composing already-shipped pieces
(`selectNearbyPopularSpaces`, `CompactSpaceRow`, `SpaceCard`, `MapView`, `sortSpaces`,
`CATEGORY_OPTIONS`) rather than rebuilding any of them. A small hook,
`useSpacesWithDistance`, is extracted from `DiscoveryView.tsx`'s existing inline distance
calculation so both components share it instead of duplicating it.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase (no schema change).

**Spec:** `docs/superpowers/specs/2026-09-02-workcofy-espacios-dashboard-shell-design.md`

## Global Constraints

- The existing full-screen map experience (`<DiscoveryView fullScreen>`) must render byte-for-byte
  identically to today, reached via `?view=map` — this plan reuses it, never rebuilds or restyles it.
- No new server queries beyond the single existing `listSpaces()` call — every stat, count,
  recommendation, search, and category filter in the new dashboard operates on that one already-fetched
  array, client-side.
- The "¿Tienes un espacio?" partner card stays permanently inert (`title="Próximamente"`, no link, no
  mailto) — the real Partners flow is a separate, not-yet-designed sub-project.
- "Tendencias esta semana" is not built at all in this plan — omit the widget entirely (needs
  check-in data that doesn't exist yet).
- `isAdmin` (for the "Agregar espacio" button) is read-only UI-decoration — it must never be treated
  as an access-control gate; `/admin/*` stays protected by `middleware.ts` independently of it.

---

### Task 1: Extract `useSpacesWithDistance` from `DiscoveryView`

**Files:**
- Create: `lib/hooks/useSpacesWithDistance.ts`
- Modify: `components/discovery/DiscoveryView.tsx`

**Interfaces:**
- Produces: `useSpacesWithDistance(spaces: SpaceRecord[]): SpaceWithDistance[]` — Task 2 imports and
  calls this from the new `EspaciosDashboard` component.
- Consumes: `useUserLocation` (`lib/geo/useUserLocation.ts`), `haversineDistanceKm`
  (`lib/geo/haversine.ts`) — both already exist, unchanged.

No automated test — this is a behavior-preserving extraction of existing, already-working logic;
verified by confirming `DiscoveryView`'s own behavior is unchanged (Step 4).

- [ ] **Step 1: Create the hook**

Create `lib/hooks/useSpacesWithDistance.ts`:

```ts
'use client'

import { useMemo } from 'react'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { haversineDistanceKm } from '@/lib/geo/haversine'
import type { SpaceRecord, SpaceWithDistance } from '@/lib/data/spaceTypes'

// Only a real, user-granted position yields a real distance. Before the user
// grants geolocation the location hook reports a city-center fallback, and
// measuring from it would present an invented distance as fact — so
// distanceKm stays null until status is 'granted'.
export function useSpacesWithDistance(spaces: SpaceRecord[]): SpaceWithDistance[] {
  const { coordinate, status } = useUserLocation()
  const hasRealLocation = status === 'granted'

  return useMemo(
    () =>
      spaces.map((space) => ({
        ...space,
        distanceKm:
          hasRealLocation && space.latitude != null && space.longitude != null
            ? haversineDistanceKm(coordinate, { lat: space.latitude, lng: space.longitude })
            : null,
      })),
    [spaces, coordinate, hasRealLocation]
  )
}
```

- [ ] **Step 2: Point `DiscoveryView.tsx` at the extracted hook**

In `components/discovery/DiscoveryView.tsx`:

Remove this import (no longer used directly in this file after the extraction):

```ts
import { haversineDistanceKm } from '@/lib/geo/haversine'
```

Add this import alongside the other `@/lib/...` imports:

```ts
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
```

Find this block:

```ts
  // Only a real, user-granted position yields a real distance. Before the user
  // grants geolocation `coordinate` is the Miraflores fallback, and measuring
  // from it would present an invented distance as fact — so distanceKm stays
  // null, matching how `userLocation` and `origin` are already gated below.
  const hasRealLocation = status === 'granted'

  // Always start at a city-wide scale (several districts visible), even once
  // a real position is known — the user explicitly asked to keep this wider
  // view as the starting point rather than auto-zooming in to ~500m; from
  // here they zoom in manually if they want to get closer.
  const mapZoom = 14

  const withDistance = useMemo(
    () =>
      spaces.map((space) => ({
        ...space,
        distanceKm:
          hasRealLocation && space.latitude != null && space.longitude != null
            ? haversineDistanceKm(coordinate, { lat: space.latitude, lng: space.longitude })
            : null,
      })),
    [spaces, coordinate, hasRealLocation]
  )
```

Replace it with:

```ts
  // Always start at a city-wide scale (several districts visible), even once
  // a real position is known — the user explicitly asked to keep this wider
  // view as the starting point rather than auto-zooming in to ~500m; from
  // here they zoom in manually if they want to get closer.
  const mapZoom = 14

  const withDistance = useSpacesWithDistance(spaces)
```

(`hasRealLocation` was only ever used inside that block — removing it along with the block is
correct, not a separate cleanup step.)

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean (confirms no other code in `DiscoveryView.tsx`
still referenced the now-removed `hasRealLocation` or `haversineDistanceKm` import).

- [ ] **Step 4: Manual verification**

Run `npm run dev`, visit `/near-me?view=map` (the existing full-screen experience — this route still
works exactly as `/near-me` did before this plan, since Task 2 hasn't changed the page's default yet).
Confirm: distances still show on space cards once you grant location, "Cerca de mí" sort still works,
nothing regressed.

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useSpacesWithDistance.ts components/discovery/DiscoveryView.tsx
git commit -m "refactor: extract useSpacesWithDistance hook from DiscoveryView"
```

---

### Task 2: Page routing (`?view=`), admin check, and the dashboard's header

**Files:**
- Create: `lib/admin/isCurrentUserAdmin.ts`
- Create: `components/discovery/EspaciosDashboard.tsx`
- Modify: `app/near-me/page.tsx`

**Interfaces:**
- Produces: `isCurrentUserAdmin(): Promise<boolean>` (used only here, in `app/near-me/page.tsx`).
  `EspaciosDashboard({ spaces, isAdmin })` — the component signature every later task in this plan
  edits into (Tasks 3-6 all modify this same file, so its prop names/types must not change after this
  task).
- Consumes: `useSpacesWithDistance` (Task 1), `listSpaces` (`lib/data/spaces.ts`, already exists,
  unchanged), `DiscoveryView` (already exists, unchanged).

No automated test — matches the existing untested page/component pattern. Manual verification in
Step 4.

- [ ] **Step 1: Create the admin-check helper**

Create `lib/admin/isCurrentUserAdmin.ts`:

```ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Read-only check for whether the current session belongs to an admin —
// used only to decide whether to show admin-only UI (e.g. "Agregar
// espacio"), never as the actual access gate: /admin/* stays protected by
// middleware.ts regardless of what this returns.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return false

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ?? false
}
```

- [ ] **Step 2: Create the dashboard component (header only, for now)**

Create `components/discovery/EspaciosDashboard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'

interface EspaciosDashboardProps {
  spaces: SpaceRecord[]
  isAdmin: boolean
}

export function EspaciosDashboard({ spaces, isAdmin }: EspaciosDashboardProps) {
  const withDistance = useSpacesWithDistance(spaces)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Espacios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Encuentra los mejores lugares para trabajar, reunirte y enfocarte — {withDistance.length}{' '}
            espacios disponibles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/espacios/nuevo"
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:border-black"
            >
              + Agregar espacio
            </Link>
          )}
          <Link
            href="/near-me?view=map"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
          >
            Mapa
          </Link>
        </div>
      </div>
    </div>
  )
}
```

(The inline `{withDistance.length} espacios disponibles` in the subtitle is temporary — Task 3
replaces it with a proper stat-tiles row and removes it from the subtitle.)

- [ ] **Step 3: Wire routing into the page**

Replace `app/near-me/page.tsx` with:

```tsx
import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'
import { EspaciosDashboard } from '@/components/discovery/EspaciosDashboard'
import { isCurrentUserAdmin } from '@/lib/admin/isCurrentUserAdmin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

interface NearMePageProps {
  searchParams: {
    view?: string
    q?: string
    country?: string
    district?: string
    category?: string
    sort?: string
  }
}

export default async function NearMePage({ searchParams }: NearMePageProps) {
  if (searchParams.view === 'map') {
    const spaces = await listSpaces({
      search: searchParams.q,
      country: searchParams.country,
      district: searchParams.district,
      category: searchParams.category,
    })
    return <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
  }

  const [spaces, isAdmin] = await Promise.all([listSpaces(), isCurrentUserAdmin()])
  return <EspaciosDashboard spaces={spaces} isAdmin={isAdmin} />
}
```

(Dashboard mode calls `listSpaces()` with no filters — it always gets the complete active list;
search and category narrowing happen client-side inside `EspaciosDashboard`, added in Task 5. This
is why stats in Task 3 will always show true totals regardless of what's typed/selected in the
dashboard, matching spec §4.2.)

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`:
1. Visit `/near-me` (no query param) — confirm the new header renders: title, subtitle with a real
   space count, and a black "Mapa" pill.
2. Click "Mapa" — confirm it navigates to `/near-me?view=map` and the full-screen map experience
   looks and behaves exactly as it always has.
3. Log in as the admin account, revisit `/near-me` — confirm "+ Agregar espacio" now also appears
   (it links to `/admin/espacios/nuevo`, which doesn't exist yet until the separate admin-dashboard
   plan is executed — a 404 there is expected and fine for this task).
4. Log in as a non-admin account (or stay logged out) — confirm "+ Agregar espacio" does NOT appear.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/isCurrentUserAdmin.ts components/discovery/EspaciosDashboard.tsx app/near-me/page.tsx
git commit -m "feat: add /near-me?view= routing and the Espacios dashboard header"
```

---

### Task 3: Stat tiles

**Files:**
- Modify: `components/discovery/EspaciosDashboard.tsx`

**Interfaces:**
- Consumes: `withDistance` (from Task 2's `useSpacesWithDistance` call, already in scope).
- Consumes: `districtLabel` (`lib/districts.ts`, already exists).
- Produces: nothing new for later tasks — this section is self-contained.

No automated test — presentational, manually verified (Step 3).

- [ ] **Step 1: Add the import and stat computations**

In `components/discovery/EspaciosDashboard.tsx`, add this import alongside the existing ones:

```ts
import { districtLabel } from '@/lib/districts'
```

Add these computations right after the `const withDistance = useSpacesWithDistance(spaces)` line:

```ts
  const verifiedCount = withDistance.filter((space) => space.verified).length
  const wellRatedCount = withDistance.filter((space) => space.rating != null && space.rating >= 4).length
  const wellRatedPct =
    withDistance.length > 0 ? Math.round((wellRatedCount / withDistance.length) * 100) : 0

  const districtCounts = new Map<string, number>()
  for (const space of withDistance) {
    districtCounts.set(space.district, (districtCounts.get(space.district) ?? 0) + 1)
  }
  let topDistrict: string | null = null
  let topDistrictCount = 0
  for (const [district, count] of districtCounts) {
    if (count > topDistrictCount) {
      topDistrict = district
      topDistrictCount = count
    }
  }
```

- [ ] **Step 2: Add the stat tiles row, and simplify the subtitle**

Change the subtitle line from:

```tsx
          <p className="mt-1 text-sm text-gray-500">
            Encuentra los mejores lugares para trabajar, reunirte y enfocarte — {withDistance.length}{' '}
            espacios disponibles.
          </p>
```

to:

```tsx
          <p className="mt-1 text-sm text-gray-500">
            Encuentra los mejores lugares para trabajar, reunirte y enfocarte.
          </p>
```

Then add this block right after the closing `</div>` of the header's
`flex flex-wrap items-center justify-between` row (i.e. right before whatever comes next in the file —
at this point in the plan, nothing yet, so it's the last thing in the component's returned JSX before
its closing `</div>`):

```tsx
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{withDistance.length}</p>
          <p className="mt-1 text-xs text-gray-500">Espacios registrados</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{verifiedCount}</p>
          <p className="mt-1 text-xs text-gray-500">Workcofy Spots verificados</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{wellRatedPct}%</p>
          <p className="mt-1 text-xs text-gray-500">Con buena calificación</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-2xl font-bold">{topDistrict ? districtLabel(topDistrict) : '—'}</p>
          <p className="mt-1 text-xs text-gray-500">Ubicación más popular</p>
        </div>
      </div>
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, visit `/near-me`, confirm
four stat tiles render below the header with real, non-zero numbers (given the 85 real spaces already
in production).

- [ ] **Step 4: Commit**

```bash
git add components/discovery/EspaciosDashboard.tsx
git commit -m "feat: add stat tiles to the Espacios dashboard"
```

---

### Task 4: "Recomendados para ti" carousel

**Files:**
- Modify: `components/discovery/EspaciosDashboard.tsx`

**Interfaces:**
- Consumes: `selectNearbyPopularSpaces` (`lib/discovery/selectNearbyPopularSpaces.ts`, already
  exists, already tested — no changes), `SpaceCard` (`components/discovery/SpaceCard.tsx`, already
  exists — used exactly as `DiscoveryView.tsx` already uses it for a selected-space preview, here
  reused for a horizontal list instead), `withDistance` (already in scope).
- Produces: nothing new for later tasks.

No automated test — composition of already-tested/already-used pieces. Manually verified (Step 3).

- [ ] **Step 1: Add the import and the recommended-spaces computation**

Add these imports:

```ts
import { useMemo } from 'react'
import { selectNearbyPopularSpaces } from '@/lib/discovery/selectNearbyPopularSpaces'
import { SpaceCard } from '@/components/discovery/SpaceCard'
```

Add this computation right after the `topDistrict`/`topDistrictCount` loop from Task 3:

```ts
  const recommended = useMemo(() => selectNearbyPopularSpaces(withDistance, 8), [withDistance])
```

- [ ] **Step 2: Add the carousel section**

Add this block right after the stat-tiles `<div className="mt-6 grid ...">...</div>` from Task 3:

```tsx
      {recommended.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Recomendados para ti</h2>
          <p className="mt-0.5 text-sm text-gray-500">Cerca de ti y populares en la comunidad.</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
            {recommended.map((space) => (
              <div key={space.id} className="w-72 flex-none">
                <SpaceCard space={space} isSelected={false} onSelect={() => {}} />
              </div>
            ))}
          </div>
        </div>
      )}
```

(`onSelect={() => {}}` matches how `SpaceCard` is already used elsewhere for a non-interactive
context — e.g. `DiscoveryView.tsx`'s own selected-space preview card passes the same no-op; the card's
own internal "Ver espacio" button is what actually navigates, independent of `onSelect`.)

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, visit `/near-me`, confirm
a horizontally-scrollable "Recomendados para ti" row of space cards appears below the stats, each
card showing a photo, rating, Workcofy Score, and open/closed status exactly like they do on the
full-screen map's own cards.

- [ ] **Step 4: Commit**

```bash
git add components/discovery/EspaciosDashboard.tsx
git commit -m "feat: add Recomendados para ti carousel to the Espacios dashboard"
```

---

### Task 5: "Explora espacios" — search, category tabs, sort, list, pagination

**Files:**
- Modify: `components/discovery/EspaciosDashboard.tsx`

**Interfaces:**
- Consumes: `sortSpaces` (`lib/filters/sortSpaces.ts`), `type SortOption`
  (`lib/filters/discoveryFilters.ts`), `SortDropdown` (`components/discovery/SortDropdown.tsx`),
  `CompactSpaceRow` (`components/discovery/CompactSpaceRow.tsx`), `CATEGORY_OPTIONS`
  (`lib/categories.ts`) — all already exist, unchanged.
- Produces: `sortedFiltered` (the full filtered+sorted array, not just the currently-paginated
  slice) — Task 6's side-panel map markers read this exact variable, so its name must not change.

No automated test — composition of already-used pieces plus new local filter/sort state. Manually
verified (Step 3).

- [ ] **Step 1: Add imports**

Add these imports:

```ts
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sortSpaces } from '@/lib/filters/sortSpaces'
import type { SortOption } from '@/lib/filters/discoveryFilters'
import { SortDropdown } from '@/components/discovery/SortDropdown'
import { CompactSpaceRow } from '@/components/discovery/CompactSpaceRow'
import { CATEGORY_OPTIONS } from '@/lib/categories'
```

(`useState` joins the existing `useMemo` import from Task 4 — combine them into one
`import { useMemo, useState } from 'react'` line rather than two separate `react` imports.)

- [ ] **Step 2: Add state and the filtered/sorted computation**

Add this inside the component, right after the `const recommended = useMemo(...)` line from Task 4:

```ts
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('distance')
  const [visibleCount, setVisibleCount] = useState(10)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return withDistance.filter((space) => {
      if (category && space.category !== category) return false
      if (
        term &&
        !space.name.toLowerCase().includes(term) &&
        !(space.address ?? '').toLowerCase().includes(term)
      ) {
        return false
      }
      return true
    })
  }, [withDistance, search, category])

  const sortedFiltered = useMemo(() => sortSpaces(filtered, sort), [filtered, sort])
  const visibleSpaces = sortedFiltered.slice(0, visibleCount)
```

- [ ] **Step 3: Add the "Explora espacios" section with an empty side-panel placeholder grid**

Add this block right after the "Recomendados para ti" `{recommended.length > 0 && (...)}` block from
Task 4, and make sure it's the LAST thing inside the component's outermost `<div className="mx-auto
max-w-6xl ...">` before that div's closing tag:

```tsx
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Explora espacios</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar espacios, barrios o lugares..."
              className="min-w-[220px] flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            />
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                category === null
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-700 hover:border-black'
              }`}
            >
              Todos
            </button>
            {CATEGORY_OPTIONS.map((option) =>
              option.active ? (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    category === option.value
                      ? 'bg-black text-white'
                      : 'border border-gray-200 text-gray-700 hover:border-black'
                  }`}
                >
                  {option.label}
                </button>
              ) : (
                <span
                  key={option.value}
                  title="Próximamente"
                  className="cursor-not-allowed rounded-full border border-dashed border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300"
                >
                  {option.label}
                </span>
              )
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {visibleSpaces.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No encontramos espacios con estos filtros.
              </p>
            ) : (
              visibleSpaces.map((space) => (
                <CompactSpaceRow
                  key={space.id}
                  space={space}
                  isSelected={false}
                  onSelect={() => router.push(`/spaces/${space.slug}`)}
                />
              ))
            )}
          </div>

          {visibleCount < sortedFiltered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 10)}
              className="mt-4 w-full rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:border-black"
            >
              Ver más espacios
            </button>
          )}
        </div>

        <aside className="flex flex-col gap-4"></aside>
      </div>
```

(The empty `<aside>` is deliberate — Task 6 fills it in. Leaving it empty here is a real, working,
committable state: the page just has blank space in that column until Task 6 lands.)

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, visit `/near-me`:
1. Type into the search box — confirm the list narrows to matching names/addresses as you type.
2. Click a category tab — confirm the list narrows to that category, and the tab turns black;
   clicking "Todos" clears it.
3. Change the sort dropdown — confirm the list re-orders.
4. Click a row — confirm it navigates to that space's `/spaces/[slug]` page (login-gated, per the
   earlier session's work — a logged-out click redirects to `/login`, which is correct, not a bug).
5. If there are more than 10 matching results, confirm "Ver más espacios" reveals more; confirm it
   disappears once everything is shown.

- [ ] **Step 5: Commit**

```bash
git add components/discovery/EspaciosDashboard.tsx
git commit -m "feat: add search, category tabs, sort, and list to Explora espacios"
```

---

### Task 6: Side panel — small map, tipos de espacios, partner CTA

**Files:**
- Modify: `components/discovery/EspaciosDashboard.tsx`

**Interfaces:**
- Consumes: `MapView` (`components/map/MapView.tsx`), `useUserLocation` (`lib/geo/useUserLocation.ts`),
  `sortedFiltered` (from Task 5, exact same variable — full filtered/sorted set, not the paginated
  `visibleSpaces`), `withDistance` (from Task 2), `CATEGORY_OPTIONS` (already imported in Task 5).

No automated test — composition of already-used pieces. Manually verified (Step 3).

- [ ] **Step 1: Add imports and the side-panel computations**

Add these imports:

```ts
import { MapView } from '@/components/map/MapView'
import { useUserLocation } from '@/lib/geo/useUserLocation'
```

Add this inside the component, right after the `const visibleSpaces = sortedFiltered.slice(0,
visibleCount)` line from Task 5:

```ts
  const { coordinate } = useUserLocation()

  const sideMapMarkers = sortedFiltered
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
      photoUrl: space.photos?.find((photo) => photo.url)?.url ?? null,
      favorited: false,
      dimmed: false,
    }))

  const categoryCounts = CATEGORY_OPTIONS.filter((option) => option.active).map((option) => ({
    ...option,
    count: withDistance.filter((space) => space.category === option.value).length,
  }))
```

- [ ] **Step 2: Fill in the side panel**

Replace:

```tsx
        <aside className="flex flex-col gap-4"></aside>
```

with:

```tsx
        <aside className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="h-[240px]">
              <MapView
                center={coordinate}
                zoom={13}
                markers={sideMapMarkers}
                selectedMarkerId={null}
                onMarkerSelect={() => {}}
              />
            </div>
            <div className="p-4">
              <Link href="/near-me?view=map" className="text-sm font-semibold text-black hover:underline">
                Ver todos en el mapa →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-semibold">Tipos de espacios</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {categoryCounts.map((option) => (
                <li key={option.value} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{option.label}</span>
                  <span className="text-gray-400">{option.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold">¿Tienes un espacio?</h3>
            <p className="mt-1 text-xs text-gray-500">
              Únete a Workcofy y llega a miles de personas que buscan dónde trabajar.
            </p>
            <span
              title="Próximamente"
              className="mt-3 inline-flex cursor-not-allowed items-center rounded-full bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-400"
            >
              Agregar mi espacio
            </span>
          </div>
        </aside>
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, visit `/near-me`:
1. Confirm a small map renders in the side panel with pins matching the current filtered list —
   typing a search term or picking a category should update the pins too.
2. Confirm "Ver todos en el mapa" navigates to `/near-me?view=map`.
3. Confirm "Tipos de espacios" shows a count per category, and that these counts do NOT change when
   you filter the main list (they reflect the full 85-space set at all times, per spec §4.2/§4.5).
4. Confirm the "¿Tienes un espacio?" card renders with an inert, grayed-out "Agregar mi espacio"
   pill (no navigation on click, a "Próximamente" tooltip on hover).

- [ ] **Step 4: Resize the browser to a mobile width (or use dev tools' device toolbar) and confirm**

The stats/carousel/side-panel content stacks vertically below the search+category+list section
(rather than the desktop two-column grid), and the small map sits at the bottom of that stack, not
floating beside the list — per spec §5. If it doesn't already look right from the existing responsive
Tailwind classes (`grid-cols-1 lg:grid-cols-[1fr_320px]` already stacks by default below the `lg:`
breakpoint), no further change is needed; if something overflows or looks broken, adjust the relevant
`className` in this file to fix it before committing.

- [ ] **Step 5: Commit**

```bash
git add components/discovery/EspaciosDashboard.tsx
git commit -m "feat: add side panel (map, tipos de espacios, partner CTA) to the Espacios dashboard"
```

---

### Task 7: Full regression pass and deploy

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean)

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass (this plan added no new test files, but Task 1's `DiscoveryView.tsx`
edit must not have broken anything existing)

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds with no type/lint errors

- [ ] **Step 4: Full manual pass**

Run `npm run dev`. Visit `/near-me` logged out — confirm the dashboard renders (no crash from a null
user), the "Agregar espacio" button is absent, and every section (stats, recomendados, explora
espacios, side panel) renders sensibly. Click into a space row — confirm the existing login gate
redirects to `/login` as expected (unchanged prior behavior, not a regression). Log in, revisit,
confirm favoriting/navigation still works end to end. Click "Mapa", confirm the full-screen experience
is completely unaffected by everything in this plan.

- [ ] **Step 5: Push**

```bash
git push aittrocom main
```

Expected: push succeeds; Vercel's Git integration on `aittrocom-blip/workcofy` picks it up and starts
a new Production deployment automatically.
