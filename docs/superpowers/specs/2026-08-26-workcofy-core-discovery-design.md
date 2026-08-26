# Workcofy — Core Discovery MVP (Phase 1) — Design Spec

Date: 2026-08-26
Status: Approved by user, pending spec self-review sign-off

## 1. Concept & scope

Workcofy is a platform to discover, compare, and reach work-friendly spaces in Lima, starting with cafés/work cafés in **Miraflores, San Isidro, and Barranco**. The core loop this phase must support end-to-end, in under 30 seconds:

Open Workcofy → allow location → see nearby cafés → compare distance/rating/hours → select one → tap "Cómo llegar" → open Google Maps.

**No reservations, no payments, no login, no reviews, no chat, no marketplace, no loyalty, no native app.** The schema and structure must not block adding those later, but none of them are built now.

### Phase boundaries

This spec covers **only** the core discovery experience:
- Home page with hero, search, quick district links
- Map + list discovery view (reused across home, district pages, near-me)
- Filters (category placeholder, district, sort)
- District pages (`/miraflores`, `/san-isidro`, `/barranco`)
- Near-me page (`/near-me`)
- Space detail pages (`/spaces/[slug]`)
- Geolocation + distance calculation
- "Cómo llegar" → Google Maps deep link
- SEO metadata for the above pages
- Google Places data acquisition for the seed café list (real, once a Google Maps Platform key is supplied) and a mock-data local-dev path (until then)

**Explicitly deferred to later phases/specs:**
- `/admin` CRUD panel and verification/partner workflow states
- Analytics event tracking (search, view, click "Cómo llegar", filters used, etc.)
- Coworkings, salas de reuniones, hoteles, workshops, eventos, espacios corporativos as *active* categories (schema must allow them, UI must not need rework to add them)
- Reservations/payments/business model plumbing

## 2. Brand & visual identity

Isotype: black location pin, white circular interior, black coffee cup, WiFi symbol above the cup (`logo/logo-solo.png`). Wordmark: `logo/logov1.png`, always spelled **WORKCOFY** (never "WORK COFY", "WORKCOFFY", "WORKCOFFEE", "WORKCOFI"). Palette: black + white + grays, minimal color, moderate border radii, subtle shadows, premium/urban/professional feel — not artisanal-café, not a tourism site, not a generic map directory. Map markers are a simplified pin+cup silhouette inspired by the isotype, not the full logo.

## 3. Tech stack

- Next.js 14 (App Router) + TypeScript, npm
- Tailwind CSS
- Supabase/Postgres (user has an existing project; connect via `@supabase/supabase-js`)
- Google Maps Platform (Maps JavaScript API + Places API) for production maps/places data
- Vercel for deployment
- No API keys committed to the repo; secrets via `.env.local` (gitignored) and Vercel project env vars

## 4. Data model

Single table `spaces` (Postgres/Supabase). All Workcofy-specific fields exist now even though most start `NULL` — no data is fabricated to fill them.

```sql
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'cafe', 'work_cafe', 'coworking', 'meeting_room',
    'hotel', 'workshop', 'event', 'corporate'
  )),
  district text not null check (district in (
    'miraflores', 'san_isidro', 'barranco'
  )),
  address text,
  latitude double precision,
  longitude double precision,
  google_place_id text unique,
  google_maps_url text,
  phone text,
  website text,
  rating numeric(2,1),
  review_count integer,
  price_level integer,
  opening_hours jsonb,       -- shaped like Google Place Details opening_hours
  photos jsonb,               -- array of {photo_reference, width, height} or resolved URLs
  description text,

  wifi_available boolean,
  power_outlets boolean,
  laptop_friendly boolean,
  meeting_friendly boolean,
  workshop_friendly boolean,
  event_friendly boolean,
  noise_level text,
  seating_capacity integer,
  private_rooms boolean,
  outdoor_seating boolean,
  parking boolean,
  recommended_stay_minutes integer,
  workcofy_score integer,     -- 0-100, NULL until enough signal exists
  workcofy_notes text,
  partner_status text default 'none' check (partner_status in ('none', 'partner')),

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spaces_district_idx on spaces (district);
create index spaces_category_idx on spaces (category);
create index spaces_active_idx on spaces (active);
```

District slugs use hyphens in URLs (`/san-isidro`) but the stored value uses an underscore (`san_isidro`) — the district-page route maps between the two; this is an implementation detail, not a data model ambiguity.

No analytics or admin-workflow-state tables are created in this phase — adding a `status` column (`draft`/`verified`/`published`) is scoped to the admin-panel spec, not this one. Until then, `active` alone gates visibility.

## 5. Map & Places architecture

**Runtime read path (always the same, regardless of mode):** pages/components read from the `spaces` table via `lib/data/spaces.ts` (a small server-side data-access layer: `listSpaces(filters)`, `getSpaceBySlug(slug)`, `listSpacesByDistrict(district)`). No component ever calls Google APIs directly at request time in this phase — the app is not a live Google API proxy; Google is only involved when *populating* the table.

**Populating the table has two paths:**
1. **Real path** (`scripts/seed-google-places.ts`, server-side script, requires `GOOGLE_MAPS_SERVER_API_KEY`): for each of the 29 named cafés below, calls Places Text Search / Find Place scoped by name + district to resolve the correct `google_place_id` (handling multi-branch names like "Neira Café Lab" or "El Pan de la Chola" by matching district/address, never guessing), then Place Details for the full field set, then upserts into `spaces`. Never fabricates a match — if a place can't be confidently resolved, it's skipped and reported, not guessed.
2. **Mock path** (`lib/places/mock-fixtures.ts`, dev-only): hand-authored placeholder records for the same 29 names, clearly commented as fixture data, used **only** when seeding a local dev database and no real key is available yet. Never written to a production database, never presented as real Google data in the UI copy.

**Map rendering** goes through one `MapView` component with a single props contract (center, zoom, markers, selected marker, onMarkerClick, userLocation). Two adapters implement it:
- `GoogleMapAdapter` (`@vis.gl/react-google-maps`) — used whenever `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set. Handles marker clustering (via the supplemental marker-clusterer library) once marker count warrants it.
- `MockMapAdapter` (`maplibre-gl`, free key-less OSM-based tiles) — used otherwise. Same marker/selection interaction, no clustering needed at this data scale (≤13 markers per district).

`MapView` picks the adapter once, based on env presence, at the top level — nothing downstream (list, filters, cards) knows or cares which adapter is active. A small dev-only badge ("Modo desarrollo · datos de ejemplo") renders on the map only when the mock adapter is active, so it's never ambiguous which mode is live; it disappears automatically once the real key and real seed data are both present.

## 6. Routes

- `/` — home: header, hero (title/subtitle per copy below), search box, district quick-links, `DiscoveryView` (unfiltered, sorted by rating by default until location is known)
- `/near-me` — requests geolocation on load, `DiscoveryView` sorted by distance
- `/[district]` — dynamic route, valid slugs `miraflores`, `san-isidro`, `barranco` only (others → `notFound()`); short intro copy per district + `DiscoveryView` filtered to that district
- `/spaces/[slug]` — space detail page

`DiscoveryView` is one shared client component (map + filterable/sortable list) parameterized by initial filters — home, district pages, and near-me differ only in which filters are pre-applied, not in behavior. Desktop layout: 60–65% map / 35–40% list, side by side. Mobile: map on top, list below, single-hand usable.

## 7. Header, hero, search, filters — copy & behavior

**Header:** Workcofy logo (left) — wordmark on desktop, isotype-only on mobile. Nav: Explorar, Cerca de mí, Distritos. Right: "Usar mi ubicación" button.

**Hero:**
- Title: "Encuentra dónde trabajar, reunirte y crear."
- Subtitle: "Descubre cafés y espacios Work-Friendly cerca de ti."
- Search placeholder: "¿Dónde quieres trabajar?" — matches against name, district, and address (simple `ilike` contains match across those three columns; the dataset is small enough that Postgres trigram/full-text search is unnecessary for this phase).
- Quick district chips below search: Miraflores, San Isidro, Barranco.

**"Cerca de mí" flow:** on click, request geolocation permission → on grant, get lat/lng, center map, compute Haversine distance to every visible space, sort list by distance. On deny/unavailable, show "Permite tu ubicación para encontrar espacios cerca de ti." and fall back to the Miraflores centroid as the initial map center/list order.

**Filters bar:** category chips — Todos, Cafés, Work Cafés active; Coworking, Reuniones, Workshops, Eventos rendered but disabled/labeled "Próximamente" (structure supports enabling them later without rework). District filter: Miraflores, San Isidro, Barranco. Sort: Más cerca, Mejor valorados, Abierto ahora. Filters are reflected in the URL query string (shareable, SSR-friendly).

## 8. Space list card & detail page

**List card:** photo, name, district, star rating + numeric, distance (`0.8 km` style, Haversine), open/closed-until status computed from `opening_hours` + current time, "Ver espacio" and "Cómo llegar" buttons.

**Detail page (`/spaces/[slug]`):** main photo + thumbnails (from `photos`, respecting Google Places photo usage requirements — no local re-hosting that would violate their terms), name, category, rating, review count, address, distance (once user location is known), open/closed status, full weekly hours with "Hoy" highlighted, "Cómo llegar" button (Google Maps deep link using place ID + coordinates, with user's location as origin when available), Workcofy Score section — shows the 0–100 score if present, otherwise "Workcofy Score próximamente" (never a fabricated number).

## 9. SEO

Per-page metadata via Next's Metadata API:
- Home — Title: "Workcofy | Encuentra dónde trabajar, reunirte y crear" / Description: "Descubre cafés, work cafés y espacios de trabajo cerca de ti en Lima."
- `/spaces/[slug]` — Title: "{name} | Workcofy" / Description: "Encuentra ubicación, horario, valoración y cómo llegar a {name} en {district}."
- Open Graph tags on both, using the primary space photo where available.

## 10. Error handling & graceful degradation

- Missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → mock map + mock data path (see §5), never a broken page.
- Geolocation denied/unavailable → Miraflores centroid fallback, explicit permission-prompt copy.
- Empty search/filter results → friendly empty state, not a blank list.
- Google Places API errors at seed-time (rate limit, no match, invalid key) → logged and skipped per-record, never silently fabricated or guessed.
- Secrets: `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_MAPS_SERVER_API_KEY` are server-only, never sent to the client bundle. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is intentionally public (Google's own design — secured via HTTP-referrer restriction in Cloud Console, not by secrecy); this is documented explicitly so it isn't mistaken for a leak.

## 11. Testing

Unit tests: Haversine distance, slug generation, "abierto ahora" computation from `opening_hours` + current time, filter/sort helpers. Google Maps real-adapter interaction cannot be verified end-to-end until a real API key is supplied — this gap will be reported explicitly rather than claimed as tested; the mock adapter's interaction (pan/zoom/select/marker click) is verified manually as part of this phase's "done" check.

## 12. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # server-only, used by the seed script
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # optional; presence switches map+list to real Google data
GOOGLE_MAPS_SERVER_API_KEY=           # optional; used only by scripts/seed-google-places.ts
```

## 13. Seed café list (to resolve via Google Places once a key exists)

**Miraflores:** Neira Café Lab, Puku Puku Café Larco, Ombú Specialty Coffee, Kaldis Specialty Coffee Recavarren, Moss Espresso, Urban Coffee Perú, Rutina Café, Homemade, Etcetera Café, Café et Chocolat, Grano Dorado / Evolèt, El Pan de la Chola — Pan & Café, El Pan de la Chola — Brunch & Pizza.

**San Isidro:** Neira Café Lab – Dasso, Puku Puku Pardo y Aliaga, Café Sur, Puku Puku BCP Café, Blu Café San Isidro, Senzuru Coffee, Croissant & Caffe, The Coffee, Híbrido Coffee Bar, El Pan de la Chola – Dasso.

**Barranco:** Rue, La Tostadora Café, La Bodega Verde, Caleta Dolsa Coffee, Monotono Coffee, Las Vecinas, Pan de la Chola (only if a verifiable branch exists in the district).

Multi-branch names are resolved per-district/address by the seed script, never assumed. Any name that can't be confidently matched to a single Google Place is skipped and reported rather than guessed.

## 14. Open risks / explicit unknowns

- No Google Maps Platform key exists yet → real Places matching and the real Google map cannot be verified until one is supplied; the mock path stands in for local development and demo purposes only.
- Supabase project credentials are not yet in hand for this session → migrations are delivered as SQL files runnable via the Supabase SQL editor or CLI once credentials are available; they are not applied by this session.
- Google Places photo usage must respect Google's terms (no local re-hosting/caching in violation of their policy) — implementation will use photo references/URLs as returned by the API, not downloaded copies.
