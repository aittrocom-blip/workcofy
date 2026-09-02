# Workcofy — Amenities v2 (5-group model, admin capture, ficha priority view) — Design Spec

Date: 2026-09-01
Status: Approved by user (sections 1–3, in-chat), pending spec self-review sign-off

## 1. Concept & scope

Today `spaces.amenities` (jsonb) holds a 3-group shape — `para_trabajar`, `para_llamadas`,
`servicios` — defined in `lib/amenities/types.ts`. It is empty (`{}`) on all 85 real spaces in
production; nothing populates it. The user supplied an expanded 5-group attribute list and asked
for the ficha to stop dumping every attribute at once. This spec covers three things, agreed in
order during brainstorming:

1. **Data model** — expand `AmenitiesData` to 5 groups, including two new non-boolean groups
   (`ambiente`, `tipo_espacio`), still inside the same `amenities` jsonb column (no DB migration).
2. **Admin capture** — a new editor in `/admin/espacios/[slug]` that can actually set this data,
   since nothing does today.
3. **Ficha display** — `AmenitiesSection` gets a compact/priority view with a "Ver todos" expansion,
   replacing today's always-fully-expanded list.

### Explicitly out of scope (per user instruction)

- **Work Score formula.** The user was explicit: "no construir todavía una fórmula definitiva para
  Work Score; primero asegurar que los datos puedan capturarse correctamente." `computeWorkcofyScore`
  (`lib/score/workcofyScore.ts`) is not touched, and the ficha's priority view omits a Work Score
  slot entirely (confirmed with user — no placeholder either) rather than reserving an empty spot.
- **Filters using the new attributes.** `DiscoveryFilterState`/`FiltersBar`/`FiltersPanel` are not
  touched. The new data existing is a prerequisite for future filters, not this phase.
  Recommendations and "Brainer" (an unbuilt future AI assistant idea) are the same — out of scope,
  data-capture-readiness only.
- **`verified_amenities`** (the flat `text[]` "Amenities confirmadas" checklist already in the admin
  panel, backing the Workcofy Verified trust badge) is untouched — it's a distinct concept (staff
  confirmation for the Verified badge) from the richer per-attribute `amenities` jsonb this spec
  extends. Two separate mechanisms remain, on purpose.
- Backfilling real data for the 85 existing spaces is manual follow-up work after this ships, done
  through the new admin editor — not part of this implementation.

## 2. Data model (`lib/amenities/types.ts`)

Expanded `AmenitiesData` shape — still one `amenities` jsonb column, no migration:

```ts
export interface ParaTrabajarAmenities {
  wifi: boolean | null
  wifi_rapido: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
  clima: boolean | null              // renamed from aire_acondicionado — covers AC or heating
  senal_movil: boolean | null        // new
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
  sala_reuniones: boolean | null     // moved here from servicios
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  comida: boolean | null             // new
  impresiones: boolean | null
  pizarra: boolean | null
  pantalla_tv: boolean | null        // new
  proyector: boolean | null
  estacionamiento: boolean | null
  terraza: boolean | null
  pet_friendly: boolean | null
  accesibilidad: boolean | null
}

export type AmbienteValue = 'muy_silencioso' | 'tranquilo' | 'moderado' | 'animado'

export type TipoEspacioValue =
  | 'mesa_individual' | 'mesa_grupal' | 'barra' | 'sofa' | 'sala_privada' | 'terraza_exterior'

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
  ambiente: AmbienteValue | null      // single-select, not a boolean group
  tipo_espacio: TipoEspacioValue[]    // multi-select, not a boolean group
}
```

Consequences:

- `DEFAULT_AMENITIES` gains `ambiente: null` and `tipo_espacio: []`, plus the new boolean leaves
  (all default `null` — "unknown" — except the existing table-stakes defaults `wifi: true`,
  `cafe: true`, `agua: true`, `banos: true`, which carry over unchanged; `sala_reuniones` was not
  previously defaulted and stays `null`).
- `parseAmenities` gains two new branches: `ambiente` validated against the 4 allowed strings
  (anything else → `null`), `tipo_espacio` filtered to only recognized values (anything else
  dropped, never throws).
- `AMENITY_LABELS`/`AMENITY_GROUP_LABELS` gain entries for every new key, `ambiente` value, and
  `tipo_espacio` value (needed by both the admin editor and `groupedAmenityEntries`).
- `groupedAmenityEntries` (`lib/amenities/groupedAmenityEntries.ts`) only handles boolean groups
  today. `ambiente` and `tipo_espacio` are handled by their own small helpers/components (an
  ordinal-scale label and a multi-value chip list respectively) rather than forced into the
  `AmenityGroupEntries` boolean shape.

## 3. Admin capture (`app/admin/espacios/[slug]/`)

A new section is added below the existing "Amenities confirmadas" checklist in
`VerificationForm.tsx` (or a sibling component, `AmenitiesEditorForm.tsx`, kept separate since it
edits a different field — `amenities`, not `verified_amenities` — and has different save timing).

- **Boolean attributes** (para_trabajar, para_llamadas, servicios): each renders as a 3-way pill
  group — **Sí / No / Desconocido** — because `null` ("información no disponible") is a real,
  distinct value from `false`, not a missing checkbox state. Same visual language as the
  available/unavailable/unknown chips already in `AmenitiesSection`.
- **Ambiente**: one radio group, 4 options, no "desconocido" state beyond simply not selecting one
  (`null`).
- **Tipo de espacio**: multi-select checkboxes, no "desconocido" state (unchecked = not present).
- A single "Guardar" button persists the whole `amenities` object in one server action call
  (mirrors `updateVerification`'s pattern) — not per-field autosave.

### Server action

A new action alongside `updateVerification` in `app/admin/espacios/[slug]/actions.ts`:

```ts
export async function updateAmenities(spaceId: string, slug: string, amenities: AmenitiesData) {
  // admin-only (existing admin middleware guard already covers /admin/*)
  // .update({ amenities }).eq('id', spaceId), then revalidatePath for the admin + public ficha routes
}
```

## 4. Ficha display (`components/space/AmenitiesSection.tsx`)

`AmenitiesSection` becomes a client component (`'use client'`) with two render modes:

- **Compact (default):**
  - Wi-Fi and Enchufes — individual chips (existing chip styling: available/unavailable/unknown).
  - **Ambiente** — a single label/tag (e.g. "Tranquilo"); renders nothing if `null`.
  - **Comodidad** — a mini-group of 3 chips: mesas_comodas, iluminacion, clima.
  - **Llamadas** — the full `para_llamadas` group (4 chips — videollamadas, zona_tranquila, booth,
    sala_reuniones), since it's already short.
  - **Servicios principales** — a curated 4-chip subset: cafe, agua, banos, estacionamiento. The
    other 8 servicios entries (comida, impresiones, pizarra, pantalla_tv, proyector, terraza,
    pet_friendly, accesibilidad) are hidden until expanded.
  - **Precio** — rendered as its own line above/beside the compact group, sourced from
    `space.price_level` (existing column, unrelated to `amenities`) via `formatPriceLevel` (already
    used in `SpaceCard.tsx`) — shown only when `price_level` is not null. Not part of
    `AmenitiesSection` itself; a small addition where the ficha (`SpaceDetailPanel.tsx` /
    `app/spaces/[slug]/page.tsx`) already renders `<AmenitiesSection>`.
  - No Work Score slot (see §1, explicitly confirmed).
- **Expanded ("Ver todos" button):** everything above, plus wifi_rapido, senal_movil, the remaining
  8 servicios entries, and **Tipo de espacio** (a new chip row — this group never appears in the
  compact view since it wasn't in the user's priority list).

`AmenitiesSection`'s own local `useState` drives the expand/collapse — no new prop threading
through `SpaceDetailPanel`/`app/spaces/[slug]/page.tsx` beyond the `amenities` + `price_level` data
already available there.

## 5. Testing

- `lib/amenities/types.test.ts` — extend for the new keys/defaults, `parseAmenities` handling of
  `ambiente`/`tipo_espacio` (valid values pass through, invalid/garbage values become `null`/`[]`).
- `lib/amenities/groupedAmenityEntries.test.ts` — extend for the still-boolean groups only (ambiente/
  tipo_espacio stay out of this helper's contract, per §2).
- No new data-layer test needed for `updateAmenities` beyond what the existing `updateVerification`
  pattern already covers structurally (server actions aren't unit-tested elsewhere in this repo).

## 6. Migration / rollout note

No SQL migration. Existing rows already default `amenities` to `'{}'::jsonb`; `parseAmenities`
already treats missing keys as `null`/defaults, so old empty rows render identically to today
(everything "unknown" except the existing true defaults) until someone fills them in via the new
admin editor.
