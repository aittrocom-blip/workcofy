# Workcofy — Trust & Rewards Layer (Fase A) — Design Spec

Date: 2026-08-26
Status: Approved by user, pending spec self-review sign-off

## 1. Concept & scope

Workcofy's product logic is **Encuentra → Confía → Gana**, expressed through exactly three
user-visible concepts and no more:

1. **Workcofy** — the platform to discover places to work.
2. **Workcofy Verified** — a badge meaning Workcofy checked that a space meets specific standards.
3. **Workcofy Coins** — a currency users earn for contributing, redeemable for benefits.

No other visible product concepts ("Workcofy Point", "Workcofy Hub", "Workcofy Partner",
"Workcofy Access", etc.) are introduced. Internal-only states (commercial affiliation via
`partner_status`, verification bookkeeping) may exist in the data model without being surfaced
as separate user-facing ideas.

This spec covers **Fase A only**: everything buildable today without a user-authentication
system. It restyles the existing discovery experience (Home / Cerca de mí / Distritos / Space
detail) to the new visual direction, adds a real **Workcofy Score**, restructures amenities,
adds the **Workcofy Verified** badge, and adds **informational, database-driven** Coins content
(rules + redemption catalog) with no live per-user balance yet.

### Explicitly deferred to Fase B (separate spec)

- User accounts / authentication (none exists in the codebase today — verified by grep, no
  `supabase.auth` usage anywhere).
- Community ratings per amenity, reviews, user-submitted photos.
- Check-ins. The user explicitly decided check-ins are not needed for Fase B either — there is
  currently **no first-party mechanism** planned to generate busy-hour data organically as a
  result. This is a known, accepted gap, not an oversight.
- "Cuándo está lleno" / popular times / rush hour. **Not available through the official Google
  Places API in any form** (confirmed against current documentation and community reports —
  only unofficial scrapers expose it, which violate Google's Terms of Service). The user chose
  to launch without this rather than pursue a paid third-party aggregator (e.g. BestTime.app) or
  build a lightweight crowdsourced "¿Está lleno ahora?" widget. Revisit only if the user asks.
- Real Workcofy Coins ledger (earning events tied to a user, spendable balance) and real
  redemption fulfillment.
- `/admin` panel for setting Verified status, verified amenities, or benefits — set by hand via
  Supabase Table Editor for now.

## 2. Visual identity — additive, not a redesign

The existing black/white/gray identity (`tailwind.config.ts`: `workcofy.black #0a0a0a`,
`workcofy.gray #6b7280`) is kept. One accent is added:

```ts
workcofy: { black: '#0a0a0a', gray: '#6b7280', yellow: '#F4B942' }
```

The yellow is used sparingly (Score emphasis, Verified/Coins accents, hover states) — never as a
large fill. It is deliberately the color of a coin, so it reads as "value" everywhere it
appears, not only inside the Coins section. Typography, radii (`rounded-2xl`/`rounded-full`),
and shadow language stay as-is; only weight/scale adjustments where the reference calls for more
visual weight (H1, Score figure).

## 3. Data model changes

All changes are additive migrations on top of `0001_create_spaces.sql` and
`0002_expansion_geo.sql`.

### 3.1 Amenities — replaces flat boolean columns

`wifi_available`, `power_outlets`, `laptop_friendly`, `meeting_friendly`, `workshop_friendly`,
`event_friendly`, `private_rooms`, `outdoor_seating`, `parking` are dropped. Confirmed via grep
that none of these are read by any component or page — only referenced in
`lib/data/spaceTypes.ts` and one test fixture — so this is safe. `noise_level`,
`seating_capacity`, `recommended_stay_minutes` are kept (still potentially useful, not part of
the new taxonomy, not blocking anything).

New column:

```sql
alter table spaces add column amenities jsonb not null default '{}'::jsonb;
```

Shape (every leaf is `true | false | null` — `null` means "Información no disponible", never
inferred):

```json
{
  "para_trabajar": { "wifi": null, "enchufes": null, "mesas_comodas": null, "iluminacion": null },
  "para_llamadas": { "videollamadas": null, "zona_tranquila": null, "booth": null },
  "servicios": { "cafe": null, "agua": null, "banos": null, "impresiones": null, "pizarra": null, "sala_reuniones": null }
}
```

**Correction after further checking**: Google Places API — classic or New — has no wifi,
power-outlet, or noise-level field for any place type (verified against the current field-data
docs; the New API's closest fields are `restroom` and `outdoorSeating`, neither of which this
project's scripts currently request, and neither maps to our taxonomy anyway). Seed scripts do
**not** attempt to infer any `amenities` leaf from Google — every space's `amenities` starts
entirely `null` (the column default) regardless of source, and stays that way until Fase B
community data or manual entry fills it in. This keeps "never invent data" honest rather than
disguising a guess as a real signal.

### 3.2 Workcofy Score — computed, not stored as truth

`spaces.workcofy_score` (already exists, nullable int 0-100) is repurposed as a **manual
override** — if Workcofy staff sets it directly, that value wins. Otherwise a pure function
computes it at read time:

`lib/score/workcofyScore.ts`:

```ts
export function computeWorkcofyScore(space: SpaceRecord): number | null
```

Formula — two components, each optional, re-weighted to whatever is actually known so a space is
never punished for missing data it was never given the chance to have:

- **Rating component** (weight 60 when both components are present): Google rating (0-5 → 0-100)
  discounted by review-count confidence (a 5.0 with 2 reviews must not outweigh a 4.6 with 300;
  confidence scales toward 1 as `review_count` grows, e.g.
  `confidence = min(1, log10(review_count + 1) / log10(50))`).
- **Amenities component** (weight 40 when both components are present): average of the four
  `para_trabajar` amenity booleans, counting only the non-null ones.
- If only one component has data (this is the common case at launch: Google seed scripts never
  populate `amenities`, see the correction above — so almost every space starts with a rating
  but zero known amenities), that component alone determines the score at its full weight — a
  rating-only space is **not** capped near 60. If neither component has data, the function
  returns `null` and the UI shows "Score próximamente" — never a fabricated number.
- Manual `workcofy_score` override, if set, replaces the computed value entirely.

Score and Verified are independent signals by design (Score = "how good to work here",
Verified = "Workcofy checked it") — Verified status does not feed into the Score formula, to
keep the three-concept model from blurring.

### 3.3 Workcofy Verified

```sql
alter table spaces add column verified boolean not null default false;
alter table spaces add column verified_at timestamptz;
alter table spaces add column verified_amenities text[] not null default '{}';
```

`verified_amenities` holds keys like `wifi`, `enchufes`, `zona_tranquila` — the specific,
concrete standards Workcofy actually confirmed on-site, shown as a short checklist. Independent
from `partner_status` (commercial affiliation — stays internal, never rendered).

### 3.4 Benefits

```sql
create table space_benefits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  label text not null,
  icon text,
  sort_order int not null default 0
);
```

Only rendered on a space if it has rows here — never inferred or defaulted.

### 3.5 Coins — informational tables, no ledger

```sql
create table coin_rules (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  label text not null,
  coins int not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table coin_redemptions (
  id uuid primary key default gen_random_uuid(),
  coins_required int not null,
  label text not null,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true
);
```

Seeded rows for `coin_rules` (per user decision, no check-in row):

| action | label | coins |
|---|---|---|
| `rate_space` | Evaluar un espacio | 5 |
| `rate_amenities` | Evaluar amenities | 5 |
| `upload_photo` | Subir una foto útil | 10 |
| `full_review` | Reseña completa | 20 |

`coin_redemptions` seeded with the example tiers from the user's spec (500 / 1,000 / 2,500
coins), clearly values to be tuned later, never hardcoded in component code.

Both tables get the same public-read RLS policy pattern as `spaces` (`active = true` readable by
`anon`) — this is informational content, safe to be public, unlike `space_internal_contacts`.

## 4. Pages & components

- **`tailwind.config.ts`**: add `workcofy.yellow`.
- **Header**: add a "Workcofy Coins" nav link (anchors to the new home section). No balance
  display — no auth yet.
- **Hero**: same structure (headline → search → district chips), heavier type scale, yellow
  accent on one word, per the reference direction.
- **`lib/categories.ts`**: add `hotel` (inactive) to `CATEGORY_OPTIONS`; relabel `meeting_room`
  from "Reuniones" to "Salas de reunión". Reuses the existing `active: false` → "Próximamente"
  pattern already in place.
- **`SpaceCard`**: shows Score (via `computeWorkcofyScore`), Verified badge when
  `space.verified`, first real photo instead of the gray placeholder when `photos` is non-empty.
- **`DiscoveryView` / map / list**: same functional layout and behavior (filters, sort,
  geolocation, distance) — visual restyle only.
- **New home sections**, appended after the existing map+list block, before the footer, in this
  order:
  - **Espacios destacados** — horizontal card carousel. No curation mechanism exists yet, so
    selection is mechanical: top N (6-8) active spaces by `computeWorkcofyScore`, ties broken by
    `review_count` descending. Revisit if/when an admin panel allows manual curation.
  - **Workcofy Verified** — short static explainer (what the badge means), not a listing.
  - **Workcofy Coins** — renders `coin_rules` + `coin_redemptions` from the DB.
  - **Beneficios** — only rendered if at least one active space has rows in `space_benefits`;
    since that table starts empty, this section is simply omitted at first launch rather than
    showing placeholder/fake examples. Add real content once a partner space has a benefit.
- **`/spaces/[slug]`**: substantially expanded — photo gallery, general info (address, phone,
  website, Instagram if present), amenities grouped into the three sections (with "Información
  no disponible" for unknown leaves), Score, Verified checklist (if verified), benefits (if any).
  Currently this page has none of that — just name/district/rating/hours/"Cómo llegar".

## 5. Testing

- Unit tests for `computeWorkcofyScore` (`lib/score/workcofyScore.test.ts`): no rating + no
  amenities → `null`; rating-only; amenities-only; both; manual override wins; low review-count
  discount behaves monotonically.
- Update `lib/filters/sortSpaces.test.ts` fixtures for the removed boolean columns →
  `amenities` shape.
- Existing Vitest/Testing Library setup is reused; no new test infra needed.

## 6. Migration safety

- `amenities` defaults to `'{}'::jsonb` — existing rows get an empty object, every leaf reads as
  "not available" until re-seeded (Lima's 30 spaces and Chile/Perú's incoming ~63 both go through
  the seed scripts regardless, so this self-heals on the next seed run).
- `verified` defaults to `false` — no space is silently marked verified.
- Dropping the 9 unused boolean columns and adding `amenities`/`verified`/`verified_at`/
  `verified_amenities` happens in one migration file,
  `supabase/migrations/0003_trust_layer.sql`, applied the same way as 0001/0002 (pasted into the
  Supabase SQL Editor — this project isn't linked via the Supabase CLI).
