# Workcofy — "Espacios" Page Shell (List-First Dashboard) — Design Spec

Date: 2026-09-02
Status: Approved by user (architecture + shell sections, in-chat), pending spec self-review sign-off

## 1. Concept & scope

The user supplied a 24-section brief plus a mockup image for a redesigned "Espacios" page. The two
references described incompatible page structures: the brief's own layout diagram matches what
`/near-me` already does today (map-first, full-screen) — a fairly recent, deliberate redesign (see
`docs/superpowers/specs/2026-08-29-workcofy-explorar-sidebar-redesign-design.md`). The mockup shows
something else entirely: a list-first dashboard (stat tiles, a recommendations carousel, a tabbed
category list, a small secondary map panel, trending/partner widgets). The user chose the mockup as
the real reference, replacing `/near-me`'s current default view.

This is the first of four sub-projects identified during brainstorming (§6 for the rest):

1. **This spec — the page shell.** The new list-first layout, replacing what `/near-me` shows by
   default, with a "Mapa" toggle back to the existing full-screen map experience (nothing about that
   experience changes — it becomes a second view mode of the same page instead of the only one).
2. **Quick view redesign** (deferred) — the map-selected space preview card, per the brief's §8-16.
3. **Filters & categories** (deferred) — singular category labels, the Wi-Fi/Enchufes/etc. filter
   row, "Más filtros" expander (brief §5-7). Also folds in the earlier, separately-queued "remove
   Todos, allow multi-select categories" request, since both touch the same chip row.
4. **Community check-ins** (deferred) — "Antonella y 8 personas estuvieron aquí", "Ya estuve aquí".
   A real new feature (data model + write path), not reusable from anything that exists today —
   the closest existing thing, `lib/mockUsers.ts`/`CommunityPreview.tsx`, is explicitly
   illustrative-only mock data, never real visits.

### Key architectural decision: two view modes, not a rebuild

`/near-me` currently always renders `<DiscoveryView fullScreen>` (`app/near-me/page.tsx`). This spec
adds a `?view=` query param: absent or `list` (default) renders the new dashboard shell; `map` renders
the exact same `<DiscoveryView fullScreen>` unchanged. The mockup's "Mapa" button (top-right of the
header) sets `?view=map`; that view's own header can set `?view=list` (or just remove the param) to
come back. **Nothing about the existing full-screen map experience is touched, rebuilt, or at risk in
this spec** — it's reused as-is behind a toggle instead of always being the only option.

## 2. Data reused, not rebuilt

- **"Recomendados para ti"**: reuses `selectNearbyPopularSpaces()` (`lib/discovery/
  selectNearbyPopularSpaces.ts`) verbatim — already ranks by real distance then real `view_count`, no
  new algorithm. The subtitle copy is adjusted from the brief's "Basado en tus preferencias" to
  something honest ("Cerca de ti y populares en la comunidad") since there's no real preference
  signal yet — inventing personalization copy that isn't backed by anything is worse than not
  claiming it.
- **List rows**: reuses `CompactSpaceRow` (`components/discovery/CompactSpaceRow.tsx`) as-is — it
  already renders exactly the thumbnail/name/category/rating/score/status/price row shape the
  mockup wants, currently used in the favorites panel and the full-screen map's popular-nearby
  sidebar. Clicking a row navigates to `/spaces/[slug]` (the existing login-gated ficha route) —
  this spec does **not** build a quick-view popup; that's sub-project 2.
- **Small map panel**: reuses `MapView` (`components/map/MapView.tsx`) at a reduced size, fed the
  same marker-building logic `DiscoveryView` already has (extracted into a new shared hook, §3).
- **Sorting**: reuses `sortSpaces()` (`lib/filters/sortSpaces.ts`).
- **Category tabs**: reuses `CATEGORY_OPTIONS` (`lib/categories.ts`) as-is — labels are already
  singular ("Café", "Work Café", ...), so no wording change needed here; sub-project 3 owns any
  further category-chip rework (the multi-select request).

## 3. New shared hook (small refactor while touching this code)

`DiscoveryView.tsx` computes `distanceKm` per space inline (a `useMemo` mapping `spaces` against
`useUserLocation()`'s coordinate). The new dashboard needs the exact same computation to feed
`selectNearbyPopularSpaces()` and the small map. Rather than duplicate ~10 lines, extract:

```ts
// lib/hooks/useSpacesWithDistance.ts
export function useSpacesWithDistance(spaces: SpaceRecord[]): SpaceWithDistance[]
```

`DiscoveryView.tsx` is updated to call this hook instead of its inline `useMemo` (behavior-identical,
confirmed by its existing usage staying byte-for-byte the same result) — the only file this spec
touches outside the new components.

## 4. Page structure

- `app/near-me/page.tsx` (modified) — reads `searchParams.view`. When `'map'`, renders
  `<DiscoveryView fullScreen ... />` exactly as today. Otherwise renders the new
  `<EspaciosDashboard spaces={spaces} isAdmin={isAdmin} />`. `isAdmin` is resolved server-side here
  (a new small helper reading the session + `profiles.is_admin`, mirroring the check already in
  `middleware.ts`) and passed down as a plain boolean — the dashboard needs it only to decide whether
  to render the "Agregar espacio" button, never for anything security-sensitive (the actual
  `/admin/espacios/nuevo` route stays middleware-gated regardless).
- `components/discovery/EspaciosDashboard.tsx` (new, `'use client'`) — the shell itself, composed of
  the sections below. Owns the "Mapa" toggle button (a `Link` to `?view=map`).

### 4.1 Header

Title "Espacios", subtitle, "Agregar espacio" (black pill, only when `isAdmin`, links to
`/admin/espacios/nuevo` — the exact route the already-written admin dashboard plan builds; this spec
does not duplicate that flow), "Mapa" toggle (black pill, sets `?view=map`).

### 4.2 Stat tiles

Four numbers, each a real `count()`/aggregate against the already-fetched `spaces` prop (client-side
reduce — no new server queries, `spaces` is already the full active list `app/near-me/page.tsx`
fetches today): total count, verified count, `%` with `rating != null && rating >= 4` ("recomendado"
proxy — the brief's "% usuarios recomiendan" implies real review sentiment that doesn't exist;
rating≥4 is the closest honest proxy available today), and the single district with the most spaces
in the current result set ("ubicación más popular"). No chart, no time-series, matching the same
"basic metrics, no fast-follow" scope call already made for the admin dashboard's stat tiles.

### 4.3 Recomendados para ti

Horizontal scroll of up to 8 `SpaceCard`s (reusing the existing card component, already handles
photo/rating/score/open-status/login-gated "Ver espacio") from `selectNearbyPopularSpaces()`.

### 4.4 Explora espacios

Category tabs (`CATEGORY_OPTIONS`, query-param driven — `?category=`, single-select, matching
today's behavior; sub-project 3 owns multi-select) + a sort dropdown (reusing `SortDropdown`) + a
list of `CompactSpaceRow`s for the filtered/sorted set. A "Ver más espacios" button paginates
client-side (reveals the next batch of already-fetched rows — no new pagination API, matching how
`spaces` is already fetched as one list server-side today).

### 4.5 Side panel

- Small `MapView` (reduced height, e.g. `320px`) showing the same filtered spaces' markers, using the
  shared marker-building logic. A "Ver todos en el mapa" link sets `?view=map`.
- "Tipos de espacios" — a count per category (client-side reduce over `spaces`, same data as §4.2).
- "¿Tienes un espacio?" partner card — static, **disabled** button labeled "Próximamente" (confirmed
  with user — no real destination exists until the Partners sub-project is designed), same visual
  pattern already used elsewhere for not-yet-built actions.
- "Tendencias esta semana" — **not built in this spec** (§1, deferred to sub-project 4 — needs real
  check-in data this codebase doesn't have yet). The side panel simply omits this widget for now
  rather than faking it with `view_count`-based stand-ins presented as trends.

## 5. Responsive behavior

Per the brief's own §23 (not contradicted by the mockup, which is a desktop screenshot only):
desktop gets the full shell above; mobile collapses to search + horizontal category chips + the list
(stat tiles, recomendados carousel, and the side panel's widgets stack below the list rather than
disappearing — nothing in the brief says to hide them on mobile, just that the desktop two-column
layout doesn't try to survive unchanged). The small map panel moves to the bottom of the stack on
mobile, below the list, rather than floating beside it.

## 6. Testing

No new automated tests — this is a composition of already-tested/already-manually-verified pieces
(`selectNearbyPopularSpaces` has its own tests; `CompactSpaceRow`, `SpaceCard`, `MapView` are
presentational, already unquestioned in the existing full-screen page). The one new pure function,
`useSpacesWithDistance`, is a hook (not easily unit-testable in isolation without a React test
harness this repo doesn't have set up) — verified by confirming `DiscoveryView`'s existing behavior
is unchanged after the extraction (manual check, not a new test file).

## 7. Explicitly out of scope for this spec

- Quick view card redesign, filters/categories redesign, community check-ins — separate sub-projects
  (§1).
- Real "Recomendados" personalization (favorites/preference-based ranking) — flagged as future work,
  not built now; current copy is written to be honest about what's actually driving the list.
- "Tendencias esta semana" — needs check-in data (sub-project 4).
- Real Workcofy Partners flow — the CTA card stays inert.
- Any change to `DiscoveryFilterState`, `FiltersBar`, or the full-screen map experience itself.

## 8. Migration / rollout note

No DB migration. No new tables. The only genuinely new file-level artifact is
`lib/hooks/useSpacesWithDistance.ts` (extracted from existing inline logic) and the new
`EspaciosDashboard.tsx` tree — everything else is composition of already-shipped components.
