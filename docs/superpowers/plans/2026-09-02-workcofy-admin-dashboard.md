# Workcofy Admin Dashboard + Space CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin a real dashboard shell, and let them create, fully edit, and soft-delete
spaces — today `/admin/espacios` is a bare list with an edit page limited to verification/amenities
only, no create, no delete.

**Architecture:** No DB migration — every field this touches already exists on `spaces`. A new
`app/admin/layout.tsx` wraps all `/admin/*` routes in a dedicated shell. Space creation is a
Google-Places-search-assisted flow (extracting reusable logic out of the existing seed script) with
a manual-entry fallback. Space editing expands the existing per-space admin page with a general
fields form, a day-by-day opening-hours editor, a real photo upload widget (Supabase Storage), and
soft delete via the existing `active` column.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, Supabase (jsonb/Storage, no
schema change), Google Places API (Text Search + Place Details).

**Spec:** `docs/superpowers/specs/2026-09-01-workcofy-admin-dashboard-design.md`

## Global Constraints

- No SQL migration — every field edited here (`name`, `category`, `country`, `district`, `address`,
  `phone`, `website`, `opening_hours`, `price_level`, `photos`, `active`) already exists on `spaces`.
- "Delete" is `active = false` (soft delete) — never a real row delete. Reversible from the same
  admin panel via a "Reactivar" action.
- Every admin-writing server action re-checks `profiles.is_admin` server-side (defense in depth,
  matching the existing `updateVerification`/`updateAmenities` pattern) — never trust the middleware
  redirect alone.
- `GOOGLE_MAPS_SERVER_API_KEY` (server-only) is the only Google Places credential used — never sent
  to the client, matching how the existing seed scripts already use it.
- District is free text validated in application code, not a DB enum (the original 3-value CHECK
  constraint was dropped in migration `0002_expansion_geo.sql` once Chile comunas were added) —
  `DISTRICTS` in `lib/districts.ts` only lists the 3 original Lima districts and must NOT be treated
  as an exhaustive list anywhere in this plan.
- Photo Storage bucket is `space-photos` (public, already created in migration `0002`), matching
  `scripts/backfill-photos.ts`'s existing usage.

---

### Task 1: Dashboard shell

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `createAdminSupabaseClient()` (`lib/supabase/admin.ts`, already exists).
- Produces: nothing later tasks import — this is the outermost shell every `/admin/*` route (including
  ones built in later tasks) renders inside automatically via Next.js layout nesting.

No automated test — presentational + a few `count()` queries, verified manually (Step 3).

- [ ] **Step 1: Create the admin layout**

Create `app/admin/layout.tsx`:

```tsx
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Espacios', href: '/admin/espacios', enabled: true },
  { label: 'Usuarios', href: '#', enabled: false },
  { label: 'Partners', href: '#', enabled: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="flex w-56 flex-none flex-col border-r border-gray-100 bg-white px-4 py-6">
        <Link href="/admin" className="text-lg font-bold tracking-tight">
          Workcofy Admin
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                title="Próximamente"
                className="cursor-not-allowed rounded-xl px-3 py-2 text-sm font-semibold text-gray-300"
              >
                {item.label}
              </span>
            )
          )}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 bg-gray-50">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create the admin home page with stat tiles**

Create `app/admin/page.tsx`:

```tsx
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createAdminSupabaseClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count: total }, { count: verified }, { count: recent }] = await Promise.all([
    supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('active', true).eq('verified', true),
    supabase
      .from('spaces')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .gte('created_at', sevenDaysAgo),
  ])

  return { total: total ?? 0, verified: verified ?? 0, recent: recent ?? 0 }
}

export default async function AdminHomePage() {
  const stats = await getStats()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="mt-1 text-sm text-gray-500">Espacios activos</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-3xl font-bold">{stats.verified}</p>
          <p className="mt-1 text-sm text-gray-500">Verificados</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-3xl font-bold">{stats.recent}</p>
          <p className="mt-1 text-sm text-gray-500">Agregados esta semana</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, log in as the admin
account, visit `/admin` — confirm the sidebar (Espacios enabled, Usuarios/Partners grayed out with a
"Próximamente" tooltip) and the three stat tiles render with real numbers. Visit `/admin/espacios` —
confirm it now renders inside the new sidebar shell too (it's nested under `app/admin/layout.tsx`
automatically).

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat: add admin dashboard shell with nav and basic stats"
```

---

### Task 2: Shared admin auth check + admin-only data reads

**Files:**
- Create: `lib/admin/requireAdmin.ts`
- Create: `lib/data/adminSpaces.ts`
- Modify: `lib/data/spaces.ts`
- Modify: `app/admin/espacios/[slug]/actions.ts`

**Interfaces:**
- Produces: `requireAdmin(): Promise<void>` (throws `'No autorizado'` if not a signed-in admin) —
  every write action in Tasks 4, 5, 6 imports this. `listAllSpacesAdmin(): Promise<SpaceRecord[]>`
  and `getSpaceBySlugAdmin(slug: string): Promise<SpaceRecord | null>` — both bypass the public
  `active = true` filter (Task 5 needs this so a deactivated space's edit page still loads instead of
  404ing, and the admin list needs to show inactive spaces too). `normalizeSpace` becomes exported
  from `lib/data/spaces.ts` (was a private helper) — `adminSpaces.ts` reuses it instead of
  duplicating the `parseAmenities` wrap.
- Consumes: nothing new — this task only extracts/reuses what already exists.

No automated test — mirrors the existing untested pattern for `lib/data/spaces.ts`'s own functions
and the existing local `requireAdmin` this replaces.

- [ ] **Step 1: Extract `requireAdmin` into a shared module**

Create `lib/admin/requireAdmin.ts` — this is the exact same function currently defined locally at the
top of `app/admin/espacios/[slug]/actions.ts`, just moved so other action files (Tasks 4, 5, 6) can
import it instead of each redefining it:

```ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function requireAdmin(): Promise<void> {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
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
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) throw new Error('No autorizado')
}
```

- [ ] **Step 2: Point the existing actions.ts at the shared helper**

In `app/admin/espacios/[slug]/actions.ts`, delete the local `async function requireAdmin() { ... }`
definition entirely (lines 9-40 in the current file — the whole function, from `async function
requireAdmin()` through its closing `}`), and delete the now-unused `createServerClient`/`cookies`
imports at the top of the file. Add this import instead, alongside the other existing imports:

```ts
import { requireAdmin } from '@/lib/admin/requireAdmin'
```

The rest of the file (`updateVerification`, `updateAmenities`, and their own `requireAdmin()` calls)
stays exactly as-is — only the function's definition moves, not its call sites.

- [ ] **Step 3: Export `normalizeSpace` from the data layer**

In `lib/data/spaces.ts`, change:

```ts
function normalizeSpace(row: Record<string, unknown>): SpaceRecord {
```

to:

```ts
export function normalizeSpace(row: Record<string, unknown>): SpaceRecord {
```

No other change to that file.

- [ ] **Step 4: Create the admin-only data reads**

Create `lib/data/adminSpaces.ts`:

```ts
import 'server-only'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { normalizeSpace } from '@/lib/data/spaces'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

// Admin-only reads that intentionally bypass the public `active = true` filter
// every function in lib/data/spaces.ts applies — the admin panel needs to see
// and manage deactivated spaces too, not just what's publicly visible.

export async function listAllSpacesAdmin(): Promise<SpaceRecord[]> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpaceBySlugAdmin(slug: string): Promise<SpaceRecord | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`Failed to load space "${slug}": ${error.message}`)
  return data ? normalizeSpace(data) : null
}
```

- [ ] **Step 5: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Run `npx vitest run` — must be all-green
(this task shouldn't change any test's behavior, it's a pure extraction/addition). Then `npm run
dev`, confirm `/admin/espacios` and `/admin/espacios/<a-real-slug>` still load and the existing
"Amenities confirmadas" / "Amenities" sections there still work exactly as before (this task must not
change their behavior, only where `requireAdmin` is defined).

- [ ] **Step 6: Commit**

```bash
git add lib/admin/requireAdmin.ts lib/data/adminSpaces.ts lib/data/spaces.ts "app/admin/espacios/[slug]/actions.ts"
git commit -m "refactor: extract shared requireAdmin, add admin-only space reads"
```

---

### Task 3: Google Places search + details as shared, tested library code

**Files:**
- Create: `lib/places/googlePlaces.ts`
- Test: `lib/places/googlePlaces.test.ts`

**Interfaces:**
- Produces: `searchGooglePlaces(query: string, apiKey: string): Promise<GooglePlaceSearchResult[]>`,
  `fetchGooglePlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails>`,
  `GooglePlaceSearchResult { placeId, name, address }`, `GooglePlaceDetails { name, address,
  latitude, longitude, phone, website, rating, reviewCount, priceLevel, openingHours,
  photoReferences, googleMapsUrl }`. Task 4's server actions import both functions and both types.
- Consumes: `OpeningHours` type from `lib/hours/openingHours.ts` (already exists).

This is genuinely new logic (the existing `scripts/seed-google-places.ts` only ever resolves to a
single best match for an already-known target — this needs a general free-text search returning
multiple candidates), so it's TDD: tests first.

- [ ] **Step 1: Write the failing test file**

Create `lib/places/googlePlaces.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from 'vitest'
import { searchGooglePlaces, fetchGooglePlaceDetails } from './googlePlaces'

describe('searchGooglePlaces', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns mapped results on a successful search', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'OK',
        results: [
          { place_id: 'p1', name: 'Moss Espresso', formatted_address: 'Calle Uno 123' },
          { place_id: 'p2', name: 'Work & Co', formatted_address: 'Calle Dos 456' },
        ],
      }),
    }) as unknown as typeof fetch
    const results = await searchGooglePlaces('moss espresso', 'fake-key')
    expect(results).toEqual([
      { placeId: 'p1', name: 'Moss Espresso', address: 'Calle Uno 123' },
      { placeId: 'p2', name: 'Work & Co', address: 'Calle Dos 456' },
    ])
  })

  it('returns an empty array when Google finds no results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    }) as unknown as typeof fetch
    const results = await searchGooglePlaces('lugar inexistente', 'fake-key')
    expect(results).toEqual([])
  })

  it('returns an empty array on a malformed/error Google response rather than throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: 'REQUEST_DENIED' }),
    }) as unknown as typeof fetch
    const results = await searchGooglePlaces('cualquier cosa', 'fake-key')
    expect(results).toEqual([])
  })

  it('caps results at 5 even when Google returns more', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'OK',
        results: Array.from({ length: 8 }, (_, i) => ({
          place_id: `p${i}`,
          name: `Place ${i}`,
          formatted_address: `Address ${i}`,
        })),
      }),
    }) as unknown as typeof fetch
    const results = await searchGooglePlaces('café', 'fake-key')
    expect(results).toHaveLength(5)
  })
})

describe('fetchGooglePlaceDetails', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('maps a successful Place Details response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'OK',
        result: {
          name: 'Moss Espresso',
          formatted_address: 'Calle Uno 123',
          geometry: { location: { lat: -12.1, lng: -77.03 } },
          formatted_phone_number: '+51 1 234 5678',
          website: 'https://moss.pe',
          rating: 4.8,
          user_ratings_total: 49,
          price_level: 2,
          opening_hours: { periods: [{ open: { day: 1, time: '0800' }, close: { day: 1, time: '2000' } }] },
          photos: [{ photo_reference: 'ref1', width: 800, height: 600 }],
          url: 'https://maps.google.com/?cid=123',
        },
      }),
    }) as unknown as typeof fetch
    const details = await fetchGooglePlaceDetails('p1', 'fake-key')
    expect(details).toEqual({
      name: 'Moss Espresso',
      address: 'Calle Uno 123',
      latitude: -12.1,
      longitude: -77.03,
      phone: '+51 1 234 5678',
      website: 'https://moss.pe',
      rating: 4.8,
      reviewCount: 49,
      priceLevel: 2,
      openingHours: { periods: [{ open: { day: 1, time: '0800' }, close: { day: 1, time: '2000' } }] },
      photoReferences: [{ photo_reference: 'ref1', width: 800, height: 600 }],
      googleMapsUrl: 'https://maps.google.com/?cid=123',
    })
  })

  it('handles a result with missing optional fields gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: 'OK', result: { name: 'Bare Place' } }),
    }) as unknown as typeof fetch
    const details = await fetchGooglePlaceDetails('p2', 'fake-key')
    expect(details).toEqual({
      name: 'Bare Place',
      address: null,
      latitude: null,
      longitude: null,
      phone: null,
      website: null,
      rating: null,
      reviewCount: null,
      priceLevel: null,
      openingHours: null,
      photoReferences: [],
      googleMapsUrl: null,
    })
  })

  it('throws when Google returns a non-OK status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: 'NOT_FOUND' }),
    }) as unknown as typeof fetch
    await expect(fetchGooglePlaceDetails('bad-id', 'fake-key')).rejects.toThrow('NOT_FOUND')
  })
})
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx vitest run lib/places/googlePlaces.test.ts`
Expected: FAIL — `lib/places/googlePlaces.ts` doesn't exist yet, so the import itself fails.

- [ ] **Step 3: Implement `lib/places/googlePlaces.ts`**

```ts
import type { OpeningHours } from '@/lib/hours/openingHours'

const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'
const MAX_SEARCH_RESULTS = 5

export interface GooglePlaceSearchResult {
  placeId: string
  name: string
  address: string | null
}

export interface GooglePlaceDetails {
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  website: string | null
  rating: number | null
  reviewCount: number | null
  priceLevel: number | null
  openingHours: OpeningHours | null
  photoReferences: { photo_reference: string; width: number; height: number }[]
  googleMapsUrl: string | null
}

interface GoogleTextSearchResult {
  place_id: string
  name: string
  formatted_address?: string
}

// A general free-text search (name and/or address), unlike
// scripts/seed-google-places.ts's findPlaceId — that one narrows an
// already-known target down to a single best match; this returns every
// candidate so an admin can pick the right one.
export async function searchGooglePlaces(query: string, apiKey: string): Promise<GooglePlaceSearchResult[]> {
  const url = `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK' || !body.results?.length) return []

  return (body.results as GoogleTextSearchResult[]).slice(0, MAX_SEARCH_RESULTS).map((result) => ({
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address ?? null,
  }))
}

interface GoogleDetailsResult {
  name?: string
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  opening_hours?: { periods?: OpeningHours['periods'] }
  photos?: { photo_reference: string; width: number; height: number }[]
  url?: string
}

export async function fetchGooglePlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceDetails> {
  const fields = [
    'name', 'formatted_address', 'geometry', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total', 'price_level',
    'opening_hours', 'photos', 'url',
  ].join(',')
  const url = `${PLACE_DETAILS_URL}?place_id=${placeId}&fields=${fields}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK') {
    throw new Error(`Place Details failed for ${placeId}: ${body.status}`)
  }

  const result = body.result as GoogleDetailsResult

  return {
    name: result.name ?? '',
    address: result.formatted_address ?? null,
    latitude: result.geometry?.location?.lat ?? null,
    longitude: result.geometry?.location?.lng ?? null,
    phone: result.formatted_phone_number ?? null,
    website: result.website ?? null,
    rating: result.rating ?? null,
    reviewCount: result.user_ratings_total ?? null,
    priceLevel: result.price_level ?? null,
    openingHours: result.opening_hours?.periods ? { periods: result.opening_hours.periods } : null,
    photoReferences: result.photos ?? [],
    googleMapsUrl: result.url ?? null,
  }
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx vitest run lib/places/googlePlaces.test.ts`
Expected: PASS (all 7 tests green)

- [ ] **Step 5: Commit**

```bash
git add lib/places/googlePlaces.ts lib/places/googlePlaces.test.ts
git commit -m "feat: add shared Google Places search/details module with tests"
```

---

### Task 4: Create-space flow (Google-assisted, with manual fallback)

**Files:**
- Create: `app/admin/espacios/nuevo/actions.ts`
- Create: `app/admin/espacios/nuevo/page.tsx`
- Create: `app/admin/espacios/nuevo/NewSpaceForm.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `searchGooglePlaces`/`fetchGooglePlaceDetails`/
  `GooglePlaceSearchResult` (Task 3), `generateSpaceSlug` (`lib/slug.ts`, already exists),
  `CATEGORY_OPTIONS` (`lib/categories.ts`, already exists), `COUNTRY_OPTIONS` (`lib/countries.ts`,
  already exists), `createAdminSupabaseClient` (already exists).
- Produces: the `/admin/espacios/nuevo` route. Nothing later tasks import from these files directly
  — Task 5 links TO this route (`href="/admin/espacios/nuevo"`) but doesn't import its code.

**Design note (not in the spec, a scope call made while writing this plan):** Google-sourced photos
are deliberately NOT auto-downloaded during creation — `scripts/backfill-photos.ts` already exists
specifically to backfill photos for `data_source: 'google'` spaces missing them, so duplicating that
download-and-upload logic inline here would be redundant. A newly created space starts with an empty
`photos` array; the admin adds photos afterward via the edit page's upload widget (Task 6), or a
`backfill-photos.ts` run picks up Google-sourced ones later.

No automated test — matches the existing untested server-action pattern. Manual verification in
Step 4.

- [ ] **Step 1: Create the server actions**

Create `app/admin/espacios/nuevo/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  searchGooglePlaces,
  fetchGooglePlaceDetails,
  type GooglePlaceSearchResult,
} from '@/lib/places/googlePlaces'
import { generateSpaceSlug } from '@/lib/slug'
import type { CategoryValue } from '@/lib/categories'
import type { CountryValue } from '@/lib/countries'
import type { OpeningHours } from '@/lib/hours/openingHours'

export async function searchSpaces(query: string): Promise<GooglePlaceSearchResult[]> {
  await requireAdmin()
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_SERVER_API_KEY no está configurada')
  const trimmed = query.trim()
  if (!trimmed) return []
  return searchGooglePlaces(trimmed, apiKey)
}

export interface NewSpaceFormValues {
  name: string
  category: CategoryValue
  country: CountryValue
  district: string
  address: string
  phone: string
  website: string
  priceLevel: number | null
  latitude: number | null
  longitude: number | null
  googlePlaceId: string | null
  googleMapsUrl: string | null
  rating: number | null
  reviewCount: number | null
  openingHours: OpeningHours | null
}

export async function fetchPlaceForReview(placeId: string): Promise<NewSpaceFormValues> {
  await requireAdmin()
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_SERVER_API_KEY no está configurada')
  const details = await fetchGooglePlaceDetails(placeId, apiKey)
  return {
    name: details.name,
    category: 'cafe',
    country: 'pe',
    district: '',
    address: details.address ?? '',
    phone: details.phone ?? '',
    website: details.website ?? '',
    priceLevel: details.priceLevel,
    latitude: details.latitude,
    longitude: details.longitude,
    googlePlaceId: placeId,
    googleMapsUrl: details.googleMapsUrl,
    rating: details.rating,
    reviewCount: details.reviewCount,
    openingHours: details.openingHours,
  }
}

export async function createSpace(values: NewSpaceFormValues): Promise<{ slug: string }> {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const slug = generateSpaceSlug(values.name, values.district || 'espacio')

  const { error } = await admin.from('spaces').insert({
    name: values.name,
    slug,
    category: values.category,
    country: values.country,
    district: values.district,
    address: values.address || null,
    phone: values.phone || null,
    website: values.website || null,
    price_level: values.priceLevel,
    latitude: values.latitude,
    longitude: values.longitude,
    google_place_id: values.googlePlaceId,
    google_maps_url: values.googleMapsUrl,
    rating: values.rating,
    review_count: values.reviewCount,
    opening_hours: values.openingHours,
    data_source: values.googlePlaceId ? 'google' : 'mock',
    active: true,
    verified: false,
  })

  if (error) throw new Error(`No se pudo crear el espacio: ${error.message}`)

  revalidatePath('/admin/espacios')
  return { slug }
}
```

- [ ] **Step 2: Create the page shell**

Create `app/admin/espacios/nuevo/page.tsx`:

```tsx
import { NewSpaceForm } from './NewSpaceForm'

export default function NewSpacePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Agregar espacio</h1>
      <NewSpaceForm />
    </div>
  )
}
```

- [ ] **Step 3: Create the two-step form component**

Create `app/admin/espacios/nuevo/NewSpaceForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { searchSpaces, fetchPlaceForReview, createSpace, type NewSpaceFormValues } from './actions'
import type { GooglePlaceSearchResult } from '@/lib/places/googlePlaces'

const BLANK_VALUES: NewSpaceFormValues = {
  name: '',
  category: 'cafe',
  country: 'pe',
  district: '',
  address: '',
  phone: '',
  website: '',
  priceLevel: null,
  latitude: null,
  longitude: null,
  googlePlaceId: null,
  googleMapsUrl: null,
  rating: null,
  reviewCount: null,
  openingHours: null,
}

export function NewSpaceForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'search' | 'form'>('search')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GooglePlaceSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [values, setValues] = useState<NewSpaceFormValues>(BLANK_VALUES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearching(true)
    setError(null)
    try {
      const found = await searchSpaces(query)
      setResults(found)
      setSearched(true)
    } catch {
      setError('No se pudo buscar. Intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  async function pickResult(placeId: string) {
    setSearching(true)
    setError(null)
    try {
      const prefilled = await fetchPlaceForReview(placeId)
      setValues(prefilled)
      setMode('form')
    } catch {
      setError('No se pudo cargar el lugar. Intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  function startManual() {
    setValues(BLANK_VALUES)
    setMode('form')
  }

  function updateField<K extends keyof NewSpaceFormValues>(key: K, value: NewSpaceFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { slug } = await createSpace(values)
      router.push(`/admin/espacios/${slug}`)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  if (mode === 'search') {
    return (
      <div className="mt-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            placeholder="Nombre o dirección del espacio"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">No se encontraron resultados en Google.</p>
        )}

        {results.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {results.map((result) => (
              <li key={result.placeId}>
                <button
                  type="button"
                  onClick={() => pickResult(result.placeId)}
                  disabled={searching}
                  className="w-full rounded-xl border border-gray-100 px-4 py-3 text-left text-sm hover:border-black disabled:opacity-50"
                >
                  <span className="font-semibold">{result.name}</span>
                  {result.address && <span className="mt-0.5 block text-gray-500">{result.address}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={startManual}
          className="mt-6 text-sm font-semibold text-gray-500 underline hover:text-black"
        >
          Cargar manualmente
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Nombre</label>
        <input
          required
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Categoría</label>
          <select
            value={values.category}
            onChange={(event) => updateField('category', event.target.value as NewSpaceFormValues['category'])}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">País</label>
          <select
            value={values.country}
            onChange={(event) => updateField('country', event.target.value as NewSpaceFormValues['country'])}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Distrito</label>
        <input
          required
          value={values.district}
          onChange={(event) => updateField('district', event.target.value)}
          placeholder="ej: miraflores, las_condes"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Dirección</label>
        <input
          value={values.address}
          onChange={(event) => updateField('address', event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Teléfono</label>
          <input
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Sitio web</label>
          <input
            value={values.website}
            onChange={(event) => updateField('website', event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear espacio'}
        </button>
        <button
          type="button"
          onClick={() => setMode('search')}
          className="text-sm font-semibold text-gray-500 hover:text-black"
        >
          Volver a buscar
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, log in as admin, visit
`/admin/espacios/nuevo` directly (no link to it yet — that's added in Task 5). Search for a real café
name, pick a result, confirm the review form pre-fills name/address/phone/website, fill in
category/country/district, save, and confirm it redirects to `/admin/espacios/<new-slug>` and the
space now appears when you go back to `/admin/espacios`. Also test "Cargar manualmente" → blank form
→ save → same confirmation.

- [ ] **Step 5: Commit**

```bash
git add app/admin/espacios/nuevo
git commit -m "feat: add Google-assisted space creation flow with manual fallback"
```

---

### Task 5: Edit general fields, opening hours, and soft delete

**Files:**
- Modify: `app/admin/espacios/[slug]/actions.ts`
- Create: `app/admin/espacios/[slug]/SpaceFieldsForm.tsx`
- Modify: `app/admin/espacios/[slug]/page.tsx`
- Modify: `app/admin/espacios/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `getSpaceBySlugAdmin`/`listAllSpacesAdmin` (Task 2),
  `CATEGORY_OPTIONS`, `COUNTRY_OPTIONS`, `DAY_LABELS`/`WEEK_DISPLAY_ORDER`/`OpeningHours`/
  `OpeningPeriod` (all already exist).
- Produces: `updateSpaceFields(spaceId, slug, fields: SpaceFieldsInput): Promise<void>`,
  `setSpaceActive(spaceId, slug, active: boolean): Promise<void>` (both added to the existing
  `actions.ts`) — Task 6 doesn't call these but adds two siblings to the same file.
  `<SpaceFieldsForm>` — Task 6 modifies this same component to add a photos section.

No automated test — matches the existing untested server-action pattern. Manual verification in
Step 5.

- [ ] **Step 1: Add the two new server actions**

In `app/admin/espacios/[slug]/actions.ts`, add this import alongside the existing ones:

```ts
import type { OpeningHours } from '@/lib/hours/openingHours'
```

Then add these two functions at the end of the file, after `updateAmenities`:

```ts
export interface SpaceFieldsInput {
  name: string
  category: string
  country: string
  district: string
  address: string | null
  phone: string | null
  website: string | null
  priceLevel: number | null
  openingHours: OpeningHours | null
}

export async function updateSpaceFields(spaceId: string, slug: string, fields: SpaceFieldsInput) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('spaces')
    .update({
      name: fields.name,
      category: fields.category,
      country: fields.country,
      district: fields.district,
      address: fields.address,
      phone: fields.phone,
      website: fields.website,
      price_level: fields.priceLevel,
      opening_hours: fields.openingHours,
    })
    .eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath('/admin/espacios')
  revalidatePath(`/spaces/${slug}`)
}

export async function setSpaceActive(spaceId: string, slug: string, active: boolean) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('spaces').update({ active }).eq('id', spaceId)

  if (error) throw new Error(`No se pudo actualizar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath('/admin/espacios')
  revalidatePath(`/spaces/${slug}`)
}
```

- [ ] **Step 2: Create the general-fields + opening-hours form**

Create `app/admin/espacios/[slug]/SpaceFieldsForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { DAY_LABELS, WEEK_DISPLAY_ORDER, type OpeningHours, type OpeningPeriod } from '@/lib/hours/openingHours'
import { updateSpaceFields, setSpaceActive, type SpaceFieldsInput } from './actions'

interface SpaceFieldsFormProps {
  spaceId: string
  slug: string
  initialName: string
  initialCategory: string
  initialCountry: string
  initialDistrict: string
  initialAddress: string | null
  initialPhone: string | null
  initialWebsite: string | null
  initialPriceLevel: number | null
  initialOpeningHours: OpeningHours | null
  initialActive: boolean
}

interface DayRow {
  day: number
  closed: boolean
  open24h: boolean
  openTime: string
  closeTime: string
}

function buildDayRows(openingHours: OpeningHours | null): DayRow[] {
  const byDay = new Map<number, OpeningPeriod>()
  for (const period of openingHours?.periods ?? []) {
    byDay.set(period.open.day, period)
  }
  return WEEK_DISPLAY_ORDER.map((day) => {
    const period = byDay.get(day)
    if (!period) return { day, closed: true, open24h: false, openTime: '09:00', closeTime: '18:00' }
    if (!period.close) return { day, closed: false, open24h: true, openTime: '00:00', closeTime: '00:00' }
    return {
      day,
      closed: false,
      open24h: false,
      openTime: `${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`,
      closeTime: `${period.close.time.slice(0, 2)}:${period.close.time.slice(2)}`,
    }
  })
}

function rowsToOpeningHours(rows: DayRow[]): OpeningHours | null {
  const periods: OpeningPeriod[] = []
  for (const row of rows) {
    if (row.closed) continue
    if (row.open24h) {
      periods.push({ open: { day: row.day, time: '0000' }, close: null })
      continue
    }
    periods.push({
      // Same-day close only — an overnight-crossing schedule (close after
      // midnight, where Google's own data would set close.day to the next
      // day) isn't representable by this simple per-day editor. Rare enough
      // among cafés/coworkings that it's an accepted limitation for this
      // pass; edit the raw jsonb column directly for that case.
      open: { day: row.day, time: row.openTime.replace(':', '') },
      close: { day: row.day, time: row.closeTime.replace(':', '') },
    })
  }
  return periods.length > 0 ? { periods } : null
}

export function SpaceFieldsForm({
  spaceId,
  slug,
  initialName,
  initialCategory,
  initialCountry,
  initialDistrict,
  initialAddress,
  initialPhone,
  initialWebsite,
  initialPriceLevel,
  initialOpeningHours,
  initialActive,
}: SpaceFieldsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState(initialCategory)
  const [country, setCountry] = useState(initialCountry)
  const [district, setDistrict] = useState(initialDistrict)
  const [address, setAddress] = useState(initialAddress ?? '')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [website, setWebsite] = useState(initialWebsite ?? '')
  const [priceLevel, setPriceLevel] = useState(initialPriceLevel != null ? String(initialPriceLevel) : '')
  const [days, setDays] = useState<DayRow[]>(() => buildDayRows(initialOpeningHours))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingActive, setTogglingActive] = useState(false)

  function updateDay(day: number, patch: Partial<DayRow>) {
    setDays((current) => current.map((row) => (row.day === day ? { ...row, ...patch } : row)))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const fields: SpaceFieldsInput = {
        name,
        category,
        country,
        district,
        address: address || null,
        phone: phone || null,
        website: website || null,
        priceLevel: priceLevel === '' ? null : Number(priceLevel),
        openingHours: rowsToOpeningHours(days),
      }
      await updateSpaceFields(spaceId, slug, fields)
      setSaved(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    const next = !initialActive
    if (initialActive && !confirm('¿Desactivar este espacio? Dejará de mostrarse en el sitio público.')) return
    setTogglingActive(true)
    try {
      await setSpaceActive(spaceId, slug, next)
      router.refresh()
    } catch {
      setError('No se pudo actualizar el estado. Intenta de nuevo.')
    } finally {
      setTogglingActive(false)
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Nombre</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Categoría</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">País</label>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Distrito</label>
          <input
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Dirección</label>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Teléfono</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Sitio web</label>
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>
          <div className="flex w-28 flex-none flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Precio (0-4)</label>
            <input
              type="number"
              min={0}
              max={4}
              value={priceLevel}
              onChange={(event) => setPriceLevel(event.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>
        </div>

        <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Horario</h2>
        <div className="flex flex-col gap-2">
          {days.map((row) => (
            <div
              key={row.day}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
            >
              <span className="w-24 flex-none font-medium">{DAY_LABELS[row.day]}</span>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(event) => updateDay(row.day, { closed: event.target.checked })}
                  className="h-4 w-4 accent-black"
                />
                Cerrado
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={row.open24h}
                  disabled={row.closed}
                  onChange={(event) => updateDay(row.day, { open24h: event.target.checked })}
                  className="h-4 w-4 accent-black"
                />
                24 horas
              </label>
              <input
                type="time"
                value={row.openTime}
                disabled={row.closed || row.open24h}
                onChange={(event) => updateDay(row.day, { openTime: event.target.value })}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={row.closeTime}
                disabled={row.closed || row.open24h}
                onChange={(event) => updateDay(row.day, { closeTime: event.target.value })}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saved && <p className="text-sm text-green-700">Guardado.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={togglingActive}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
            initialActive
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'border border-green-200 text-green-700 hover:bg-green-50'
          }`}
        >
          {togglingActive ? 'Actualizando...' : initialActive ? 'Eliminar espacio' : 'Reactivar espacio'}
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Wire the form into the per-space admin page**

Replace `app/admin/espacios/[slug]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation'
import { getSpaceBySlugAdmin } from '@/lib/data/adminSpaces'
import { SpaceFieldsForm } from './SpaceFieldsForm'
import { VerificationForm } from './VerificationForm'
import { AmenitiesEditorForm } from './AmenitiesEditorForm'

export const dynamic = 'force-dynamic'

interface AdminSpacePageProps {
  params: { slug: string }
}

export default async function AdminSpacePage({ params }: AdminSpacePageProps) {
  const space = await getSpaceBySlugAdmin(params.slug)
  if (!space) notFound()

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
      {!space.active && (
        <span className="mt-2 inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
          Desactivado
        </span>
      )}
      <SpaceFieldsForm
        spaceId={space.id}
        slug={space.slug}
        initialName={space.name}
        initialCategory={space.category}
        initialCountry={space.country}
        initialDistrict={space.district}
        initialAddress={space.address}
        initialPhone={space.phone}
        initialWebsite={space.website}
        initialPriceLevel={space.price_level}
        initialOpeningHours={space.opening_hours}
        initialActive={space.active}
      />
      <VerificationForm
        spaceId={space.id}
        slug={space.slug}
        initialVerified={space.verified}
        initialVerifiedAmenities={space.verified_amenities}
      />
      <AmenitiesEditorForm spaceId={space.id} slug={space.slug} initialAmenities={space.amenities} />
    </div>
  )
}
```

(Switching `getSpaceBySlug` → `getSpaceBySlugAdmin` here matters: without it, opening a deactivated
space's edit page would 404, since the public fetcher filters `active = true` — making "Reactivar"
unreachable.)

- [ ] **Step 4: Update the list page — "Agregar espacio" button, show inactive spaces, badge**

Replace `app/admin/espacios/page.tsx` with:

```tsx
import Link from 'next/link'
import { listAllSpacesAdmin } from '@/lib/data/adminSpaces'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

export default async function AdminEspaciosPage() {
  const spaces = await listAllSpacesAdmin()
  const activeCount = spaces.filter((space) => space.active).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Espacios</h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeCount} espacios activos · {spaces.length} en total
          </p>
        </div>
        <Link
          href="/admin/espacios/nuevo"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
        >
          Agregar espacio
        </Link>
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              href={`/admin/espacios/${space.slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm hover:border-black"
            >
              <span>
                {space.name}
                <span className="ml-2 text-gray-400">{districtLabel(space.district)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                {!space.active && (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    Desactivado
                  </span>
                )}
                <span
                  className={
                    space.verified
                      ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                      : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500'
                  }
                >
                  {space.verified ? 'Verificado' : 'Sin verificar'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, log in as admin:
1. Visit `/admin/espacios` — confirm "Agregar espacio" is there and links to `/admin/espacios/nuevo`.
2. Open a real space's edit page — change its name, tweak one day's hours, save, reload, confirm it
   persisted.
3. Click "Eliminar espacio" — confirm the browser confirmation appears, accept it, confirm the badge
   flips to "Desactivado" and the space disappears from `/near-me`'s public listing (or at least from
   a fresh `listSpaces()` call — the public site's ISR/cache may lag).
4. Back on `/admin/espacios`, confirm the deactivated space still shows (with the red badge) and
   clicking into it offers "Reactivar espacio"; click it, confirm the space is active again.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/espacios/[slug]/actions.ts" "app/admin/espacios/[slug]/SpaceFieldsForm.tsx" "app/admin/espacios/[slug]/page.tsx" app/admin/espacios/page.tsx
git commit -m "feat: full-field space editing, opening hours editor, and soft delete"
```

---

### Task 6: Photo upload widget

**Files:**
- Modify: `app/admin/espacios/[slug]/actions.ts`
- Modify: `app/admin/espacios/[slug]/SpaceFieldsForm.tsx`
- Modify: `app/admin/espacios/[slug]/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `createAdminSupabaseClient` (already exists), the
  `SpaceFieldsForm` component from Task 5 (this task adds props/state to it, doesn't replace it).
- Produces: `uploadSpacePhoto(spaceId, slug, formData): Promise<SpacePhoto[]>`,
  `removeSpacePhoto(spaceId, slug, photoUrl): Promise<SpacePhoto[]>` — nothing later in this plan
  consumes these.

**Design note:** manually uploaded photos are stored with `width: 0, height: 0` (the browser
`<input type="file">` doesn't give pixel dimensions without decoding the image client-side first, and
nothing in this codebase actually reads a photo's `width`/`height` for layout — every consumer just
does `<img src={photo.url} className="object-cover" />` inside a fixed-size container). This is an
accepted simplification, not an oversight.

No automated test — matches the existing untested server-action pattern. Manual verification in
Step 4.

- [ ] **Step 1: Add the two photo server actions**

In `app/admin/espacios/[slug]/actions.ts`, add this import alongside the existing ones:

```ts
import type { SpacePhoto } from '@/lib/data/spaceTypes'
```

Then add these two functions at the end of the file, after `setSpaceActive`:

```ts
const PHOTO_BUCKET = 'space-photos'

export async function uploadSpacePhoto(spaceId: string, slug: string, formData: FormData): Promise<SpacePhoto[]> {
  await requireAdmin()

  const file = formData.get('file')
  if (!(file instanceof File)) throw new Error('Archivo inválido')

  const admin = createAdminSupabaseClient()
  const { data: space, error: fetchError } = await admin.from('spaces').select('photos').eq('id', spaceId).single()
  if (fetchError) throw new Error(`No se pudo leer el espacio: ${fetchError.message}`)

  const extension = file.name.split('.').pop() || 'jpg'
  const path = `${slug}/manual-${Date.now()}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: true })
  if (uploadError) throw new Error(`No se pudo subir la foto: ${uploadError.message}`)

  const { data: publicUrlData } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  const currentPhotos = (space?.photos ?? []) as SpacePhoto[]
  const nextPhotos: SpacePhoto[] = [...currentPhotos, { url: publicUrlData.publicUrl, width: 0, height: 0 }]

  const { error: updateError } = await admin.from('spaces').update({ photos: nextPhotos }).eq('id', spaceId)
  if (updateError) throw new Error(`No se pudo guardar la foto: ${updateError.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
  return nextPhotos
}

export async function removeSpacePhoto(spaceId: string, slug: string, photoUrl: string): Promise<SpacePhoto[]> {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { data: space, error: fetchError } = await admin.from('spaces').select('photos').eq('id', spaceId).single()
  if (fetchError) throw new Error(`No se pudo leer el espacio: ${fetchError.message}`)

  const currentPhotos = (space?.photos ?? []) as SpacePhoto[]
  const nextPhotos = currentPhotos.filter((photo) => photo.url !== photoUrl)

  const { error: updateError } = await admin.from('spaces').update({ photos: nextPhotos }).eq('id', spaceId)
  if (updateError) throw new Error(`No se pudo quitar la foto: ${updateError.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
  return nextPhotos
}
```

- [ ] **Step 2: Add the photos section to `SpaceFieldsForm.tsx`**

In `app/admin/espacios/[slug]/SpaceFieldsForm.tsx`:

Change the import line:

```ts
import { updateSpaceFields, setSpaceActive, type SpaceFieldsInput } from './actions'
```

to:

```ts
import { updateSpaceFields, setSpaceActive, uploadSpacePhoto, removeSpacePhoto, type SpaceFieldsInput } from './actions'
import type { SpacePhoto } from '@/lib/data/spaceTypes'
import type { ChangeEvent } from 'react'
```

Add `initialPhotos: SpacePhoto[]` to the `SpaceFieldsFormProps` interface, and add `initialPhotos` to
the function's destructured props.

Add this state, alongside the existing `useState` calls:

```ts
const [photos, setPhotos] = useState<SpacePhoto[]>(initialPhotos)
const [uploadingPhoto, setUploadingPhoto] = useState(false)
```

Add these two handlers, alongside `handleSave`/`handleToggleActive`:

```ts
async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  setUploadingPhoto(true)
  setError(null)
  try {
    const formData = new FormData()
    formData.append('file', file)
    const nextPhotos = await uploadSpacePhoto(spaceId, slug, formData)
    setPhotos(nextPhotos)
  } catch {
    setError('No se pudo subir la foto. Intenta de nuevo.')
  } finally {
    setUploadingPhoto(false)
  }
}

async function handlePhotoRemove(url: string) {
  setError(null)
  try {
    const nextPhotos = await removeSpacePhoto(spaceId, slug, url)
    setPhotos(nextPhotos)
  } catch {
    setError('No se pudo quitar la foto. Intenta de nuevo.')
  }
}
```

Add this section to the JSX, right after the closing `</div>` of the "Horario" `days.map(...)` block
and before the "Guardar cambios" button's wrapping `<div>`:

```tsx
<h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Fotos</h2>
<div className="flex flex-wrap gap-3">
  {photos
    .filter((photo) => photo.url)
    .map((photo) => (
      <div key={photo.url} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => handlePhotoRemove(photo.url as string)}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          ×
        </button>
      </div>
    ))}
  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-500 hover:border-black">
    {uploadingPhoto ? 'Subiendo...' : '+ Subir foto'}
    <input
      type="file"
      accept="image/*"
      onChange={handlePhotoUpload}
      disabled={uploadingPhoto}
      className="hidden"
    />
  </label>
</div>
```

- [ ] **Step 3: Pass `initialPhotos` from the page**

In `app/admin/espacios/[slug]/page.tsx`, add this prop to the existing `<SpaceFieldsForm ...>` call
(alongside `initialActive={space.active}`):

```tsx
initialPhotos={space.photos ?? []}
```

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must be clean. Then `npm run dev`, log in as admin, open a
space's edit page, upload a real image file, confirm it appears in the grid immediately; hover it and
click the × to remove it, confirm it disappears; reload the page and confirm the change persisted
(both upload and removal).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/espacios/[slug]/actions.ts" "app/admin/espacios/[slug]/SpaceFieldsForm.tsx" "app/admin/espacios/[slug]/page.tsx"
git commit -m "feat: add photo upload widget to the space edit form"
```

---

### Task 7: Full regression pass and deploy

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean)

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass, including `lib/places/googlePlaces.test.ts` from Task 3

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds with no type/lint errors

- [ ] **Step 4: Push**

```bash
git push aittrocom main
```

Expected: push succeeds; Vercel's Git integration on `aittrocom-blip/workcofy` picks it up and starts
a new Production deployment automatically.
