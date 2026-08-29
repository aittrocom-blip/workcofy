# Workcofy — Explorar Sidebar Redesign (Logged-in Desktop) — Design Spec

Date: 2026-08-29
Status: Approved by user, pending spec self-review sign-off

## 1. Concept & scope

Today `/near-me` already renders `DiscoveryView` in `fullScreen` mode — a map-first layout with no
hero, filters floating over the map. But the global `Header`/`Footer` (rendered in
`app/layout.tsx`, wrapping every route) still sit on top of it, and clicking a pin opens a large
slide-over panel that covers much of the map. This redesign replaces that top navbar with a **left
sidebar** for logged-in desktop users on `/near-me`, and reworks the map's own floating controls
and pin/card treatment to feel like a dedicated map app rather than a website with a map embedded
in it.

Reference: a user-provided mockup (image, not literal spec) plus a detailed 23-point written brief.
Neither is copied literally — used for structure, hierarchy, and intent, reconciled against what
already exists in this codebase (see the exploration findings folded into each section below).

**Scope boundary — desktop only.** This phase covers `/near-me` on desktop for logged-in users only.
Mobile/tablet keeps its current behavior (Header with hamburger menu, filters docked to the bottom
of the screen) completely unchanged. A responsive sidebar treatment (collapsed sidebar / hamburger /
bottom navigation) is explicitly deferred to a future phase. Logged-out users see `/near-me` exactly
as it renders today, on every screen size. Every other route (`/`, `/spaces/[slug]`, `/perfil`,
`/favoritos`, district pages, etc.) is untouched — the global `Header`/`Footer` keep rendering there
for everyone, same as today.

### Explicitly deferred (out of scope for this phase)

- Mobile/tablet responsive redesign of the sidebar (collapsed sidebar, hamburger, bottom nav).
- Real `/equipos`, `/eventos`, `/comunidad` features — these stay marketing-only homepage sections;
  the sidebar's nav entries for them are disabled placeholders, not new pages.
- A dedicated `/rewards` page — the sidebar's Rewards nav entry links to the existing `/perfil`
  Rewards panel built in the prior phase.
- Changing how `verified` is visually communicated on pins (stays yellow disc, unchanged).

## 2. Layout architecture

### 2.1 `AppShell` — the routing/auth switch

`app/layout.tsx` currently renders `<Header /><main>{children}</main><Footer />` unconditionally
for every route (confirmed: no per-route branching exists there today). A new client component,
`components/layout/AppShell.tsx`, replaces that block:

```tsx
'use client'
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuthUser()
  const showSidebarLayout = pathname === '/near-me' && !loading && user !== null

  if (showSidebarLayout) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

While `loading` is true (auth state not yet resolved), the condition is false, so the default
`Header`/`Footer` branch renders — the safe default, avoiding a layout flash where the sidebar
briefly appears before we know the user isn't logged in (or vice versa). This exactly mirrors how
`HeaderAuthLinks` already treats its own `loaded` flag.

`app/layout.tsx` becomes:

```tsx
<FavoritesProvider>
  <AppShell>{children}</AppShell>
</FavoritesProvider>
```

### 2.2 Shared `useAuthUser` hook (small refactor, in scope)

The "fetch the current user, subscribe to auth changes, expose a signOut" logic is about to exist
in a third place (`HeaderAuthLinks`, `RewardsBadge`'s partial version, and now `AppShell` +
`Sidebar`'s avatar menu). Extracted once, reused everywhere:

```ts
// lib/hooks/useAuthUser.ts
'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
  }

  return { user, loading, signOut }
}
```

`HeaderAuthLinks.tsx` is refactored to call this hook instead of its own inline `useState`/
`useEffect` copy (its `handleSignOut` becomes `await signOut(); router.push('/'); router.refresh()`
— the router calls stay local since the hook has no router dependency). Behavior is unchanged;
this is a pure de-duplication, not a UX change.

## 3. `Sidebar` component

`components/layout/Sidebar.tsx`, 280px fixed width, white background, full height
(`h-screen flex flex-col`), only ever rendered by `AppShell` (so it never needs its own
route/auth guard).

**Top:** Workcofy logo (reuse whatever `Header.tsx` currently uses for the wordmark).

**Nav** (below the logo): five items, `flex flex-col gap-1`, each `flex items-center gap-2 rounded-xl px-3 py-2.5`:
- **Explorar** → always the active item on this page (this sidebar only ever renders on
  `/near-me`). Active styling: `bg-workcofy-yellow/15 font-semibold text-workcofy-black`.
- **Equipos**, **Eventos**, **Comunidad** → disabled, `title="Próximamente"`,
  `cursor-not-allowed text-gray-300`, exactly mirroring `FiltersBar.tsx`'s existing
  `TILE_MORE.map(...)` treatment for inactive category chips (same establish pattern, different
  container).
- **Rewards** → a real `<Link href="/perfil">`, normal nav-item styling (`text-gray-700
  hover:bg-gray-50`), not disabled.

**Bottom section** (pinned via `mt-auto`):
- Rewards balance: reuses `RewardsBadge`'s data-fetching (same `reward_events` query +
  `workcofy:reward-earned` listener), rendered larger — icon at `h-[1.3em]` relative sizing (~30%
  bigger than the header's current `h-3.5 w-3.5`, i.e. roughly `h-[18px] w-[18px]`) stacked above a
  bold number, per the brief's vertical "🪙 / 120 / W Coins→Rewards" layout. Implemented as a new
  small presentational variant, not a second copy of the balance-fetch logic — `RewardsBadge`
  gains an optional `size?: 'sm' | 'lg'` prop (default `'sm'`, current header behavior unchanged)
  that swaps icon size and stacks icon-above-number instead of side-by-side when `'lg'`.
- Avatar (see §4) — circular, `h-11 w-11`, click opens the avatar menu (see §5). Two distinct
  avatar surfaces exist and must not be confused: the first-time **picker modal** (§4.3) appears
  automatically, unprompted, the moment `Sidebar` mounts and finds `avatar_id` is `null` — no click
  needed. The **avatar menu** (§5, Favoritos/Perfil/Cerrar sesión) is the click-triggered popover,
  relevant every time after an avatar is already set.

## 4. Avatar system (new)

### 4.1 Data model

```sql
alter table profiles add column if not exists avatar_id text;
```

Nullable — `null` means "hasn't picked one yet." No FK/enum constraint at the DB level (keeps this
migration trivial); validity is enforced at the application layer against a fixed, small option set.

### 4.2 Avatar catalog

**Update after this spec was approved:** the user supplied 7 real character images
(`media/avatares/*.png`) and a designated default (`explorador-default`) before implementation
started — see the implementation plan for the exact final catalog (real artwork, not the
CSS-tinted Worky placeholders originally sketched below). The mechanism (a small fixed option set
in `lib/avatars.ts`, referenced only from there) is unchanged.

```ts
// lib/avatars.ts
export interface AvatarOption {
  id: string
  src: string
  label: string
}

// Placeholder set: Worky, recolored, until real character art is ready.
// Swapping to real art later means editing only this file — no other
// code (the picker modal, the sidebar, the DB column) changes.
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'worky-yellow', src: '/icons/worky-location.png', label: 'Worky amarillo' },
  { id: 'worky-blue', src: '/icons/worky-location.png', label: 'Worky azul' },
  { id: 'worky-green', src: '/icons/worky-location.png', label: 'Worky verde' },
  { id: 'worky-pink', src: '/icons/worky-location.png', label: 'Worky rosa' },
]

export function avatarSrcFor(avatarId: string | null): string {
  return AVATAR_OPTIONS.find((option) => option.id === avatarId)?.src ?? AVATAR_OPTIONS[0].src
}
```

(The three non-default entries reuse the same source image with a CSS filter/tint applied at
render time — e.g. `hue-rotate` — rather than needing four distinct image files up front, purely
as a placeholder differentiation mechanism until real art exists.)

### 4.3 Selection flow

`Sidebar` fetches the logged-in user's `profiles.avatar_id` (client-side query, RLS already scopes
reads to `auth.uid() = id` per the existing `profiles` policy — no new RLS needed, `avatar_id` is
just another selectable column on a row the user can already read). If `null`, render
`components/account/AvatarPickerModal.tsx` — a simple centered modal, 4 large tappable circles from
`AVATAR_OPTIONS`, no "skip" option (brief implies this is a one-time required choice on first
entry). On pick, `update profiles set avatar_id = $1 where id = auth.uid()` (needs a
column-level grant, same defense-in-depth pattern as `name`/`country`/`city`: extend the existing
`grant update (...) on profiles to authenticated` list from `0009_profiles_update_policy.sql` to
include `avatar_id`).

## 5. Avatar menu (floating popover)

`components/layout/AvatarMenu.tsx`, opened by clicking the Sidebar's avatar circle. Positioned via
a small absolutely-positioned panel anchored to the avatar (`absolute left-full ml-2 bottom-0` or
similar, opening rightward over the map per the brief's mockup), closed on outside-click or
`Escape`. Content — reusing `useAuthUser()`'s `user`/`signOut`, structurally identical to what
`HeaderAuthLinks` already renders when logged in, minus the always-visible email line (brief
explicitly says email should not show permanently, and the mockup's menu doesn't include it
either):

- Favoritos → `/favoritos`
- Perfil → `/perfil`
- divider
- Cerrar sesión → red text (`text-red-600`), calls `signOut()` then redirects to `/`.

## 6. Map floating controls

All changes below are scoped to `DiscoveryView.tsx`'s existing `fullScreen` branch — the
non-fullScreen branch (district pages, etc.) is untouched.

### 6.1 Search + category filters — re-enabled, not rebuilt

The existing `DraggableFloatingBar`-wrapped `FiltersBar` in the `fullScreen` branch already renders
as a floating, rounded, shadowed card in the upper area of the map — it currently passes
`hideSearch hideLocationFilters`, suppressing the search input and the country/district chips.
This phase flips `hideSearch` off (`hideLocationFilters` stays on — city/district picking doesn't
fit a "you're already looking at the map near you" experience) so the search input and the
category-chip row render inside the same floating card, matching the brief's "search bar + quick
category filters" ask without introducing a second, competing floating element. The existing
drag-to-reposition behavior (an established, deliberate UX choice from earlier this session) is
kept as-is — not replaced with a fixed-position bar.

### 6.2 "Lista" toggle (new)

A new floating pill button, top-right of the map (next to where the location button lands, §6.3),
toggling local state `viewMode: 'map' | 'list'` in `DiscoveryView`. When `'list'`, a panel slides
in from the left (`w-full max-w-md`, same slide-transition idiom already used for the space-detail
panel) rendering the **existing** `SpaceList` component (already used in non-fullScreen mode,
reused here as-is — `spaces={filtered} selectedId={selectedId} onSelect={setSelectedId}
origin={...}`) over the map. Re-clicking "Lista" (now labeled/iconified as "Mapa") returns to
`viewMode: 'map'`. No new list-rendering component needed.

### 6.3 "Mi ubicación" button (new)

A circular floating button near the zoom controls, calling the existing `requestLocation` (from
`useUserLocation()`, already destructured in `DiscoveryView`) — today only reachable via the
"Cerca de mí" chip inside `FiltersBar`. This adds a direct, always-visible shortcut matching the
brief's dedicated location button, without removing the existing chip.

### 6.4 Zoom controls (new, shared between both map backends)

Google's `<Map>` (via `@vis.gl/react-google-maps`) already renders its own default zoom UI, and
MapLibre (`MockMapAdapter`) currently renders none (confirmed: no `NavigationControl` is added
today). Rather than rely on two visually-inconsistent native control sets, both adapters expose an
imperative zoom handle via `forwardRef`:

```ts
// lib/map/types.ts — add to the existing file
export interface MapViewHandle {
  zoomIn: () => void
  zoomOut: () => void
}
```

`GoogleMapAdapter` forwards a ref implementing this by calling `map.setZoom(map.getZoom() + 1)` /
`- 1` on the underlying Google map instance (already reachable via `useMap()`, already imported).
`MockMapAdapter` implements it via `mapRef.current?.zoomIn()` / `zoomOut()` (MapLibre's own map
instance already exposes these methods natively). `MapView.tsx` (the adapter-selecting wrapper)
forwards the ref through to whichever adapter is active. `DiscoveryView`'s `fullScreen` branch
renders one new small component, `components/map/MapZoomControls.tsx` — two stacked rounded
buttons (`+`/`−`), floating on the map's right edge, calling `mapRef.current?.zoomIn()`/`zoomOut()`
via a ref passed down to `<MapView ref={mapRef} ... />`. Google's own default zoom UI is disabled
(`disableDefaultUI` or the specific zoom-control flag on `<GoogleMap>`) once this custom control
exists, so there's exactly one zoom UI on screen, styled consistently across both backends.

## 7. Map markers — photo pins + favorite indicator

### 7.1 Data flow

`MapMarkerData` (`lib/map/types.ts`) gains two fields:

```ts
export interface MapMarkerData {
  id: string
  position: { lat: number; lng: number }
  label: string
  verified: boolean
  photoUrl: string | null
  favorited: boolean
}
```

`DiscoveryView.tsx`'s existing `markers` array (built from `filtered`, currently mapping
`{id, position, label, verified}`) gains `photoUrl: space.photos?.[0]?.url ?? null` and
`favorited: isFavorited(space.id)`, the latter sourced from the already-existing
`useFavorites()` context (`FavoritesProvider`, mounted at the root layout — no new provider
wiring needed, `DiscoveryView` just calls the hook).

### 7.2 Rendering

Both `GoogleMapAdapter` and `MockMapAdapter`'s marker element changes from "Workcofy isotype inside
a colored disc" to: a circular photo (`background-image: url(photoUrl)` or an `<img>` clipped
`rounded-full`, `object-cover`) with a border — **yellow border when `verified`, transparent/gray
otherwise** (verified keeps its existing sole meaning: no new overload). Falls back to the current
isotype-in-disc treatment when `photoUrl` is null (not every space has a photo). A small heart
badge (reusing the existing `FavoriteButton`'s `HeartIcon` SVG, not the full interactive
`FavoriteButton` component — the pin itself isn't a click target for favoriting, only for opening
the space) renders in the pin's bottom-right corner, filled red, only when `favorited` is true;
nothing renders there otherwise (no empty outline heart cluttering every unfavorited pin).

## 8. Space card on marker click

`fullScreen`'s current behavior (large slide-over `SpaceDetailPanel` from the right, §"Selected
space's details" in `DiscoveryView.tsx`) is replaced with the **same lightweight floating
`SpaceCard`** already used in the non-fullScreen branch today
(`DiscoveryView.tsx:285-296` — `absolute inset-0 ... items-end justify-end`, a `w-80` `SpaceCard`
bottom-right over the map). The `fullScreen` branch's selected-space block changes from the
`translate-x-full`/slide-over `<div>` to this same bottom-right-floating pattern. `SpaceDetailPanel`
itself is not deleted — it's simply no longer used by the `fullScreen` branch's default click
behavior (nothing else currently references it, so it becomes dead code after this change unless a
future feature reuses it; flagged for the implementer to note, not to delete unilaterally since
that's a separate decision). "Ver ficha completa" (already a link inside `SpaceCard`/the full
`/spaces/[slug]` page) remains the way to reach full detail.

## 9. Testing

No new automated tests — this is entirely client-component layout/interaction work, matching this
codebase's established convention of manual dev-server verification for components of this kind
(`FavoriteButton.tsx`, `ReviewsSection.tsx`, `RewardsBadge.tsx` etc. all have zero test files).
Manual verification checklist for the implementation plan: `/near-me` logged out (unchanged
Header+navbar); `/near-me` logged in on desktop (sidebar replaces navbar, Explorar highlighted);
click a disabled nav item (tooltip, no navigation); click Rewards (goes to `/perfil`); avatar
picker appears once for a user with no `avatar_id`, persists after reload; avatar menu
opens/closes, Cerrar sesión works; click a map pin (small floating card appears, not the old
slide-over); toggle a favorite from the card (heart appears on that pin); click "Lista" (list
panel slides in, `SpaceList` renders); zoom +/− buttons work on both map backends (toggle
`NEXT_PUBLIC_USE_MOCK_MAP` or however the codebase currently switches adapters, to check both);
"Mi ubicación" button centers the map.

## 10. Migration safety

Single additive column (`profiles.avatar_id`), nullable, no backfill needed — existing users see
the picker modal once on their next `/near-me` visit. No RLS policy changes (existing `profiles`
select/update policies already cover the new column); only the column-level `grant update` list
needs `avatar_id` appended.
