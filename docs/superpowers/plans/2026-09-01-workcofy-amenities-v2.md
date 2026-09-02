# Workcofy Amenities v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the space `amenities` data model to 5 groups (including two new non-boolean groups,
`ambiente` and `tipo_espacio`), give admins a real editor to actually set this data, and redesign the
public ficha's amenities display from an always-fully-expanded list into a compact/priority view
with a "Ver todos" expansion.

**Architecture:** No DB migration — everything stays inside the existing `spaces.amenities` jsonb
column. The change is entirely in the TypeScript data-shape layer (`lib/amenities/`), one new admin
form + server action, and a rewrite of the public `AmenitiesSection` component from an always-server
list into a client component with two render modes.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Vitest, Supabase (jsonb column, no
schema change).

**Spec:** `docs/superpowers/specs/2026-09-01-workcofy-amenities-v2-design.md`

## Global Constraints

- No SQL migration — the `amenities` jsonb column already exists and defaults to `'{}'::jsonb`.
- `verified_amenities` (the separate flat "Amenities confirmadas" checklist backing the Workcofy
  Verified badge) and its `VerificationForm.tsx` component are **not touched** — a distinct
  mechanism, kept as-is.
- No Work Score slot anywhere in the new ficha display — `lib/score/workcofyScore.ts` is untouched.
- No filter/`DiscoveryFilterState` changes — this is data-capture-readiness only.
- Every boolean amenity leaf is `true | false | null` — `null` ("información no disponible") must
  never be coerced to `false`.

---

### Task 1: Expand the amenities data model

**Files:**
- Modify: `lib/amenities/types.ts`
- Test: `lib/amenities/types.test.ts`

**Interfaces:**
- Produces: `AmenitiesData` (5 keys: `para_trabajar`, `para_llamadas`, `servicios`, `ambiente:
  AmbienteValue | null`, `tipo_espacio: TipoEspacioValue[]`), `AmbienteValue`, `TipoEspacioValue`,
  `AMBIENTE_VALUES: AmbienteValue[]`, `TIPO_ESPACIO_VALUES: TipoEspacioValue[]`, `DEFAULT_AMENITIES`,
  `AMENITY_LABELS: Record<string, string>`, `AMENITY_GROUP_LABELS: Record<keyof AmenitiesData,
  string>`, `parseAmenities(raw: unknown): AmenitiesData`, `averageKnownAmenities` (unchanged).
  Every later task in this plan imports from this file.

**Note:** After this task, `lib/amenities/groupedAmenityEntries.test.ts` will FAIL (it iterates
`Object.keys(DEFAULT_AMENITIES)`, which now includes non-object `ambiente`/`tipo_espacio` values —
`Object.entries(null)` throws). This is expected and fixed by Task 2 immediately after. Don't stop
to investigate it here.

- [ ] **Step 1: Replace the test file with the updated + new assertions**

Overwrite `lib/amenities/types.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_AMENITIES, averageKnownAmenities, parseAmenities } from './types'

describe('DEFAULT_AMENITIES', () => {
  it('defaults table-stakes amenities to true and everything else to null', () => {
    expect(DEFAULT_AMENITIES.para_trabajar).toEqual({
      wifi: true, wifi_rapido: null, enchufes: null, mesas_comodas: null, iluminacion: null,
      clima: null, senal_movil: null,
    })
    expect(DEFAULT_AMENITIES.para_llamadas).toEqual({
      videollamadas: null, zona_tranquila: null, booth: null, sala_reuniones: null,
    })
    expect(DEFAULT_AMENITIES.servicios).toEqual({
      cafe: true, agua: true, banos: true, comida: null, impresiones: null, pizarra: null,
      pantalla_tv: null, proyector: null, estacionamiento: null, terraza: null, pet_friendly: null,
      accesibilidad: null,
    })
  })

  it('defaults ambiente to null and tipo_espacio to an empty list', () => {
    expect(DEFAULT_AMENITIES.ambiente).toBeNull()
    expect(DEFAULT_AMENITIES.tipo_espacio).toEqual([])
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

describe('parseAmenities', () => {
  it('returns the default shape for an empty object (the real DB default today)', () => {
    expect(parseAmenities({})).toEqual(DEFAULT_AMENITIES)
  })

  it('returns the default shape for null or undefined', () => {
    expect(parseAmenities(null)).toEqual(DEFAULT_AMENITIES)
    expect(parseAmenities(undefined)).toEqual(DEFAULT_AMENITIES)
  })

  it('preserves known booleans and nulls out anything missing or non-boolean', () => {
    const raw = { para_trabajar: { wifi: true, enchufes: 'yes' }, servicios: { banos: false } }
    const result = parseAmenities(raw)
    expect(result.para_trabajar.wifi).toBe(true)
    expect(result.para_trabajar.enchufes).toBeNull()
    expect(result.para_trabajar.mesas_comodas).toBeNull()
    expect(result.servicios.banos).toBe(false)
    expect(result.para_llamadas).toEqual(DEFAULT_AMENITIES.para_llamadas)
  })

  it('accepts a valid ambiente value and rejects an invalid one', () => {
    expect(parseAmenities({ ambiente: 'tranquilo' }).ambiente).toBe('tranquilo')
    expect(parseAmenities({ ambiente: 'ruidoso' }).ambiente).toBeNull()
    expect(parseAmenities({ ambiente: 42 }).ambiente).toBeNull()
  })

  it('keeps only recognized tipo_espacio values, dropping anything else', () => {
    expect(parseAmenities({ tipo_espacio: ['sofa', 'mesa_grupal'] }).tipo_espacio).toEqual([
      'sofa', 'mesa_grupal',
    ])
    expect(parseAmenities({ tipo_espacio: ['sofa', 'jacuzzi'] }).tipo_espacio).toEqual(['sofa'])
    expect(parseAmenities({ tipo_espacio: 'sofa' }).tipo_espacio).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test file to verify it fails against the current types.ts**

Run: `npx vitest run lib/amenities/types.test.ts`
Expected: FAIL — `DEFAULT_AMENITIES.para_trabajar` still has `aire_acondicionado` instead of
`clima`/`senal_movil`, `DEFAULT_AMENITIES.ambiente` is `undefined` not `null`, etc.

- [ ] **Step 3: Replace `lib/amenities/types.ts` with the expanded shape**

```ts
export interface ParaTrabajarAmenities {
  wifi: boolean | null
  wifi_rapido: boolean | null
  enchufes: boolean | null
  mesas_comodas: boolean | null
  iluminacion: boolean | null
  clima: boolean | null
  senal_movil: boolean | null
  [key: string]: boolean | null
}

export interface ParaLlamadasAmenities {
  videollamadas: boolean | null
  zona_tranquila: boolean | null
  booth: boolean | null
  sala_reuniones: boolean | null
  [key: string]: boolean | null
}

export interface ServiciosAmenities {
  cafe: boolean | null
  agua: boolean | null
  banos: boolean | null
  comida: boolean | null
  impresiones: boolean | null
  pizarra: boolean | null
  pantalla_tv: boolean | null
  proyector: boolean | null
  estacionamiento: boolean | null
  terraza: boolean | null
  pet_friendly: boolean | null
  accesibilidad: boolean | null
  [key: string]: boolean | null
}

export type AmbienteValue = 'muy_silencioso' | 'tranquilo' | 'moderado' | 'animado'

export const AMBIENTE_VALUES: AmbienteValue[] = ['muy_silencioso', 'tranquilo', 'moderado', 'animado']

export type TipoEspacioValue =
  | 'mesa_individual'
  | 'mesa_grupal'
  | 'barra'
  | 'sofa'
  | 'sala_privada'
  | 'terraza_exterior'

export const TIPO_ESPACIO_VALUES: TipoEspacioValue[] = [
  'mesa_individual', 'mesa_grupal', 'barra', 'sofa', 'sala_privada', 'terraza_exterior',
]

export interface AmenitiesData {
  para_trabajar: ParaTrabajarAmenities
  para_llamadas: ParaLlamadasAmenities
  servicios: ServiciosAmenities
  ambiente: AmbienteValue | null
  tipo_espacio: TipoEspacioValue[]
}

export const DEFAULT_AMENITIES: AmenitiesData = {
  // Every space is assumed to have basic wifi unless a space's own data
  // explicitly says otherwise — near-universal in Lima/Santiago cafés.
  // "Wifi rápido" is a stronger, unverified claim and stays unknown by default.
  para_trabajar: {
    wifi: true, wifi_rapido: null, enchufes: null, mesas_comodas: null, iluminacion: null,
    clima: null, senal_movil: null,
  },
  para_llamadas: { videollamadas: null, zona_tranquila: null, booth: null, sala_reuniones: null },
  // Café, water, and a bathroom are basic table-stakes for any café — assumed
  // true the same way wifi is, unless a space's own data says otherwise.
  servicios: {
    cafe: true, agua: true, banos: true, comida: null, impresiones: null, pizarra: null,
    pantalla_tv: null, proyector: null, estacionamiento: null, terraza: null, pet_friendly: null,
    accesibilidad: null,
  },
  ambiente: null,
  tipo_espacio: [],
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  wifi_rapido: 'WiFi rápido',
  enchufes: 'Enchufes',
  mesas_comodas: 'Mesas cómodas',
  iluminacion: 'Buena iluminación',
  clima: 'Aire acondicionado / calefacción',
  senal_movil: 'Buena señal móvil',
  videollamadas: 'Videollamadas',
  zona_tranquila: 'Zona tranquila',
  booth: 'Booth / espacio privado',
  sala_reuniones: 'Sala de reuniones',
  cafe: 'Café',
  agua: 'Agua',
  banos: 'Baños',
  comida: 'Comida / snacks',
  impresiones: 'Impresiones',
  pizarra: 'Pizarra',
  pantalla_tv: 'Pantalla / TV',
  proyector: 'Proyector',
  estacionamiento: 'Estacionamiento',
  terraza: 'Terraza / aire libre',
  pet_friendly: 'Pet friendly',
  accesibilidad: 'Accesibilidad',
  muy_silencioso: 'Muy silencioso',
  tranquilo: 'Tranquilo',
  moderado: 'Moderado',
  animado: 'Animado',
  mesa_individual: 'Mesa individual',
  mesa_grupal: 'Mesa grupal',
  barra: 'Barra',
  sofa: 'Sofá',
  sala_privada: 'Sala privada',
  terraza_exterior: 'Terraza / exterior',
}

export const AMENITY_GROUP_LABELS: Record<keyof AmenitiesData, string> = {
  para_trabajar: 'Para trabajar',
  para_llamadas: 'Para llamadas',
  servicios: 'Servicios',
  ambiente: 'Ambiente',
  tipo_espacio: 'Tipo de espacio',
}

// Normalizes whatever raw jsonb comes back from Supabase (typically '{}' today,
// since no seed script populates this column) into a fully-shaped AmenitiesData
// where every leaf is a real boolean/string/array or null — never undefined.
// Called at the data-layer boundary (lib/data/spaces.ts) so every consumer
// downstream can trust SpaceRecord.amenities is actually well-formed, not
// just typed that way.
export function parseAmenities(raw: unknown): AmenitiesData {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof AmenitiesData, unknown>>

  function parseGroup<T extends Record<string, boolean | null>>(defaults: T, group: unknown): T {
    const src = (group && typeof group === 'object' ? group : {}) as Record<string, unknown>
    const result = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = src[key as string]
      result[key] = (typeof value === 'boolean' ? value : defaults[key]) as T[keyof T]
    }
    return result
  }

  function parseAmbiente(value: unknown): AmbienteValue | null {
    return typeof value === 'string' && (AMBIENTE_VALUES as string[]).includes(value)
      ? (value as AmbienteValue)
      : null
  }

  function parseTipoEspacio(value: unknown): TipoEspacioValue[] {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is TipoEspacioValue => (TIPO_ESPACIO_VALUES as string[]).includes(item))
  }

  return {
    para_trabajar: parseGroup(DEFAULT_AMENITIES.para_trabajar, source.para_trabajar),
    para_llamadas: parseGroup(DEFAULT_AMENITIES.para_llamadas, source.para_llamadas),
    servicios: parseGroup(DEFAULT_AMENITIES.servicios, source.servicios),
    ambiente: parseAmbiente(source.ambiente),
    tipo_espacio: parseTipoEspacio(source.tipo_espacio),
  }
}

export function averageKnownAmenities(group: Record<string, boolean | null>): number | null {
  const known = Object.values(group).filter((value): value is boolean => value !== null)
  if (known.length === 0) return null
  const trueCount = known.filter(Boolean).length
  return (trueCount / known.length) * 100
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx vitest run lib/amenities/types.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add lib/amenities/types.ts lib/amenities/types.test.ts
git commit -m "feat: expand amenities to 5 groups (ambiente, tipo_espacio)"
```

---

### Task 2: Fix `groupedAmenityEntries` for the new shape

**Files:**
- Modify: `lib/amenities/groupedAmenityEntries.ts`
- Test: `lib/amenities/groupedAmenityEntries.test.ts`

**Interfaces:**
- Consumes: `AMENITY_GROUP_LABELS`, `AMENITY_LABELS`, `DEFAULT_AMENITIES`, `AmenitiesData` (Task 1).
- Produces: `groupedAmenityEntries(amenities: AmenitiesData): AmenityGroupEntries[]` (unchanged
  signature — now restricted to the 3 boolean groups only), `AmenityEntry`, `AmenityGroupEntries`
  (unchanged shapes). Task 5 (AmenitiesSection) consumes this.

- [ ] **Step 1: Add a regression test locking in the boolean-groups-only contract**

Add this test to the end of the `describe('groupedAmenityEntries', ...)` block in
`lib/amenities/groupedAmenityEntries.test.ts` (keep every existing test in the file as-is):

```ts
  it('excludes ambiente and tipo_espacio — they have their own dedicated UI, not this entry shape', () => {
    const groups = groupedAmenityEntries(DEFAULT_AMENITIES)
    const groupKeys = groups.map((g) => g.groupKey)
    expect(groupKeys).not.toContain('ambiente')
    expect(groupKeys).not.toContain('tipo_espacio')
  })
```

- [ ] **Step 2: Run the full test file to verify it fails**

Run: `npx vitest run lib/amenities/groupedAmenityEntries.test.ts`
Expected: FAIL — every test in this file throws, because `groupedAmenityEntries` still iterates
`Object.keys(DEFAULT_AMENITIES)` (now 5 keys) and calls `Object.entries(null)` for `ambiente`,
which throws a `TypeError`.

- [ ] **Step 3: Restrict `groupedAmenityEntries` to the 3 boolean groups**

Replace `lib/amenities/groupedAmenityEntries.ts` with:

```ts
import { AMENITY_GROUP_LABELS, AMENITY_LABELS, DEFAULT_AMENITIES, type AmenitiesData } from './types'

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

// Only the boolean-leaf groups — `ambiente` (a single string) and
// `tipo_espacio` (a string array) don't fit this true/false/null entry
// shape and are rendered by their own dedicated UI instead (see
// AmenitiesSection and the admin AmenitiesEditorForm).
const BOOLEAN_GROUP_KEYS = ['para_trabajar', 'para_llamadas', 'servicios'] as const

export function groupedAmenityEntries(amenities: AmenitiesData): AmenityGroupEntries[] {
  const safe = amenities ?? DEFAULT_AMENITIES
  return BOOLEAN_GROUP_KEYS.map((groupKey) => ({
    groupKey,
    groupLabel: AMENITY_GROUP_LABELS[groupKey],
    entries: Object.entries(safe[groupKey] ?? DEFAULT_AMENITIES[groupKey]).map(([key, value]) => ({
      key,
      label: AMENITY_LABELS[key] ?? key,
      value: value as boolean | null,
    })),
  }))
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx vitest run lib/amenities/groupedAmenityEntries.test.ts`
Expected: PASS (all tests green, including the new one from Step 1)

- [ ] **Step 5: Commit**

```bash
git add lib/amenities/groupedAmenityEntries.ts lib/amenities/groupedAmenityEntries.test.ts
git commit -m "fix: restrict groupedAmenityEntries to the 3 boolean amenity groups"
```

---

### Task 3: Remap the `clima` icon, confirm new keys fall back gracefully

**Files:**
- Modify: `components/space/AmenityIcon.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (icon lookup is keyed by plain string, no type import).
- Produces: `AmenityIcon({ name, className })` — unchanged signature. Task 4 and Task 5 both render
  it for the renamed/new keys.

No dedicated test file exists for this presentational component (confirmed — none did before this
plan either); a passing `npx tsc --noEmit` in Task 6 is this task's verification.

- [ ] **Step 1: Rename the `aire_acondicionado` icon entry to `clima`**

In `components/space/AmenityIcon.tsx`, the `AMENITY_ICON_SRC` map currently has:

```ts
  aire_acondicionado: '/icons/amenity-aire-acondicionado.png',
```

Replace that one line with:

```ts
  clima: '/icons/amenity-aire-acondicionado.png',
```

Leave every other entry in `AMENITY_ICON_SRC` unchanged. Do not add entries for `senal_movil`,
`comida`, or `pantalla_tv` — no artwork exists for them yet, and the component already falls back to
a generic dot (`<span className="... bg-current opacity-60" />`) for any unmapped `name`, so they
render correctly without one.

- [ ] **Step 2: Commit**

```bash
git add components/space/AmenityIcon.tsx
git commit -m "fix: remap aire_acondicionado icon to the renamed clima key"
```

---

### Task 4: Admin amenities editor

**Files:**
- Create: `app/admin/espacios/[slug]/AmenitiesEditorForm.tsx`
- Modify: `app/admin/espacios/[slug]/actions.ts`
- Modify: `app/admin/espacios/[slug]/page.tsx`

**Interfaces:**
- Consumes: `AmenitiesData`, `AmbienteValue`, `TipoEspacioValue`, `AMBIENTE_VALUES`,
  `TIPO_ESPACIO_VALUES`, `AMENITY_LABELS`, `AMENITY_GROUP_LABELS` (Task 1); the existing
  `requireAdmin()` and `createAdminSupabaseClient()` already in `actions.ts`.
- Produces: `updateAmenities(spaceId: string, slug: string, amenities: AmenitiesData): Promise<void>`
  (new server action) and `<AmenitiesEditorForm spaceId slug initialAmenities>` (new component) —
  nothing later in this plan depends on these, but they complete spec §3.

No automated test — per spec §5, server actions aren't unit-tested elsewhere in this repo (matches
the existing `updateVerification`, which also has none). Verify manually in Step 4.

- [ ] **Step 1: Add the `updateAmenities` server action**

In `app/admin/espacios/[slug]/actions.ts`, add this import at the top (alongside the existing ones):

```ts
import type { AmenitiesData } from '@/lib/amenities/types'
```

Then add this function at the end of the file, after `updateVerification`:

```ts
export async function updateAmenities(spaceId: string, slug: string, amenities: AmenitiesData) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('spaces').update({ amenities }).eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
}
```

- [ ] **Step 2: Create the editor component**

Create `app/admin/espacios/[slug]/AmenitiesEditorForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import {
  AMBIENTE_VALUES,
  AMENITY_GROUP_LABELS,
  AMENITY_LABELS,
  TIPO_ESPACIO_VALUES,
  type AmenitiesData,
  type TipoEspacioValue,
} from '@/lib/amenities/types'
import { updateAmenities } from './actions'

interface AmenitiesEditorFormProps {
  spaceId: string
  slug: string
  initialAmenities: AmenitiesData
}

type BooleanGroupKey = 'para_trabajar' | 'para_llamadas' | 'servicios'
const BOOLEAN_GROUPS: BooleanGroupKey[] = ['para_trabajar', 'para_llamadas', 'servicios']

const TRI_STATE_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: 'Sí', value: true },
  { label: 'No', value: false },
  { label: 'Desconocido', value: null },
]

function TriStateRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (next: boolean | null) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-2.5 text-sm">
      <span>{label}</span>
      <div className="flex gap-1">
        {TRI_STATE_OPTIONS.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              value === option.value
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:border-black'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AmenitiesEditorForm({ spaceId, slug, initialAmenities }: AmenitiesEditorFormProps) {
  const [amenities, setAmenities] = useState<AmenitiesData>(initialAmenities)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setBoolean(group: BooleanGroupKey, key: string, value: boolean | null) {
    setAmenities((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value } as AmenitiesData[BooleanGroupKey],
    }))
  }

  function toggleTipoEspacio(value: TipoEspacioValue) {
    setAmenities((current) => ({
      ...current,
      tipo_espacio: current.tipo_espacio.includes(value)
        ? current.tipo_espacio.filter((item) => item !== value)
        : [...current.tipo_espacio, value],
    }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateAmenities(spaceId, slug, amenities)
      setSaved(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">Amenities</h2>

      {BOOLEAN_GROUPS.map((group) => (
        <div key={group} className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {AMENITY_GROUP_LABELS[group]}
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {Object.keys(amenities[group]).map((key) => (
              <TriStateRow
                key={key}
                label={AMENITY_LABELS[key] ?? key}
                value={amenities[group][key]}
                onChange={(value) => setBoolean(group, key, value)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMBIENTE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmenities((current) => ({ ...current, ambiente: value }))}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                amenities.ambiente === value
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-black'
              }`}
            >
              {AMENITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo de espacio</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIPO_ESPACIO_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTipoEspacio(value)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                amenities.tipo_espacio.includes(value)
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-black'
              }`}
            >
              {AMENITY_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar amenities'}
      </button>
      {saved && <p className="mt-2 text-sm text-green-700">Guardado.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  )
}
```

- [ ] **Step 3: Wire it into the admin space page**

In `app/admin/espacios/[slug]/page.tsx`, add the import:

```ts
import { AmenitiesEditorForm } from './AmenitiesEditorForm'
```

Then add the component right after the existing `<VerificationForm ... />` (inside the same
`<div className="mx-auto max-w-xl px-4 py-10">` wrapper):

```tsx
      <AmenitiesEditorForm
        spaceId={space.id}
        slug={space.slug}
        initialAmenities={space.amenities}
      />
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in as the admin account, visit `/admin/espacios/<any-slug>`.
Expected: below the existing "Amenities confirmadas" checklist, a new "Amenities" section renders
with Sí/No/Desconocido rows for every boolean attribute, an Ambiente radio row, a Tipo de espacio
checkbox row, and a working "Guardar amenities" button (toggle a value, save, reload the page,
confirm the change persisted).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/espacios/[slug]/AmenitiesEditorForm.tsx" "app/admin/espacios/[slug]/actions.ts" "app/admin/espacios/[slug]/page.tsx"
git commit -m "feat: add admin editor for the full amenities data model"
```

---

### Task 5: Ficha compact/priority display with "Ver todos"

**Files:**
- Modify: `components/space/AmenitiesSection.tsx`
- Modify: `components/discovery/SpaceDetailPanel.tsx`
- Modify: `app/spaces/[slug]/page.tsx`

**Interfaces:**
- Consumes: `groupedAmenityEntries`, `AmenityEntry` (Task 2); `AmenityIcon` (Task 3);
  `AMENITY_LABELS`, `AmenitiesData` (Task 1); the existing `formatPriceLevel`/`priceLevel` local
  variable already present in both modified pages.
- Produces: `<AmenitiesSection amenities={...} />` — same prop signature as before, no other file
  calls it besides the two modified here.

No automated test existed for this component before this plan either (presentational, verified
manually).

- [ ] **Step 1: Rewrite `AmenitiesSection.tsx` with compact + "Ver todos" modes**

Replace `components/space/AmenitiesSection.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { groupedAmenityEntries, type AmenityEntry } from '@/lib/amenities/groupedAmenityEntries'
import { AmenityIcon } from '@/components/space/AmenityIcon'
import { AMENITY_LABELS, type AmenitiesData } from '@/lib/amenities/types'

interface AmenitiesSectionProps {
  amenities: AmenitiesData
}

const CHIP_BASE = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium'

const CHIP_STATE = {
  available: `${CHIP_BASE} border-black bg-black text-white`,
  unavailable: `${CHIP_BASE} border-gray-200 bg-white text-gray-400`,
  // Most amenities are unknown until Google or the community confirms them —
  // dashed, but legible (not washed out), since these are exactly the chips
  // a user will eventually tap to confirm and earn Rewards for.
  unknown: `${CHIP_BASE} border-dashed border-gray-300 bg-white text-gray-500`,
}

function AmenityChip({ entry }: { entry: AmenityEntry }) {
  const state = entry.value === true ? 'available' : entry.value === false ? 'unavailable' : 'unknown'
  return (
    <span className={CHIP_STATE[state]} title={state === 'unknown' ? 'Información no disponible' : undefined}>
      <AmenityIcon name={entry.key} className={`h-3 w-3 flex-none ${state === 'available' ? 'invert' : ''}`} />
      <span className={state === 'unavailable' ? 'line-through decoration-gray-300' : ''}>{entry.label}</span>
    </span>
  )
}

function AmenityGroupRow({ title, entries }: { title: string; entries: AmenityEntry[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h4>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {entries.map((entry) => (
          <AmenityChip key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function findEntry(
  groups: { groupKey: string; entries: AmenityEntry[] }[],
  groupKey: string,
  key: string
): AmenityEntry {
  const entry = groups.find((group) => group.groupKey === groupKey)?.entries.find((item) => item.key === key)
  return entry ?? { key, label: AMENITY_LABELS[key] ?? key, value: null }
}

const COMODIDAD_KEYS = ['mesas_comodas', 'iluminacion', 'clima']
const SERVICIOS_PRINCIPALES_KEYS = ['cafe', 'agua', 'banos', 'estacionamiento']
const SERVICIOS_RESTO_KEYS = [
  'comida', 'impresiones', 'pizarra', 'pantalla_tv', 'proyector', 'terraza', 'pet_friendly', 'accesibilidad',
]

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const groups = groupedAmenityEntries(amenities)

  const wifi = findEntry(groups, 'para_trabajar', 'wifi')
  const enchufes = findEntry(groups, 'para_trabajar', 'enchufes')
  const wifiRapido = findEntry(groups, 'para_trabajar', 'wifi_rapido')
  const senalMovil = findEntry(groups, 'para_trabajar', 'senal_movil')
  const comodidadEntries = COMODIDAD_KEYS.map((key) => findEntry(groups, 'para_trabajar', key))
  const llamadasEntries = groups.find((group) => group.groupKey === 'para_llamadas')?.entries ?? []
  const serviciosPrincipales = SERVICIOS_PRINCIPALES_KEYS.map((key) => findEntry(groups, 'servicios', key))
  const serviciosResto = SERVICIOS_RESTO_KEYS.map((key) => findEntry(groups, 'servicios', key))

  return (
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        <AmenityChip entry={wifi} />
        <AmenityChip entry={enchufes} />
      </div>

      {amenities.ambiente && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ambiente</h4>
          <div className="mt-2.5">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
              {AMENITY_LABELS[amenities.ambiente] ?? amenities.ambiente}
            </span>
          </div>
        </div>
      )}

      <AmenityGroupRow title="Comodidad" entries={comodidadEntries} />
      <AmenityGroupRow title="Llamadas" entries={llamadasEntries} />
      <AmenityGroupRow title="Servicios principales" entries={serviciosPrincipales} />

      {expanded && (
        <>
          <AmenityGroupRow title="Más para trabajar" entries={[wifiRapido, senalMovil]} />
          <AmenityGroupRow title="Más servicios" entries={serviciosResto} />
          {amenities.tipo_espacio.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo de espacio</h4>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {amenities.tipo_espacio.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700"
                  >
                    {AMENITY_LABELS[value] ?? value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="self-start text-xs font-semibold text-gray-500 underline hover:text-black"
      >
        {expanded ? 'Ver menos' : 'Ver todos'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add the Precio line in `SpaceDetailPanel.tsx`**

In `components/discovery/SpaceDetailPanel.tsx`, find:

```tsx
        <h3 className="mt-8 text-lg font-bold tracking-tight">Amenities</h3>
        <AmenitiesSection amenities={space.amenities} />
```

Replace with:

```tsx
        <h3 className="mt-8 text-lg font-bold tracking-tight">Amenities</h3>
        {priceLevel && <p className="mt-2 text-sm font-medium text-gray-600">Precio: {priceLevel}</p>}
        <AmenitiesSection amenities={space.amenities} />
```

(`priceLevel` is already defined earlier in this component as `const priceLevel =
formatPriceLevel(space.price_level)` — no new import or variable needed.)

- [ ] **Step 3: Add the Precio line in `app/spaces/[slug]/page.tsx`**

In `app/spaces/[slug]/page.tsx`, find:

```tsx
      <h2 className="mt-10 text-xl font-bold tracking-tight">Amenities</h2>
      <AmenitiesSection amenities={space.amenities} />
```

Replace with:

```tsx
      <h2 className="mt-10 text-xl font-bold tracking-tight">Amenities</h2>
      {priceLevel && <p className="mt-2 text-sm font-medium text-gray-600">Precio: {priceLevel}</p>}
      <AmenitiesSection amenities={space.amenities} />
```

(Same as Step 2 — `priceLevel` already exists in this file's scope.)

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in (space fichas require login per the earlier login-gate change), visit any
`/spaces/[slug]`.
Expected: Amenities shows only Wi-Fi, Enchufes, Ambiente (if set), Comodidad, Llamadas, and Servicios
principales by default — no Work Score, no Tipo de espacio, no full servicios list. Clicking "Ver
todos" reveals WiFi rápido, Buena señal móvil, the remaining servicios, and Tipo de espacio (if any
are set); clicking "Ver menos" collapses it back. Repeat on `/near-me`'s map ficha
(`SpaceDetailPanel`) to confirm the same behavior there.

- [ ] **Step 5: Commit**

```bash
git add components/space/AmenitiesSection.tsx components/discovery/SpaceDetailPanel.tsx "app/spaces/[slug]/page.tsx"
git commit -m "feat: compact amenities view on the ficha with a Ver todos expansion"
```

(Note: `app/spaces/[slug]/page.tsx` needs quoting in the `git add` command — bash treats `[slug]` as
a glob pattern otherwise.)

---

### Task 6: Full regression pass and deploy

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean)

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass, including every file touched in Tasks 1–2

- [ ] **Step 3: Production build**

Run: `npx next build`
Expected: build succeeds with no type/lint errors

- [ ] **Step 4: Push**

```bash
git push aittrocom main
```

Expected: push succeeds; Vercel's Git integration on `aittrocom-blip/workcofy` picks it up and
starts a new Production deployment automatically (same as every prior push this session).
