# Workcofy — Admin Dashboard + Space CRUD — Design Spec

Date: 2026-09-01
Status: Approved by user (sections 1–3, in-chat), pending spec self-review sign-off

## 1. Concept & scope

Today `/admin/espacios` is a single bare list page (name, district, verified badge) with no shell,
no home page, no create, no delete, and an edit form (`VerificationForm.tsx`) limited to two
fields: `verified` and `verified_amenities`. The user asked for a real admin experience: a distinct
dashboard, and full space management (create, edit, delete). This is the first of four sub-projects
identified during brainstorming — see §6 for the others and why they're deferred.

This spec covers three pieces, agreed in order:

1. **Dashboard shell** — a nav/layout wrapper for every `/admin/*` route, plus a new `/admin` home
   page with basic metrics.
2. **Create a space** — a Google-Places-search-assisted flow (reusing the logic
   `scripts/seed-google-places.ts` already has, extracted into shared `lib` code), falling back to a
   blank manual form when Google has no match.
3. **Edit a space (full fields) + delete** — expands the existing per-space admin page to every
   field, not just verification; "delete" soft-deletes via the existing `active` column.

### Sequencing dependency

The amenities-v2 spec (`2026-09-01-workcofy-amenities-v2-design.md`, approved, not yet implemented)
also adds an editor section to `app/admin/espacios/[slug]/page.tsx`. Per user decision, **amenities
v2 implements first**; this spec's per-space edit page (§4) is built on top of that already-updated
page, not in parallel with it, so the amenities editor only gets touched once.

## 2. Dashboard shell (`app/admin/`)

- `app/admin/layout.tsx` (new) — wraps every `/admin/*` route in a left nav sidebar, visually
  distinct from the public site's `Header`/`Sidebar` (this is the admin's own shell, not a variant of
  either). Nav entries: **Espacios** (links to `/admin/espacios`), **Usuarios** and **Partners**
  rendered as disabled "Próximamente" entries (same pattern already used for not-yet-built nav items
  elsewhere — see `components/layout/Sidebar.tsx`'s default branch) until their own sub-projects
  ship.
- `app/admin/page.tsx` (new) — the `/admin` landing page. Three numbers, each a simple
  `count()`/`select` against `spaces`: total active spaces, how many are `verified`, how many were
  `created_at >= now() - interval '7 days'`. No charts, no time-series — just the three counts as
  stat tiles, consistent with "nav + métricas básicas" scope (metrics beyond this are a fast-follow,
  not blocking this ship).
- The existing `middleware.ts` guard (`/admin/*` → `profiles.is_admin`) already covers every route
  under this new layout without changes.

## 3. Create a space

New "Agregar espacio" button on `/admin/espacios` opens `/admin/espacios/nuevo` (new route), a
two-step flow:

**Step 1 — search.** A text input (free-form: name, address, or both) submits to a new server
action, `searchGooglePlaces(query: string)`, backed by new shared module `lib/places/googlePlaces.ts`
extracted from `scripts/seed-google-places.ts`'s `findPlaceId`/`fetchPlaceDetails` (currently
script-only, not callable from a server action). Unlike the seed script — which resolves to a single
best match given an already-known target name+district — this needs a general free-text search
returning **multiple** candidates (Google's Places Text Search already returns a results array; the
seed script just narrows to one). Renders up to 5 results as picker cards (name, address, thumbnail
if available). Uses `GOOGLE_MAPS_SERVER_API_KEY` (server-only, same key the seed scripts already
use) — never exposed to the client.

**Step 2 — review & save.** Picking a result calls Place Details (same fields the seed script
requests: address, geometry, phone, website, rating, price_level, opening_hours, photos, url) and
pre-fills a form — the same field set as the edit form (§4) — for the admin to review/adjust
(district and category aren't in Google's data and need picking manually; everything else
pre-fills). Saving inserts a new `spaces` row with `data_source: 'google'`, `active: true`,
`verified: false`, and a slug from the existing `generateSpaceSlug` helper.

**No match found** (or the admin skips search) → "Cargar manualmente" link goes straight to the same
form, blank, `data_source: 'mock'` on save — reusing the create form rather than building a second
one.

## 4. Edit a space (full fields) + delete

`app/admin/espacios/[slug]/page.tsx` gains a general-fields form above/alongside the existing
verification section (and, once amenities-v2 ships first per §1, its amenities editor) — same page,
additional section, not a new route. Editable: `name`, `category`, `district`, `address`, `phone`,
`website`, `opening_hours`, `price_level`, and `photos`.

- **Photos**: a real upload widget, not a paste-URL field — reuses the Supabase Storage bucket
  `scripts/backfill-photos.ts` already uploads to (`PHOTO_BUCKET`), via a new server action that
  accepts a file, uploads it, and appends `{ url, width, height }` to the space's `photos` jsonb
  array (same shape Google-sourced photos already use). Existing photos can be removed from the
  array; reordering is out of scope for this pass (first photo stays "the" cover photo, matching
  today's `space.photos?.find(...)` usage everywhere else in the codebase).
- **Save**: one new server action, `updateSpaceFields(spaceId, slug, fields)`, alongside the existing
  `updateVerification` (and the amenities-v2 `updateAmenities`, once that ships) — re-checks
  `profiles.is_admin` server-side before writing, same defense-in-depth pattern already established.
- **Delete**: a "Eliminar espacio" button sets `active = false` (soft delete, confirmed with user) —
  the row, its reviews, and any favorites pointing at it are untouched; the space just stops
  matching the public RLS policy's `active = true` read filter and disappears from every public
  listing. The admin list (`/admin/espacios`) shows inactive spaces too (with a "Desactivado" badge
  next to today's "Verificado"/"Sin verificar" one) with a "Reactivar" action, so this is reversible
  from the same panel — no separate "trash" view needed.

## 5. Testing

- `lib/places/googlePlaces.ts` — unit tests mocking `fetch`, covering: multi-result search, zero
  results, a malformed/error Google response.
- No new test needed for the server actions themselves beyond what the existing
  `updateVerification`/`actions.ts` pattern already covers structurally — server actions aren't
  unit-tested elsewhere in this repo (confirmed during the amenities-v2 spec's own research).

## 6. Explicitly out of scope (separate future sub-projects)

Identified during brainstorming decomposition, each gets its own spec/plan/implementation cycle:

- **Usuarios** — admin ability to add/delete/modify user accounts (needs Supabase Auth admin API
  access, not just the `profiles` table). Nav entry exists as a disabled placeholder only (§2).
- **Workcofy Partners** — a partner login/account tied to a specific already-registered space, with
  its own signup flow and its own (still-undefined) capabilities once logged in. Nav entry exists as
  a disabled placeholder only (§2). Needs its own requirements pass before design — what a partner
  can actually do, and exactly how a partner's signup gets linked to "the space already registered
  in our system" (admin-issued invite vs. self-service claim-by-search), were both still open when
  this was decomposed.
- **Ficha "quick view" redesign** (the SpaceCard preview shown over the map) — a separate, mostly
  visual redesign request (photo carousel, rating+score combo, a new community "check-in" activity
  feed) that arrived mid-brainstorm on this spec. User confirmed it queues after both amenities-v2
  and this admin dashboard ship.

## 7. Migration / rollout note

No new tables. No new columns — every field this spec edits (`name`, `category`, `district`,
`address`, `phone`, `website`, `opening_hours`, `price_level`, `photos`, `active`) already exists on
`spaces`. The only genuinely new server-side capability is calling the Google Places API from a
server action instead of only from standalone scripts, and writing to the existing Storage bucket
from a server action instead of only from `backfill-photos.ts`.
