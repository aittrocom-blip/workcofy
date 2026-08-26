# Workcofy Core Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Workcofy Phase 1 core discovery experience — home page, map + list discovery view, filters, district pages, near-me, and space detail pages — backed by a real Supabase schema and a swappable Google/Mock places+map data layer.

**Architecture:** Next.js 14 (App Router) + TypeScript app reading from a single Supabase `spaces` table via a thin server-side data layer. A `MapView` component picks between a real `GoogleMapAdapter` and a key-less `MockMapAdapter` (MapLibre) based on env var presence; the same swap applies to how the table gets seeded (real Google Places script vs. mock fixtures), never to how pages query it.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`), `@vis.gl/react-google-maps`, `maplibre-gl`, Vitest + Testing Library, `tsx` for scripts, npm.

**Spec:** `docs/superpowers/specs/2026-08-26-workcofy-core-discovery-design.md`

## Global Constraints

- Brand name is always **WORKCOFY** — never "WORK COFY", "WORKCOFFY", "WORKCOFFEE", "WORKCOFI" (spec §2).
- All user-facing copy is in Spanish, matching the exact strings given in the spec (§5, §7, §9, §11, §19).
- Never fabricate production business data (addresses, ratings, hours, place IDs). Mock fixtures are isolated in dedicated files, clearly commented as dev-only, and never written to the DB by the real seed script.
- Visual palette: black/white/gray only, moderate border radii, subtle shadows (spec §2, §30).
- No login, reservations, payments, internal reviews, chat, marketplace, loyalty, or native app in this phase (spec §32).
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is the only key exposed to the client (secured via HTTP-referrer restriction, per Google's own design). `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_MAPS_SERVER_API_KEY` are server-only and must never be imported into a client (`'use client'`) file.
- Package manager: npm. Framework: Next.js 14 App Router + TypeScript. Styling: Tailwind CSS 3.
- District route slugs use hyphens (`san-isidro`); stored DB values use underscores (`san_isidro`).
- Every task ends with a commit.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `public/logo-solo.png`, `public/logov1.png` (copied from `logo/`)

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm test` toolchain that every later task builds on. Path alias `@/*` maps to the project root.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "workcofy",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "seed:mock": "tsx scripts/seed-mock.ts",
    "seed:google": "tsx scripts/seed-google-places.ts"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.0",
    "@vis.gl/react-google-maps": "^1.1.0",
    "maplibre-gl": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.5",
    "vitest": "^2.0.5",
    "@vitejs/plugin-react": "^4.3.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.8",
    "jsdom": "^24.1.1",
    "tsx": "^4.16.5"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'maps.googleapis.com' }],
  },
}

export default nextConfig
```

- [ ] **Step 4: Write `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        workcofy: { black: '#0a0a0a', gray: '#6b7280' },
      },
    },
  },
  plugins: [],
}

export default config
```

```js
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Write `vitest.config.ts` and `vitest.setup.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
})
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Write `.env.example` and `.gitignore`**

```
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=
```

```
# .gitignore
node_modules
.next
.env
.env.local
*.tsbuildinfo
```

- [ ] **Step 7: Write placeholder `app/layout.tsx` and `app/page.tsx`** (replaced with real content in Tasks 15 and 18)

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Workcofy',
  description: 'Encuentra dónde trabajar, reunirte y crear.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/page.tsx
export default function HomePage() {
  return <main className="p-8">Workcofy — próximamente</main>
}
```

- [ ] **Step 8: Copy logo assets into `public/`**

```bash
mkdir -p public
cp logo/logo-solo.png public/logo-solo.png
cp logo/logov1.png public/logov1.png
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `package-lock.json`.

- [ ] **Step 10: Verify the toolchain builds**

Run: `npm run build`
Expected: Next.js production build succeeds with the placeholder page.

- [ ] **Step 11: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Workcofy Next.js project"
```

---

### Task 2: Domain constants — districts and categories

**Files:**
- Create: `lib/districts.ts`
- Create: `lib/districts.test.ts`
- Create: `lib/categories.ts`
- Create: `lib/categories.test.ts`

**Interfaces:**
- Consumes: nothing (pure constants).
- Produces: `DistrictSlug`, `DistrictValue`, `DISTRICTS: {slug, value, label}[]`, `DISTRICT_CENTROIDS: Record<DistrictValue, {lat,lng}>`, `districtValueFromSlug(slug): DistrictValue|null`, `districtSlugFromValue(value): DistrictSlug|null`, `districtLabel(value): string` from `lib/districts.ts`. `CategoryValue`, `CategoryOption`, `CATEGORY_OPTIONS: CategoryOption[]`, `ACTIVE_CATEGORY_VALUES: CategoryValue[]` from `lib/categories.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/districts.test.ts
import { describe, expect, it } from 'vitest'
import { districtValueFromSlug, districtSlugFromValue, districtLabel, DISTRICTS } from './districts'

describe('districts', () => {
  it('lists exactly the three launch districts', () => {
    expect(DISTRICTS.map((d) => d.value)).toEqual(['miraflores', 'san_isidro', 'barranco'])
  })

  it('maps a hyphenated slug to its underscore db value', () => {
    expect(districtValueFromSlug('san-isidro')).toBe('san_isidro')
  })

  it('returns null for an unknown slug', () => {
    expect(districtValueFromSlug('surco')).toBeNull()
  })

  it('maps a db value back to its route slug', () => {
    expect(districtSlugFromValue('san_isidro')).toBe('san-isidro')
  })

  it('returns a human label for a db value', () => {
    expect(districtLabel('san_isidro')).toBe('San Isidro')
  })
})
```

```ts
// lib/categories.test.ts
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS, ACTIVE_CATEGORY_VALUES } from './categories'

describe('categories', () => {
  it('marks only cafe and work_cafe as active', () => {
    expect(ACTIVE_CATEGORY_VALUES).toEqual(['cafe', 'work_cafe'])
  })

  it('includes reserved future categories as inactive', () => {
    const coworking = CATEGORY_OPTIONS.find((c) => c.value === 'coworking')
    expect(coworking?.active).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/districts.test.ts lib/categories.test.ts`
Expected: FAIL — modules `./districts` and `./categories` do not exist yet.

- [ ] **Step 3: Write `lib/districts.ts`**

```ts
export type DistrictSlug = 'miraflores' | 'san-isidro' | 'barranco'
export type DistrictValue = 'miraflores' | 'san_isidro' | 'barranco'

export const DISTRICTS: { slug: DistrictSlug; value: DistrictValue; label: string }[] = [
  { slug: 'miraflores', value: 'miraflores', label: 'Miraflores' },
  { slug: 'san-isidro', value: 'san_isidro', label: 'San Isidro' },
  { slug: 'barranco', value: 'barranco', label: 'Barranco' },
]

export const DISTRICT_CENTROIDS: Record<DistrictValue, { lat: number; lng: number }> = {
  miraflores: { lat: -12.1211, lng: -77.0295 },
  san_isidro: { lat: -12.0969, lng: -77.0367 },
  barranco: { lat: -12.1481, lng: -77.0219 },
}

export function districtValueFromSlug(slug: string): DistrictValue | null {
  return DISTRICTS.find((d) => d.slug === slug)?.value ?? null
}

export function districtSlugFromValue(value: string): DistrictSlug | null {
  return DISTRICTS.find((d) => d.value === value)?.slug ?? null
}

export function districtLabel(value: string): string {
  return DISTRICTS.find((d) => d.value === value)?.label ?? value
}
```

- [ ] **Step 4: Write `lib/categories.ts`**

```ts
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
  { value: 'meeting_room', label: 'Reuniones', active: false },
  { value: 'workshop', label: 'Workshops', active: false },
  { value: 'event', label: 'Eventos', active: false },
]

export const ACTIVE_CATEGORY_VALUES: CategoryValue[] = CATEGORY_OPTIONS.filter(
  (c) => c.active
).map((c) => c.value)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/districts.test.ts lib/categories.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/districts.ts lib/districts.test.ts lib/categories.ts lib/categories.test.ts
git commit -m "feat: add district and category domain constants"
```

---

### Task 3: Haversine distance util

**Files:**
- Create: `lib/geo/haversine.ts`
- Create: `lib/geo/haversine.test.ts`

**Interfaces:**
- Produces: `LatLng {lat:number; lng:number}`, `haversineDistanceKm(a: LatLng, b: LatLng): number`, `formatDistanceKm(km: number): string`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/geo/haversine.test.ts
import { describe, expect, it } from 'vitest'
import { haversineDistanceKm, formatDistanceKm } from './haversine'

describe('haversineDistanceKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceKm({ lat: -12.12, lng: -77.03 }, { lat: -12.12, lng: -77.03 })).toBe(0)
  })

  it('matches the known ~111.2km per degree of longitude at the equator', () => {
    const km = haversineDistanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })
    expect(km).toBeCloseTo(111.2, 0)
  })
})

describe('formatDistanceKm', () => {
  it('formats to one decimal with a km suffix', () => {
    expect(formatDistanceKm(1.234)).toBe('1.2 km')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/geo/haversine.test.ts`
Expected: FAIL — module `./haversine` does not exist.

- [ ] **Step 3: Write `lib/geo/haversine.ts`**

```ts
const EARTH_RADIUS_KM = 6371

export interface LatLng {
  lat: number
  lng: number
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)))
  return EARTH_RADIUS_KM * c
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/geo/haversine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/geo/haversine.ts lib/geo/haversine.test.ts
git commit -m "feat: add haversine distance util"
```

---

### Task 4: Slug generation util

**Files:**
- Create: `lib/slug.ts`
- Create: `lib/slug.test.ts`

**Interfaces:**
- Produces: `slugify(input: string): string`, `generateSpaceSlug(name: string, districtSlug: string): string`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/slug.test.ts
import { describe, expect, it } from 'vitest'
import { slugify, generateSpaceSlug } from './slug'

describe('slugify', () => {
  it('removes accents and lowercases', () => {
    expect(slugify('Café')).toBe('cafe')
  })

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('El Pan de la Chola — Pan & Café')).toBe('el-pan-de-la-chola-pan-cafe')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  Rue  ')).toBe('rue')
  })
})

describe('generateSpaceSlug', () => {
  it('joins the slugified name and district slug', () => {
    expect(generateSpaceSlug('Neira Café Lab', 'miraflores')).toBe('neira-cafe-lab-miraflores')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/slug.test.ts`
Expected: FAIL — module `./slug` does not exist.

- [ ] **Step 3: Write `lib/slug.ts`**

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSpaceSlug(name: string, districtSlug: string): string {
  return `${slugify(name)}-${slugify(districtSlug)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/slug.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/slug.ts lib/slug.test.ts
git commit -m "feat: add slug generation util"
```

---

### Task 5: Opening hours util

**Files:**
- Create: `lib/hours/openingHours.ts`
- Create: `lib/hours/openingHours.test.ts`

**Interfaces:**
- Produces: `OpeningPeriod`, `OpeningHours {periods: OpeningPeriod[]}`, `DAY_LABELS: string[]` (index 0=Domingo..6=Sábado), `WEEK_DISPLAY_ORDER: number[]` (Monday-first display order), `isOpenNow(hours, now: Date): boolean`, `formatPeriodForDay(hours, day: number): string`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/hours/openingHours.test.ts
import { describe, expect, it } from 'vitest'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from './openingHours'
import type { OpeningHours } from './openingHours'

function weekdayHours(day: number): OpeningHours {
  return { periods: [{ open: { day, time: '0800' }, close: { day, time: '2000' } }] }
}

describe('isOpenNow', () => {
  it('is false when hours are missing', () => {
    expect(isOpenNow(null, new Date(2026, 7, 24, 10, 0))).toBe(false)
  })

  it('is true within the open period on the matching day', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    expect(isOpenNow(weekdayHours(now.getDay()), now)).toBe(true)
  })

  it('is false outside the open period on the matching day', () => {
    const now = new Date(2026, 7, 24, 21, 0)
    expect(isOpenNow(weekdayHours(now.getDay()), now)).toBe(false)
  })

  it('is false on a day with no period', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const otherDay = (now.getDay() + 1) % 7
    expect(isOpenNow(weekdayHours(otherDay), now)).toBe(false)
  })
})

describe('formatPeriodForDay', () => {
  it('formats an open period as HH:MM – HH:MM', () => {
    expect(formatPeriodForDay(weekdayHours(1), 1)).toBe('08:00 – 20:00')
  })

  it('returns Cerrado for a day with no period', () => {
    expect(formatPeriodForDay(weekdayHours(1), 2)).toBe('Cerrado')
  })

  it('returns a message when hours are missing entirely', () => {
    expect(formatPeriodForDay(null, 1)).toBe('Horario no disponible')
  })
})

describe('DAY_LABELS and WEEK_DISPLAY_ORDER', () => {
  it('has 7 Spanish day labels indexed Sunday-first to match Google day numbering', () => {
    expect(DAY_LABELS[0]).toBe('Domingo')
    expect(DAY_LABELS[1]).toBe('Lunes')
  })

  it('displays Monday through Sunday in that order', () => {
    expect(WEEK_DISPLAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/hours/openingHours.test.ts`
Expected: FAIL — module `./openingHours` does not exist.

- [ ] **Step 3: Write `lib/hours/openingHours.ts`**

```ts
export interface OpeningPeriod {
  open: { day: number; time: string } // day: 0=Sunday..6=Saturday, time: "HHMM"
  close: { day: number; time: string } | null // null = open 24h that day
}

export interface OpeningHours {
  periods: OpeningPeriod[]
}

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function timeToMinutes(time: string): number {
  return parseInt(time.slice(0, 2), 10) * 60 + parseInt(time.slice(2), 10)
}

export function isOpenNow(hours: OpeningHours | null | undefined, now: Date): boolean {
  if (!hours || hours.periods.length === 0) return false
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()

  return hours.periods.some((period) => {
    if (!period.close) return period.open.day === day
    const openDay = period.open.day
    const closeDay = period.close.day
    const openMinutes = timeToMinutes(period.open.time)
    const closeMinutes = timeToMinutes(period.close.time)

    if (openDay === closeDay) {
      return day === openDay && minutes >= openMinutes && minutes < closeMinutes
    }
    if (day === openDay && minutes >= openMinutes) return true
    if (day === closeDay && minutes < closeMinutes) return true
    return false
  })
}

export function formatPeriodForDay(hours: OpeningHours | null | undefined, day: number): string {
  if (!hours) return 'Horario no disponible'
  const period = hours.periods.find((p) => p.open.day === day)
  if (!period) return 'Cerrado'
  if (!period.close) return 'Abierto 24 horas'
  const format = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`
  return `${format(period.open.time)} – ${format(period.close.time)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/hours/openingHours.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/hours/openingHours.ts lib/hours/openingHours.test.ts
git commit -m "feat: add opening hours util"
```

---

### Task 6: Supabase clients, space types, and DB migration

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/data/spaceTypes.ts`
- Create: `supabase/migrations/0001_create_spaces.sql`

**Interfaces:**
- Consumes: `OpeningHours` from `lib/hours/openingHours.ts` (Task 5).
- Produces: `createServerSupabaseClient()` and `createAdminSupabaseClient()` (both throw if required env vars are missing). `SpacePhoto {photo_reference, width, height}`, `SpaceRecord` (full row shape matching the migration), `SpaceWithDistance = SpaceRecord & {distanceKm: number|null}` from `lib/data/spaceTypes.ts`.

This task has no automated test — it is thin, environment-dependent glue and a SQL file; the `SpaceRecord` field list is verified for consistency by later tasks' tests importing it. Do not skip writing it correctly.

- [ ] **Step 1: Write `lib/supabase/server.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return createClient(url, anonKey)
}
```

- [ ] **Step 2: Write `lib/supabase/admin.ts`** (server-only — used exclusively by `scripts/*`, never imported from `app/` or `components/`)

```ts
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    )
  }
  return createClient(url, serviceRoleKey)
}
```

- [ ] **Step 3: Write `lib/data/spaceTypes.ts`**

```ts
import type { OpeningHours } from '@/lib/hours/openingHours'

export interface SpacePhoto {
  photo_reference: string
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
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  photos: SpacePhoto[] | null
  description: string | null
  wifi_available: boolean | null
  power_outlets: boolean | null
  laptop_friendly: boolean | null
  meeting_friendly: boolean | null
  workshop_friendly: boolean | null
  event_friendly: boolean | null
  noise_level: string | null
  seating_capacity: number | null
  private_rooms: boolean | null
  outdoor_seating: boolean | null
  parking: boolean | null
  recommended_stay_minutes: number | null
  workcofy_score: number | null
  workcofy_notes: string | null
  partner_status: string
  active: boolean
}

export type SpaceWithDistance = SpaceRecord & { distanceKm: number | null }
```

- [ ] **Step 4: Write `supabase/migrations/0001_create_spaces.sql`**

```sql
create table if not exists spaces (
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
  opening_hours jsonb,
  photos jsonb,
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
  workcofy_score integer check (workcofy_score is null or (workcofy_score between 0 and 100)),
  workcofy_notes text,
  partner_status text not null default 'none' check (partner_status in ('none', 'partner')),

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_district_idx on spaces (district);
create index if not exists spaces_category_idx on spaces (category);
create index if not exists spaces_active_idx on spaces (active);
```

- [ ] **Step 5: Apply the migration against your Supabase project**

Run the SQL file's contents in the Supabase SQL editor (Dashboard → SQL Editor → paste → Run), or via the Supabase CLI if linked: `supabase db push`.
Expected: a `spaces` table exists in your project with the columns above.

- [ ] **Step 6: Verify the project builds with the new files**

Run: `npm run build`
Expected: succeeds (no components use these modules yet, so this only checks for TypeScript errors in the new files themselves via `npx tsc --noEmit`).

- [ ] **Step 7: Commit**

```bash
git add lib/supabase/server.ts lib/supabase/admin.ts lib/data/spaceTypes.ts supabase/migrations/0001_create_spaces.sql
git commit -m "feat: add Supabase clients, space types, and spaces table migration"
```

---

### Task 7: Space query builder and data access layer

**Files:**
- Create: `lib/data/spaceQueryBuilder.ts`
- Create: `lib/data/spaceQueryBuilder.test.ts`
- Create: `lib/data/spaces.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` (Task 6), `SpaceRecord` (Task 6).
- Produces: `SpaceFilters {district?, category?, search?}`, `buildSpaceQueryDescriptor(filters): {eqFilters, searchTerm}` from `spaceQueryBuilder.ts`. `listSpaces(filters?: SpaceFilters): Promise<SpaceRecord[]>`, `getSpaceBySlug(slug: string): Promise<SpaceRecord | null>` from `spaces.ts`.

The Supabase-calling half of `spaces.ts` is thin glue over a well-tested pure query-descriptor builder; it is verified manually once real Supabase credentials are in place (Task 20), consistent with the spec's note that live-integration coverage is a documented gap until credentials/keys exist.

- [ ] **Step 1: Write the failing test for the pure query builder**

```ts
// lib/data/spaceQueryBuilder.test.ts
import { describe, expect, it } from 'vitest'
import { buildSpaceQueryDescriptor } from './spaceQueryBuilder'

describe('buildSpaceQueryDescriptor', () => {
  it('returns no filters for empty input', () => {
    expect(buildSpaceQueryDescriptor({})).toEqual({ eqFilters: [], searchTerm: null })
  })

  it('adds an eq filter for district', () => {
    const result = buildSpaceQueryDescriptor({ district: 'miraflores' })
    expect(result.eqFilters).toEqual([{ column: 'district', value: 'miraflores' }])
  })

  it('adds eq filters for both district and category', () => {
    const result = buildSpaceQueryDescriptor({ district: 'barranco', category: 'cafe' })
    expect(result.eqFilters).toEqual([
      { column: 'district', value: 'barranco' },
      { column: 'category', value: 'cafe' },
    ])
  })

  it('trims and includes a search term', () => {
    expect(buildSpaceQueryDescriptor({ search: '  neira  ' }).searchTerm).toBe('neira')
  })

  it('treats a blank search string as no search', () => {
    expect(buildSpaceQueryDescriptor({ search: '   ' }).searchTerm).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/data/spaceQueryBuilder.test.ts`
Expected: FAIL — module `./spaceQueryBuilder` does not exist.

- [ ] **Step 3: Write `lib/data/spaceQueryBuilder.ts`**

```ts
export interface SpaceFilters {
  district?: string | null
  category?: string | null
  search?: string | null
}

export interface SpaceQueryFilter {
  column: 'district' | 'category'
  value: string
}

export interface SpaceQueryDescriptor {
  eqFilters: SpaceQueryFilter[]
  searchTerm: string | null
}

export function buildSpaceQueryDescriptor(filters: SpaceFilters): SpaceQueryDescriptor {
  const eqFilters: SpaceQueryFilter[] = []
  if (filters.district) eqFilters.push({ column: 'district', value: filters.district })
  if (filters.category) eqFilters.push({ column: 'category', value: filters.category })

  const trimmedSearch = filters.search?.trim()

  return { eqFilters, searchTerm: trimmedSearch ? trimmedSearch : null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/data/spaceQueryBuilder.test.ts`
Expected: PASS

- [ ] **Step 5: Write `lib/data/spaces.ts`**

```ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildSpaceQueryDescriptor, type SpaceFilters } from '@/lib/data/spaceQueryBuilder'
import type { SpaceRecord } from '@/lib/data/spaceTypes'

export type { SpaceFilters }

export async function listSpaces(filters: SpaceFilters = {}): Promise<SpaceRecord[]> {
  const supabase = createServerSupabaseClient()
  const descriptor = buildSpaceQueryDescriptor(filters)

  let query = supabase.from('spaces').select('*').eq('active', true)
  for (const filter of descriptor.eqFilters) {
    query = query.eq(filter.column, filter.value)
  }
  if (descriptor.searchTerm) {
    const term = `%${descriptor.searchTerm}%`
    query = query.or(`name.ilike.${term},address.ilike.${term}`)
  }

  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []) as SpaceRecord[]
}

export async function getSpaceBySlug(slug: string): Promise<SpaceRecord | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to load space "${slug}": ${error.message}`)
  return data as SpaceRecord | null
}
```

- [ ] **Step 6: Verify the project still builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/data/spaceQueryBuilder.ts lib/data/spaceQueryBuilder.test.ts lib/data/spaces.ts
git commit -m "feat: add spaces data access layer"
```

---

### Task 8: Directions URL builder

**Files:**
- Create: `lib/directions.ts`
- Create: `lib/directions.test.ts`

**Interfaces:**
- Consumes: nothing beyond plain `{google_place_id, latitude, longitude}`.
- Produces: `buildDirectionsUrl(space: {google_place_id: string|null; latitude: number|null; longitude: number|null}, origin?: {lat:number; lng:number} | null): string`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/directions.test.ts
import { describe, expect, it } from 'vitest'
import { buildDirectionsUrl } from './directions'

describe('buildDirectionsUrl', () => {
  it('uses destination_place_id when a google_place_id is present', () => {
    const url = buildDirectionsUrl({ google_place_id: 'abc123', latitude: -12.1, longitude: -77.03 })
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination_place_id=abc123')
  })

  it('falls back to lat/lng when there is no place id', () => {
    const url = buildDirectionsUrl({ google_place_id: null, latitude: -12.1, longitude: -77.03 })
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-12.1,-77.03')
  })

  it('includes the origin when provided', () => {
    const url = buildDirectionsUrl(
      { google_place_id: 'abc123', latitude: -12.1, longitude: -77.03 },
      { lat: -12.05, lng: -77.02 }
    )
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination_place_id=abc123&origin=-12.05,-77.02'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/directions.test.ts`
Expected: FAIL — module `./directions` does not exist.

- [ ] **Step 3: Write `lib/directions.ts`**

```ts
interface DirectionsTarget {
  google_place_id: string | null
  latitude: number | null
  longitude: number | null
}

export function buildDirectionsUrl(
  space: DirectionsTarget,
  origin?: { lat: number; lng: number } | null
): string {
  const destination = space.google_place_id
    ? `destination_place_id=${space.google_place_id}`
    : `destination=${space.latitude},${space.longitude}`

  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : ''

  return `https://www.google.com/maps/dir/?api=1&${destination}${originParam}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/directions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/directions.ts lib/directions.test.ts
git commit -m "feat: add Google Maps directions URL builder"
```

---

### Task 9: Discovery filter state and sort helpers

**Files:**
- Create: `lib/filters/discoveryFilters.ts`
- Create: `lib/filters/discoveryFilters.test.ts`
- Create: `lib/filters/sortSpaces.ts`
- Create: `lib/filters/sortSpaces.test.ts`

**Interfaces:**
- Consumes: `SpaceWithDistance` (Task 6), `isOpenNow` (Task 5).
- Produces: `SortOption = 'distance' | 'rating' | 'open_now'`, `DiscoveryFilterState {district, category, search, sort}`, `DEFAULT_DISCOVERY_FILTERS`, `parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilterState`, `serializeDiscoveryFilters(state: Partial<DiscoveryFilterState>): string` from `discoveryFilters.ts`. `sortSpaces(spaces: SpaceWithDistance[], sort: SortOption, now?: Date): SpaceWithDistance[]` from `sortSpaces.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/filters/discoveryFilters.test.ts
import { describe, expect, it } from 'vitest'
import { parseDiscoveryFilters, serializeDiscoveryFilters } from './discoveryFilters'

describe('discoveryFilters', () => {
  it('parses defaults from empty params', () => {
    expect(parseDiscoveryFilters(new URLSearchParams())).toEqual({
      district: null,
      category: null,
      search: null,
      sort: 'rating',
    })
  })

  it('parses all fields from params', () => {
    const params = new URLSearchParams('district=barranco&category=cafe&q=neira&sort=distance')
    expect(parseDiscoveryFilters(params)).toEqual({
      district: 'barranco',
      category: 'cafe',
      search: 'neira',
      sort: 'distance',
    })
  })

  it('round-trips through serialize then parse', () => {
    const state = { district: 'miraflores', category: null, search: 'café', sort: 'open_now' as const }
    const parsed = parseDiscoveryFilters(new URLSearchParams(serializeDiscoveryFilters(state)))
    expect(parsed.district).toBe('miraflores')
    expect(parsed.search).toBe('café')
    expect(parsed.sort).toBe('open_now')
  })
})
```

```ts
// lib/filters/sortSpaces.test.ts
import { describe, expect, it } from 'vitest'
import { sortSpaces } from './sortSpaces'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

function makeSpace(overrides: Partial<SpaceWithDistance>): SpaceWithDistance {
  return {
    id: '1', name: 'Test', slug: 'test', category: 'cafe', district: 'miraflores',
    address: null, latitude: null, longitude: null, google_place_id: null,
    google_maps_url: null, phone: null, website: null, rating: null, review_count: null,
    price_level: null, opening_hours: null, photos: null, description: null,
    wifi_available: null, power_outlets: null, laptop_friendly: null, meeting_friendly: null,
    workshop_friendly: null, event_friendly: null, noise_level: null, seating_capacity: null,
    private_rooms: null, outdoor_seating: null, parking: null, recommended_stay_minutes: null,
    workcofy_score: null, workcofy_notes: null, partner_status: 'none', active: true,
    distanceKm: null,
    ...overrides,
  }
}

describe('sortSpaces', () => {
  it('sorts by distance ascending, with nulls last', () => {
    const spaces = [
      makeSpace({ id: 'a', distanceKm: 2 }),
      makeSpace({ id: 'b', distanceKm: null }),
      makeSpace({ id: 'c', distanceKm: 0.5 }),
    ]
    expect(sortSpaces(spaces, 'distance').map((s) => s.id)).toEqual(['c', 'a', 'b'])
  })

  it('sorts by rating descending, with nulls last', () => {
    const spaces = [
      makeSpace({ id: 'a', rating: 4.2 }),
      makeSpace({ id: 'b', rating: 4.8 }),
      makeSpace({ id: 'c', rating: null }),
    ]
    expect(sortSpaces(spaces, 'rating').map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts open-now spaces before closed ones, using an injected clock', () => {
    const now = new Date(2026, 7, 24, 10, 0)
    const openHours = { periods: [{ open: { day: now.getDay(), time: '0800' }, close: { day: now.getDay(), time: '2000' } }] }
    const spaces = [
      makeSpace({ id: 'closed', opening_hours: null }),
      makeSpace({ id: 'open', opening_hours: openHours }),
    ]
    expect(sortSpaces(spaces, 'open_now', now).map((s) => s.id)).toEqual(['open', 'closed'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/filters/discoveryFilters.test.ts lib/filters/sortSpaces.test.ts`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Write `lib/filters/discoveryFilters.ts`**

```ts
export type SortOption = 'distance' | 'rating' | 'open_now'

export interface DiscoveryFilterState {
  district: string | null
  category: string | null
  search: string | null
  sort: SortOption
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilterState = {
  district: null,
  category: null,
  search: null,
  sort: 'rating',
}

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilterState {
  return {
    district: params.get('district'),
    category: params.get('category'),
    search: params.get('q'),
    sort: (params.get('sort') as SortOption) || DEFAULT_DISCOVERY_FILTERS.sort,
  }
}

export function serializeDiscoveryFilters(state: Partial<DiscoveryFilterState>): string {
  const params = new URLSearchParams()
  if (state.district) params.set('district', state.district)
  if (state.category) params.set('category', state.category)
  if (state.search) params.set('q', state.search)
  if (state.sort) params.set('sort', state.sort)
  return params.toString()
}
```

- [ ] **Step 4: Write `lib/filters/sortSpaces.ts`**

```ts
import { isOpenNow } from '@/lib/hours/openingHours'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'
import type { SortOption } from '@/lib/filters/discoveryFilters'

export function sortSpaces(
  spaces: SpaceWithDistance[],
  sort: SortOption,
  now: Date = new Date()
): SpaceWithDistance[] {
  const copy = [...spaces]

  if (sort === 'distance') {
    copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  } else if (sort === 'rating') {
    copy.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity))
  } else if (sort === 'open_now') {
    copy.sort(
      (a, b) => Number(isOpenNow(b.opening_hours, now)) - Number(isOpenNow(a.opening_hours, now))
    )
  }

  return copy
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/filters/discoveryFilters.test.ts lib/filters/sortSpaces.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/filters/discoveryFilters.ts lib/filters/discoveryFilters.test.ts lib/filters/sortSpaces.ts lib/filters/sortSpaces.test.ts
git commit -m "feat: add discovery filter state and sort helpers"
```

---

### Task 10: Seed targets, mock fixtures, and mock seed script

**Files:**
- Create: `lib/places/seedTargets.ts`
- Create: `lib/places/types.ts`
- Create: `lib/places/mock-fixtures.ts`
- Create: `lib/places/mock-fixtures.test.ts`
- Create: `scripts/seed-mock.ts`

**Interfaces:**
- Consumes: `DistrictValue`, `DISTRICTS`, `DISTRICT_CENTROIDS` (Task 2), `generateSpaceSlug` (Task 4), `SpacePhoto` (Task 6), `createAdminSupabaseClient` (Task 6).
- Produces: `SEED_TARGETS: {name: string; district: DistrictValue}[]` (the canonical 29-café list, imported by both mock and real seed paths) from `seedTargets.ts`. `SeedSpaceInput` (the shape upserted into `spaces`) from `types.ts`. `buildMockSpaceFixtures(): SeedSpaceInput[]` from `mock-fixtures.ts`.

`SEED_TARGETS` is the single source of truth for the 30 café names/districts (including the conditional Barranco "Pan de la Chola" entry, which the real seed script's district-match check will naturally skip if no verifiable branch exists there, per spec §18) — it must not be duplicated in the mock fixtures file or the real seed script (Task 11); both import it.

- [ ] **Step 1: Write `lib/places/seedTargets.ts`**

```ts
import type { DistrictValue } from '@/lib/districts'

export interface SeedTarget {
  name: string
  district: DistrictValue
}

export const SEED_TARGETS: SeedTarget[] = [
  { name: 'Neira Café Lab', district: 'miraflores' },
  { name: 'Puku Puku Café Larco', district: 'miraflores' },
  { name: 'Ombú Specialty Coffee', district: 'miraflores' },
  { name: 'Kaldis Specialty Coffee Recavarren', district: 'miraflores' },
  { name: 'Moss Espresso', district: 'miraflores' },
  { name: 'Urban Coffee Perú', district: 'miraflores' },
  { name: 'Rutina Café', district: 'miraflores' },
  { name: 'Homemade', district: 'miraflores' },
  { name: 'Etcetera Café', district: 'miraflores' },
  { name: 'Café et Chocolat', district: 'miraflores' },
  { name: 'Grano Dorado / Evolèt', district: 'miraflores' },
  { name: 'El Pan de la Chola — Pan & Café', district: 'miraflores' },
  { name: 'El Pan de la Chola — Brunch & Pizza', district: 'miraflores' },
  { name: 'Neira Café Lab – Dasso', district: 'san_isidro' },
  { name: 'Puku Puku Pardo y Aliaga', district: 'san_isidro' },
  { name: 'Café Sur', district: 'san_isidro' },
  { name: 'Puku Puku BCP Café', district: 'san_isidro' },
  { name: 'Blu Café San Isidro', district: 'san_isidro' },
  { name: 'Senzuru Coffee', district: 'san_isidro' },
  { name: 'Croissant & Caffe', district: 'san_isidro' },
  { name: 'The Coffee', district: 'san_isidro' },
  { name: 'Híbrido Coffee Bar', district: 'san_isidro' },
  { name: 'El Pan de la Chola – Dasso', district: 'san_isidro' },
  { name: 'Rue', district: 'barranco' },
  { name: 'La Tostadora Café', district: 'barranco' },
  { name: 'La Bodega Verde', district: 'barranco' },
  { name: 'Caleta Dolsa Coffee', district: 'barranco' },
  { name: 'Monotono Coffee', district: 'barranco' },
  { name: 'Las Vecinas', district: 'barranco' },
  { name: 'Pan de la Chola', district: 'barranco' },
]
```

- [ ] **Step 2: Write `lib/places/types.ts`**

```ts
import type { OpeningHours } from '@/lib/hours/openingHours'
import type { SpacePhoto } from '@/lib/data/spaceTypes'
import type { DistrictValue } from '@/lib/districts'

export interface SeedSpaceInput {
  name: string
  slug: string
  category: 'cafe' | 'work_cafe'
  district: DistrictValue
  address: string | null
  latitude: number | null
  longitude: number | null
  google_place_id: string | null
  google_maps_url: string | null
  phone: string | null
  website: string | null
  rating: number | null
  review_count: number | null
  price_level: number | null
  opening_hours: OpeningHours | null
  photos: SpacePhoto[] | null
  description: string | null
}
```

- [ ] **Step 3: Write the failing test for the mock fixtures**

```ts
// lib/places/mock-fixtures.test.ts
import { describe, expect, it } from 'vitest'
import { buildMockSpaceFixtures } from './mock-fixtures'
import { SEED_TARGETS } from './seedTargets'

describe('buildMockSpaceFixtures', () => {
  it('produces one fixture per seed target', () => {
    expect(buildMockSpaceFixtures()).toHaveLength(SEED_TARGETS.length)
  })

  it('produces unique slugs', () => {
    const fixtures = buildMockSpaceFixtures()
    expect(new Set(fixtures.map((f) => f.slug)).size).toBe(fixtures.length)
  })

  it('only uses the three launch district values', () => {
    const valid = ['miraflores', 'san_isidro', 'barranco']
    buildMockSpaceFixtures().forEach((fixture) => {
      expect(valid).toContain(fixture.district)
    })
  })

  it('assigns coordinates to every fixture', () => {
    buildMockSpaceFixtures().forEach((fixture) => {
      expect(fixture.latitude).not.toBeNull()
      expect(fixture.longitude).not.toBeNull()
    })
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- lib/places/mock-fixtures.test.ts`
Expected: FAIL — module `./mock-fixtures` does not exist.

- [ ] **Step 5: Write `lib/places/mock-fixtures.ts`**

```ts
/**
 * MOCK / DEV-ONLY DATA. Coordinates are approximate placeholders scattered
 * around each district's centroid — NOT real addresses — so the map/list/
 * distance features are testable locally before a Google Maps Platform key
 * exists. Never used to seed a production database; replaced entirely by
 * scripts/seed-google-places.ts once a real key is available.
 */
import { generateSpaceSlug } from '@/lib/slug'
import { DISTRICTS, DISTRICT_CENTROIDS } from '@/lib/districts'
import { SEED_TARGETS } from '@/lib/places/seedTargets'
import type { SeedSpaceInput } from '@/lib/places/types'
import type { OpeningHours } from '@/lib/hours/openingHours'

function offsetCoordinate(base: { lat: number; lng: number }, index: number) {
  const angle = (index * 47) % 360
  const radiusDeg = 0.002 + (index % 5) * 0.0008
  const rad = (angle * Math.PI) / 180
  return {
    lat: base.lat + radiusDeg * Math.cos(rad),
    lng: base.lng + radiusDeg * Math.sin(rad),
  }
}

const MOCK_OPENING_HOURS: OpeningHours = {
  periods: [1, 2, 3, 4, 5, 6].map((day) => ({
    open: { day, time: '0800' },
    close: { day, time: day === 6 ? '1800' : '2000' },
  })),
}

export function buildMockSpaceFixtures(): SeedSpaceInput[] {
  return SEED_TARGETS.map((target, index) => {
    const districtSlug = DISTRICTS.find((d) => d.value === target.district)!.slug
    const coordinate = offsetCoordinate(DISTRICT_CENTROIDS[target.district], index)

    return {
      name: target.name,
      slug: generateSpaceSlug(target.name, districtSlug),
      category: 'work_cafe',
      district: target.district,
      address: null,
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      google_place_id: null,
      google_maps_url: null,
      phone: null,
      website: null,
      rating: 4.5,
      review_count: 50 + index * 3,
      price_level: 2,
      opening_hours: MOCK_OPENING_HOURS,
      photos: null,
      description: null,
    }
  })
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- lib/places/mock-fixtures.test.ts`
Expected: PASS

- [ ] **Step 7: Write `scripts/seed-mock.ts`**

```ts
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { buildMockSpaceFixtures } from '@/lib/places/mock-fixtures'

async function main() {
  const supabase = createAdminSupabaseClient()
  const fixtures = buildMockSpaceFixtures()

  const { error } = await supabase.from('spaces').upsert(fixtures, { onConflict: 'slug' })
  if (error) {
    console.error('Failed to seed mock spaces:', error.message)
    process.exit(1)
  }
  console.log(`Seeded ${fixtures.length} mock spaces (dev/demo data only — not real Google data).`)
}

main()
```

- [ ] **Step 8: Commit**

```bash
git add lib/places/seedTargets.ts lib/places/types.ts lib/places/mock-fixtures.ts lib/places/mock-fixtures.test.ts scripts/seed-mock.ts
git commit -m "feat: add mock place fixtures and mock seed script"
```

---

### Task 11: Real Google Places seed script

**Files:**
- Create: `scripts/seed-google-places.ts`

**Interfaces:**
- Consumes: `SEED_TARGETS` (Task 10), `SeedSpaceInput` (Task 10), `generateSpaceSlug` (Task 4), `DISTRICTS`, `districtLabel` (Task 2), `createAdminSupabaseClient` (Task 6).
- Produces: an executable script (`npm run seed:google`) that resolves and upserts real Google Places data. No new exports consumed by later tasks.

This script cannot be run end-to-end in this session — there is no Google Maps Platform key yet. It is still written completely and correctly now; running it is deferred to whenever a real `GOOGLE_MAPS_SERVER_API_KEY` exists (see Task 20).

- [ ] **Step 1: Write `scripts/seed-google-places.ts`**

```ts
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { generateSpaceSlug } from '@/lib/slug'
import { DISTRICTS, districtLabel } from '@/lib/districts'
import { SEED_TARGETS, type SeedTarget } from '@/lib/places/seedTargets'
import type { SeedSpaceInput } from '@/lib/places/types'
import type { OpeningPeriod } from '@/lib/hours/openingHours'

const PLACES_TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

async function findPlaceId(target: SeedTarget, apiKey: string): Promise<string | null> {
  const label = districtLabel(target.district)
  const query = `${target.name}, ${label}, Lima, Peru`
  const url = `${PLACES_TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`
  const response = await fetch(url)
  const body = await response.json()

  if (body.status !== 'OK' || !body.results?.length) {
    console.warn(`No Google Place match for "${target.name}" (${label}): ${body.status}`)
    return null
  }

  const bestMatch = body.results.find((result: { formatted_address?: string }) =>
    result.formatted_address?.toLowerCase().includes(label.toLowerCase())
  )

  if (!bestMatch) {
    console.warn(
      `Found results for "${target.name}" but none confirm a ${label} address — skipping for manual review.`
    )
    return null
  }

  return bestMatch.place_id
}

async function fetchPlaceDetails(placeId: string, apiKey: string) {
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
  return body.result
}

interface GooglePlaceDetails {
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  opening_hours?: { periods?: OpeningPeriod[] }
  photos?: { photo_reference: string; width: number; height: number }[]
  url?: string
}

function toSeedInput(target: SeedTarget, placeId: string, details: GooglePlaceDetails): SeedSpaceInput {
  const districtSlug = DISTRICTS.find((d) => d.value === target.district)!.slug
  const photos = details.photos?.length
    ? details.photos.map((photo) => ({
        photo_reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      }))
    : null

  return {
    name: target.name,
    slug: generateSpaceSlug(target.name, districtSlug),
    category: 'work_cafe',
    district: target.district,
    address: details.formatted_address ?? null,
    latitude: details.geometry?.location?.lat ?? null,
    longitude: details.geometry?.location?.lng ?? null,
    google_place_id: placeId,
    google_maps_url: details.url ?? null,
    phone: details.formatted_phone_number ?? null,
    website: details.website ?? null,
    rating: details.rating ?? null,
    review_count: details.user_ratings_total ?? null,
    price_level: details.price_level ?? null,
    opening_hours: details.opening_hours?.periods
      ? { periods: details.opening_hours.periods }
      : null,
    photos,
    description: null,
  }
}

async function main() {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY
  if (!apiKey) {
    console.error(
      'GOOGLE_MAPS_SERVER_API_KEY is not set. This script requires a real Google Maps Platform key ' +
        'with Places API enabled — see docs/superpowers/specs/2026-08-26-workcofy-core-discovery-design.md §12.'
    )
    process.exit(1)
  }

  const supabase = createAdminSupabaseClient()
  const resolved: SeedSpaceInput[] = []
  const skipped: string[] = []

  for (const target of SEED_TARGETS) {
    const placeId = await findPlaceId(target, apiKey)
    if (!placeId) {
      skipped.push(target.name)
      continue
    }
    const details = await fetchPlaceDetails(placeId, apiKey)
    resolved.push(toSeedInput(target, placeId, details))
  }

  if (resolved.length > 0) {
    const { error } = await supabase.from('spaces').upsert(resolved, { onConflict: 'slug' })
    if (error) {
      console.error('Failed to upsert resolved spaces:', error.message)
      process.exit(1)
    }
  }

  console.log(`Resolved and seeded ${resolved.length}/${SEED_TARGETS.length} spaces.`)
  if (skipped.length > 0) {
    console.warn(`Skipped (no confident match, resolve manually): ${skipped.join(', ')}`)
  }
}

main()
```

- [ ] **Step 2: Verify the script type-checks**

Run: `npx tsc --noEmit`
Expected: no type errors in `scripts/seed-google-places.ts`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-google-places.ts
git commit -m "feat: add real Google Places seed script (requires a live API key to run)"
```

---

### Task 12: Map types and the mock (MapLibre) map adapter

**Files:**
- Create: `lib/map/types.ts`
- Create: `components/map/MockMapAdapter.tsx`

**Interfaces:**
- Consumes: nothing beyond plain lat/lng data.
- Produces: `MapMarkerData {id, position, label}`, `MapViewProps {center, zoom, markers, selectedMarkerId, onMarkerSelect, userLocation?}` from `lib/map/types.ts`. `MockMapAdapter(props: MapViewProps)` React component from `components/map/MockMapAdapter.tsx`.

MapLibre requires a WebGL-capable browser; jsdom cannot render it, so this component has no automated render test. It is verified manually in Task 20 (`npm run dev`, confirm pins render, pan/zoom, and click-to-select work).

- [ ] **Step 1: Write `lib/map/types.ts`**

```ts
export interface MapMarkerData {
  id: string
  position: { lat: number; lng: number }
  label: string
}

export interface MapViewProps {
  center: { lat: number; lng: number }
  zoom: number
  markers: MapMarkerData[]
  selectedMarkerId: string | null
  onMarkerSelect: (id: string) => void
  userLocation?: { lat: number; lng: number } | null
}
```

- [ ] **Step 2: Write `components/map/MockMapAdapter.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapViewProps } from '@/lib/map/types'

const OSM_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MockMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRefs = useRef<Map<string, maplibregl.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [center.lng, center.lat],
      zoom,
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current.clear()

    markers.forEach((markerData) => {
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '50% 50% 50% 0'
      el.style.background = markerData.id === selectedMarkerId ? '#000000' : '#1a1a1a'
      el.style.border = '2px solid white'
      el.style.transform = 'rotate(-45deg)'
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => onMarkerSelect(markerData.id))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map)

      markerRefs.current.set(markerData.id, marker)
    })
  }, [markers, selectedMarkerId, onMarkerSelect])

  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], zoom })
  }, [center.lat, center.lng, zoom])

  return <div ref={containerRef} className="h-full w-full" data-testid="mock-map-adapter" />
}
```

- [ ] **Step 3: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add lib/map/types.ts components/map/MockMapAdapter.tsx
git commit -m "feat: add mock MapLibre map adapter"
```

---

### Task 13: Google map adapter and the MapView adapter switch

**Files:**
- Create: `components/map/GoogleMapAdapter.tsx`
- Create: `components/map/MapView.tsx`
- Create: `components/map/MapView.test.ts`

**Interfaces:**
- Consumes: `MapViewProps` (Task 12), `MockMapAdapter` (Task 12).
- Produces: `GoogleMapAdapter(props: MapViewProps)` component. `MapView(props: MapViewProps)` component (the only map component later tasks import) and `hasGoogleMapsKey(): boolean` from `components/map/MapView.tsx`.

`GoogleMapAdapter` cannot be verified end-to-end without a real `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — that gap is tracked explicitly in Task 20, not silently skipped. Marker clustering is intentionally deferred: at ≤30 total markers (≤13 per district) it is not yet warranted; add `@googlemaps/markerclusterer` here if real usage shows marker density issues.

- [ ] **Step 1: Write `components/map/GoogleMapAdapter.tsx`**

```tsx
'use client'

import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { MapViewProps } from '@/lib/map/types'

export function GoogleMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        mapId="workcofy-map"
        defaultCenter={center}
        defaultZoom={zoom}
        center={center}
        zoom={zoom}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        {markers.map((marker) => (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            onClick={() => onMarkerSelect(marker.id)}
          >
            <div
              className="h-7 w-7 rounded-full border-2 border-white shadow-md"
              style={{ background: marker.id === selectedMarkerId ? '#000000' : '#1a1a1a' }}
            />
          </AdvancedMarker>
        ))}
      </GoogleMap>
    </APIProvider>
  )
}
```

- [ ] **Step 2: Write the failing test for the adapter switch**

```ts
// components/map/MapView.test.ts
import { describe, expect, it, afterEach, vi } from 'vitest'
import { hasGoogleMapsKey } from './MapView'

describe('hasGoogleMapsKey', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false when no key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '')
    expect(hasGoogleMapsKey()).toBe(false)
  })

  it('is true when a key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'test-key')
    expect(hasGoogleMapsKey()).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- components/map/MapView.test.ts`
Expected: FAIL — module `./MapView` does not exist.

- [ ] **Step 4: Write `components/map/MapView.tsx`**

```tsx
'use client'

import type { MapViewProps } from '@/lib/map/types'
import { GoogleMapAdapter } from '@/components/map/GoogleMapAdapter'
import { MockMapAdapter } from '@/components/map/MockMapAdapter'

export function hasGoogleMapsKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

export function MapView(props: MapViewProps) {
  if (hasGoogleMapsKey()) {
    return <GoogleMapAdapter {...props} />
  }

  return (
    <div className="relative h-full w-full">
      <MockMapAdapter {...props} />
      <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
        Modo desarrollo · datos de ejemplo
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- components/map/MapView.test.ts`
Expected: PASS

- [ ] **Step 6: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/map/GoogleMapAdapter.tsx components/map/MapView.tsx components/map/MapView.test.ts
git commit -m "feat: add Google map adapter and adapter-switching MapView"
```

---

### Task 14: User geolocation hook

**Files:**
- Create: `lib/geo/useUserLocation.ts`
- Create: `lib/geo/useUserLocation.test.ts`

**Interfaces:**
- Consumes: `DISTRICT_CENTROIDS` (Task 2), `LatLng` (Task 3).
- Produces: `LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'`, `UserLocationState {status, coordinate, isFallback}`, `useUserLocation(): UserLocationState & {requestLocation: () => void}`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/geo/useUserLocation.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserLocation } from './useUserLocation'
import { DISTRICT_CENTROIDS } from '@/lib/districts'

describe('useUserLocation', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { geolocation: undefined })
  })

  it('starts idle with the Miraflores fallback coordinate', () => {
    const { result } = renderHook(() => useUserLocation())
    expect(result.current.status).toBe('idle')
    expect(result.current.coordinate).toEqual(DISTRICT_CENTROIDS.miraflores)
  })

  it('reports unavailable when geolocation is not supported', () => {
    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())
    expect(result.current.status).toBe('unavailable')
  })

  it('sets granted status and the real coordinate on success', () => {
    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: -12.05, longitude: -77.03 } })
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())

    expect(result.current.status).toBe('granted')
    expect(result.current.coordinate).toEqual({ lat: -12.05, lng: -77.03 })
    expect(result.current.isFallback).toBe(false)
  })

  it('falls back to denied status and the Miraflores coordinate on error', () => {
    const getCurrentPosition = vi.fn((_success, error) => error({ code: 1 }))
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.requestLocation())

    expect(result.current.status).toBe('denied')
    expect(result.current.coordinate).toEqual(DISTRICT_CENTROIDS.miraflores)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/geo/useUserLocation.test.ts`
Expected: FAIL — module `./useUserLocation` does not exist.

- [ ] **Step 3: Write `lib/geo/useUserLocation.ts`**

```ts
'use client'

import { useCallback, useState } from 'react'
import { DISTRICT_CENTROIDS } from '@/lib/districts'
import type { LatLng } from '@/lib/geo/haversine'

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

export interface UserLocationState {
  status: LocationStatus
  coordinate: LatLng
  isFallback: boolean
}

const MIRAFLORES_FALLBACK: LatLng = DISTRICT_CENTROIDS.miraflores

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    status: 'idle',
    coordinate: MIRAFLORES_FALLBACK,
    isFallback: true,
  })

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
      return
    }

    setState((prev) => ({ ...prev, status: 'requesting' }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'granted',
          coordinate: { lat: position.coords.latitude, lng: position.coords.longitude },
          isFallback: false,
        })
      },
      () => {
        setState({ status: 'denied', coordinate: MIRAFLORES_FALLBACK, isFallback: true })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  return { ...state, requestLocation }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/geo/useUserLocation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/geo/useUserLocation.ts lib/geo/useUserLocation.test.ts
git commit -m "feat: add user geolocation hook with Miraflores fallback"
```

---

### Task 15: Header, Footer, root layout, Hero, and SearchBox

**Files:**
- Create: `components/layout/Header.tsx`
- Create: `components/layout/Footer.tsx`
- Modify: `app/layout.tsx` (replace the Task 1 placeholder)
- Create: `components/home/SearchBox.tsx`
- Create: `components/home/Hero.tsx`

**Interfaces:**
- Consumes: nothing beyond Next.js/React built-ins.
- Produces: `Header`, `Footer`, `SearchBox`, `Hero` components consumed by the root layout (Header/Footer) and the home page (Hero) in Task 18.

No unit tests in this task — these are presentational components exercised by the manual verification pass in Task 20 (this matches the spec's browser-testing note for UI/frontend work).

- [ ] **Step 1: Write `components/layout/Header.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-solo.png" alt="Workcofy" width={32} height={32} className="md:hidden" />
        <Image
          src="/logov1.png"
          alt="Workcofy"
          width={140}
          height={32}
          className="hidden md:block"
        />
      </Link>
      <nav className="hidden gap-6 text-sm font-medium md:flex">
        <Link href="/">Explorar</Link>
        <Link href="/near-me">Cerca de mí</Link>
        <Link href="/miraflores">Distritos</Link>
      </nav>
      <Link href="/near-me" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
        Usar mi ubicación
      </Link>
    </header>
  )
}
```

- [ ] **Step 2: Write `components/layout/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-gray-200 px-4 py-6 text-center text-xs text-gray-500 md:px-8">
      Workcofy — Encuentra dónde trabajar, reunirte y crear.
    </footer>
  )
}
```

- [ ] **Step 3: Replace `app/layout.tsx` with the real root layout**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Workcofy | Encuentra dónde trabajar, reunirte y crear',
  description: 'Descubre cafés, work cafés y espacios de trabajo cerca de ti en Lima.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Write `components/home/SearchBox.tsx`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBox() {
  const [value, setValue] = useState('')
  const router = useRouter()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const query = value.trim()
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex overflow-hidden rounded-full border border-gray-300">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="¿Dónde quieres trabajar?"
        className="flex-1 px-4 py-2 text-sm outline-none"
      />
      <button type="submit" className="bg-black px-5 py-2 text-sm font-medium text-white">
        Buscar
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Write `components/home/Hero.tsx`**

```tsx
import Link from 'next/link'
import { SearchBox } from '@/components/home/SearchBox'

export function Hero() {
  return (
    <section className="px-4 py-10 text-center md:px-8 md:py-16">
      <h1 className="text-3xl font-bold md:text-5xl">Encuentra dónde trabajar, reunirte y crear.</h1>
      <p className="mt-3 text-gray-600 md:text-lg">Descubre cafés y espacios Work-Friendly cerca de ti.</p>
      <div className="mx-auto mt-6 max-w-xl">
        <SearchBox />
      </div>
      <div className="mt-4 flex justify-center gap-3 text-sm">
        <Link href="/miraflores" className="rounded-full border border-gray-300 px-4 py-1.5">
          Miraflores
        </Link>
        <Link href="/san-isidro" className="rounded-full border border-gray-300 px-4 py-1.5">
          San Isidro
        </Link>
        <Link href="/barranco" className="rounded-full border border-gray-300 px-4 py-1.5">
          Barranco
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add components/layout/Header.tsx components/layout/Footer.tsx app/layout.tsx components/home/SearchBox.tsx components/home/Hero.tsx
git commit -m "feat: add header, footer, root layout, hero, and search box"
```

---

### Task 16: FiltersBar, SpaceCard, and SpaceList

**Files:**
- Create: `components/discovery/FiltersBar.tsx`
- Create: `components/discovery/SpaceCard.tsx`
- Create: `components/discovery/SpaceList.tsx`

**Interfaces:**
- Consumes: `CATEGORY_OPTIONS` (Task 2), `DISTRICTS`, `districtLabel` (Task 2), `DiscoveryFilterState`, `SortOption` (Task 9), `formatDistanceKm` (Task 3), `isOpenNow`, `formatPeriodForDay` (Task 5), `buildDirectionsUrl` (Task 8), `SpaceWithDistance` (Task 6).
- Produces: `FiltersBar({filters, onChange, onRequestLocation})`, `SpaceCard({space, isSelected, onSelect, origin?})`, `SpaceList({spaces, selectedId, onSelect, origin?})` — all consumed by `DiscoveryView` in Task 17. `origin` (the user's coordinate once granted) flows through to `buildDirectionsUrl` so "Cómo llegar" uses it, per spec §15.

- [ ] **Step 1: Write `components/discovery/FiltersBar.tsx`**

```tsx
'use client'

import { CATEGORY_OPTIONS } from '@/lib/categories'
import { DISTRICTS } from '@/lib/districts'
import type { DiscoveryFilterState, SortOption } from '@/lib/filters/discoveryFilters'

interface FiltersBarProps {
  filters: DiscoveryFilterState
  onChange: (partial: Partial<DiscoveryFilterState>) => void
  onRequestLocation: () => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Más cerca' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'open_now', label: 'Abierto ahora' },
]

export function FiltersBar({ filters, onChange, onRequestLocation }: FiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange({ category: null })}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !filters.category ? 'bg-black text-white' : 'border border-gray-300'
          }`}
        >
          Todos
        </button>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            disabled={!option.active}
            onClick={() => option.active && onChange({ category: option.value })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.category === option.value ? 'bg-black text-white' : 'border border-gray-300'
            } ${!option.active ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {option.label}
            {!option.active && ' · Próximamente'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {DISTRICTS.map((district) => (
          <button
            key={district.value}
            onClick={() =>
              onChange({ district: filters.district === district.value ? null : district.value })
            }
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.district === district.value ? 'bg-black text-white' : 'border border-gray-300'
            }`}
          >
            {district.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange({ sort: option.value })
              if (option.value === 'distance') onRequestLocation()
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filters.sort === option.value ? 'bg-black text-white' : 'border border-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/discovery/SpaceCard.tsx`**

```tsx
import Link from 'next/link'
import { formatDistanceKm } from '@/lib/geo/haversine'
import { isOpenNow, formatPeriodForDay } from '@/lib/hours/openingHours'
import { districtLabel } from '@/lib/districts'
import { buildDirectionsUrl } from '@/lib/directions'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceCardProps {
  space: SpaceWithDistance
  isSelected: boolean
  onSelect: () => void
  origin?: { lat: number; lng: number } | null
}

export function SpaceCard({ space, isSelected, onSelect, origin = null }: SpaceCardProps) {
  const now = new Date()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayHours = formatPeriodForDay(space.opening_hours, now.getDay())

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border p-3 shadow-sm transition ${
        isSelected ? 'border-black' : 'border-gray-200'
      }`}
    >
      <div className="h-32 w-full rounded-xl bg-gray-100" />
      <h3 className="mt-2 font-semibold">{space.name}</h3>
      <p className="text-sm text-gray-500">{districtLabel(space.district)}</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {space.rating != null && <span>★ {space.rating.toFixed(1)}</span>}
        {space.distanceKm != null && <span>{formatDistanceKm(space.distanceKm)}</span>}
      </div>
      <p className="mt-1 text-xs text-gray-500">{openNow ? `Abierto · ${todayHours}` : 'Cerrado'}</p>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/spaces/${space.slug}`}
          className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
        >
          Ver espacio
        </Link>
        <a
          href={buildDirectionsUrl(space, origin)}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium"
        >
          Cómo llegar
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `components/discovery/SpaceList.tsx`**

```tsx
import { SpaceCard } from '@/components/discovery/SpaceCard'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

interface SpaceListProps {
  spaces: SpaceWithDistance[]
  selectedId: string | null
  onSelect: (id: string) => void
  origin?: { lat: number; lng: number } | null
}

export function SpaceList({ spaces, selectedId, onSelect, origin = null }: SpaceListProps) {
  if (spaces.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-gray-500">
        No encontramos espacios con estos filtros. Prueba con otro distrito o búsqueda.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={space}
          isSelected={space.id === selectedId}
          onSelect={() => onSelect(space.id)}
          origin={origin}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/discovery/FiltersBar.tsx components/discovery/SpaceCard.tsx components/discovery/SpaceList.tsx
git commit -m "feat: add filters bar, space card, and space list"
```

---

### Task 17: DiscoveryView

**Files:**
- Create: `components/discovery/DiscoveryView.tsx`

**Interfaces:**
- Consumes: `MapView` (Task 13), `SpaceList`, `FiltersBar` (Task 16), `useUserLocation` (Task 14), `haversineDistanceKm` (Task 3), `parseDiscoveryFilters`, `serializeDiscoveryFilters` (Task 9), `sortSpaces` (Task 9), `DISTRICT_CENTROIDS` (Task 2), `SpaceRecord` (Task 6).
- Produces: `DiscoveryView({spaces, autoRequestLocation?, initialSort?})` — the single shared component reused by the home page, district pages, and the near-me page in Task 18. 60/40 desktop split (map right, list left), stacked on mobile (map on top) per spec §7.

- [ ] **Step 1: Write `components/discovery/DiscoveryView.tsx`**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { MapView } from '@/components/map/MapView'
import { SpaceList } from '@/components/discovery/SpaceList'
import { FiltersBar } from '@/components/discovery/FiltersBar'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { haversineDistanceKm } from '@/lib/geo/haversine'
import {
  parseDiscoveryFilters,
  serializeDiscoveryFilters,
  type DiscoveryFilterState,
  type SortOption,
} from '@/lib/filters/discoveryFilters'
import { sortSpaces } from '@/lib/filters/sortSpaces'

interface DiscoveryViewProps {
  spaces: SpaceRecord[]
  autoRequestLocation?: boolean
  initialSort?: SortOption
}

export function DiscoveryView({ spaces, autoRequestLocation = false, initialSort }: DiscoveryViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { coordinate, status, requestLocation } = useUserLocation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters: DiscoveryFilterState = useMemo(() => {
    const parsed = parseDiscoveryFilters(searchParams)
    if (!searchParams.get('sort') && initialSort) {
      return { ...parsed, sort: initialSort }
    }
    return parsed
  }, [searchParams, initialSort])

  useEffect(() => {
    if (autoRequestLocation && status === 'idle') {
      requestLocation()
    }
  }, [autoRequestLocation, status, requestLocation])

  const withDistance = useMemo(
    () =>
      spaces.map((space) => ({
        ...space,
        distanceKm:
          space.latitude != null && space.longitude != null
            ? haversineDistanceKm(coordinate, { lat: space.latitude, lng: space.longitude })
            : null,
      })),
    [spaces, coordinate]
  )

  const sorted = useMemo(() => sortSpaces(withDistance, filters.sort), [withDistance, filters.sort])

  function updateFilters(partial: Partial<DiscoveryFilterState>) {
    const query = serializeDiscoveryFilters({ ...filters, ...partial })
    router.push(`?${query}`)
  }

  const markers = sorted
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
    }))

  return (
    <div className="flex flex-col md:h-[70vh] md:flex-row">
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
      <div className="order-2 md:order-1 md:w-2/5 md:overflow-y-auto">
        <FiltersBar filters={filters} onChange={updateFilters} onRequestLocation={requestLocation} />
        <SpaceList
          spaces={sorted}
          selectedId={selectedId}
          onSelect={setSelectedId}
          origin={status === 'granted' ? coordinate : null}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/discovery/DiscoveryView.tsx
git commit -m "feat: add DiscoveryView composing map, filters, and list"
```

---

### Task 18: Home, near-me, and district pages

**Files:**
- Modify: `app/page.tsx` (replace the Task 1 placeholder)
- Create: `app/near-me/page.tsx`
- Create: `app/[district]/page.tsx`

**Interfaces:**
- Consumes: `listSpaces` (Task 7), `Hero` (Task 15), `DiscoveryView` (Task 17), `districtValueFromSlug`, `districtLabel` (Task 2).
- Produces: three routable pages. No exports consumed by later tasks.

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { listSpaces } from '@/lib/data/spaces'
import { Hero } from '@/components/home/Hero'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

interface HomePageProps {
  searchParams: { q?: string; district?: string; category?: string; sort?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    district: searchParams.district,
    category: searchParams.category,
  })

  return (
    <div>
      <Hero />
      <DiscoveryView spaces={spaces} />
    </div>
  )
}
```

- [ ] **Step 2: Write `app/near-me/page.tsx`**

```tsx
import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

export default async function NearMePage() {
  const spaces = await listSpaces()

  return (
    <div>
      <section className="px-4 py-8 md:px-8">
        <h1 className="text-2xl font-bold">Espacios cerca de ti</h1>
      </section>
      <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" />
    </div>
  )
}
```

- [ ] **Step 3: Write `app/[district]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { districtValueFromSlug, districtLabel } from '@/lib/districts'
import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

interface DistrictPageProps {
  params: { district: string }
}

export function generateMetadata({ params }: DistrictPageProps) {
  const value = districtValueFromSlug(params.district)
  if (!value) return {}
  const label = districtLabel(value)
  return {
    title: `Cafés Work-Friendly en ${label} | Workcofy`,
    description: `Descubre cafés y espacios donde puedes trabajar, reunirte o pasar unas horas con tu laptop en ${label}.`,
  }
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const districtValue = districtValueFromSlug(params.district)
  if (!districtValue) notFound()

  const spaces = await listSpaces({ district: districtValue })
  const label = districtLabel(districtValue)

  return (
    <div>
      <section className="px-4 py-8 md:px-8">
        <h1 className="text-2xl font-bold">Cafés Work-Friendly en {label}</h1>
        <p className="mt-2 text-gray-600">
          Descubre cafés y espacios donde puedes trabajar, reunirte o pasar unas horas con tu laptop
          en {label}.
        </p>
      </section>
      <DiscoveryView spaces={spaces} />
    </div>
  )
}
```

- [ ] **Step 4: Verify the project builds**

Run: `npm run build`
Expected: succeeds. (Pages that call `listSpaces` will throw at request time without real Supabase env vars set — this is expected until Task 20's manual verification pass, where `.env.local` is configured.)

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/near-me/page.tsx "app/[district]/page.tsx"
git commit -m "feat: add home, near-me, and district pages"
```

---

### Task 19: Space detail page

**Files:**
- Create: `components/space/WorkcofyScoreBadge.tsx`
- Create: `app/spaces/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getSpaceBySlug` (Task 7), `districtLabel` (Task 2), `isOpenNow`, `formatPeriodForDay`, `DAY_LABELS`, `WEEK_DISPLAY_ORDER` (Task 5), `buildDirectionsUrl` (Task 8).
- Produces: the `/spaces/[slug]` route and `WorkcofyScoreBadge({score})`. No exports consumed by later tasks.

- [ ] **Step 1: Write `components/space/WorkcofyScoreBadge.tsx`**

```tsx
interface WorkcofyScoreBadgeProps {
  score: number | null
}

export function WorkcofyScoreBadge({ score }: WorkcofyScoreBadgeProps) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold">Workcofy Score</h2>
      {score != null ? (
        <p className="mt-1 text-2xl font-bold">{score}/100</p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">Workcofy Score próximamente</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/spaces/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'
import { isOpenNow, formatPeriodForDay, DAY_LABELS, WEEK_DISPLAY_ORDER } from '@/lib/hours/openingHours'
import { buildDirectionsUrl } from '@/lib/directions'
import { WorkcofyScoreBadge } from '@/components/space/WorkcofyScoreBadge'

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

  const now = new Date()
  const openNow = isOpenNow(space.opening_hours, now)
  const todayIndex = now.getDay()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="h-64 w-full rounded-2xl bg-gray-100" />
      <h1 className="mt-4 text-2xl font-bold">{space.name}</h1>
      <p className="text-gray-500">{districtLabel(space.district)}</p>
      <div className="mt-2 flex items-center gap-3 text-sm">
        {space.rating != null && (
          <span>
            ★ {space.rating.toFixed(1)} ({space.review_count ?? 0} reseñas)
          </span>
        )}
        <span className={openNow ? 'text-green-600' : 'text-red-500'}>
          {openNow ? 'Abierto ahora' : 'Cerrado'}
        </span>
      </div>
      {space.address && <p className="mt-2 text-sm text-gray-600">{space.address}</p>}

      <a
        href={buildDirectionsUrl(space)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm font-medium text-white"
      >
        Cómo llegar
      </a>

      <WorkcofyScoreBadge score={space.workcofy_score} />

      <h2 className="mt-8 text-lg font-semibold">Horario</h2>
      <ul className="mt-2 text-sm">
        {WEEK_DISPLAY_ORDER.map((dayIndex) => (
          <li
            key={dayIndex}
            className={`flex justify-between border-b border-gray-100 py-1 ${
              dayIndex === todayIndex ? 'font-semibold' : ''
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

- [ ] **Step 3: Verify the project builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/space/WorkcofyScoreBadge.tsx "app/spaces/[slug]/page.tsx"
git commit -m "feat: add space detail page"
```

---

### Task 20: README, environment wiring, and manual verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: the whole app built in Tasks 1–19.
- Produces: nothing further downstream — this is the final task.

This task requires real Supabase project credentials (URL, anon key, service role key) to run past the build/unit-test steps. If those aren't available when this task is executed, run Steps 1–3 (build, full test suite) and stop there — report the credential gap explicitly rather than claiming the full checklist passed. The Google Maps Platform key remains unavailable per the spec's open risks (§14); its checklist items stay explicitly unverified until one is supplied.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: every test written in Tasks 2–14 passes.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: succeeds with no TypeScript or lint errors.

- [ ] **Step 3: Write `README.md`**

```markdown
# Workcofy — Core Discovery MVP

Encuentra dónde trabajar, reunirte y crear. Descubre cafés y espacios Work-Friendly en Miraflores, San Isidro y Barranco.

## Arquitectura

Next.js 14 (App Router) + TypeScript, Tailwind CSS, Supabase/Postgres, Google Maps Platform (con un adaptador mock vía MapLibre mientras no exista una key real). Ver `docs/superpowers/specs/2026-08-26-workcofy-core-discovery-design.md` para el diseño completo y `docs/superpowers/plans/2026-08-26-workcofy-core-discovery.md` para el plan de implementación.

## Configuración

1. Copia `.env.example` a `.env.local` y completa:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — desde tu proyecto de Supabase (Project Settings → API).
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_API_KEY` — opcionales. Sin ellas, la app usa un mapa y datos de ejemplo (mock) automáticamente.
2. Ejecuta la migración `supabase/migrations/0001_create_spaces.sql` en el SQL Editor de tu proyecto Supabase (o `supabase db push` si tienes el proyecto enlazado con la CLI).
3. Instala dependencias: `npm install`

## Datos de ejemplo (sin key de Google)

```bash
npm run seed:mock
```

Esto llena la tabla `spaces` con los 30 cafés de la lista (Miraflores, San Isidro, Barranco) usando coordenadas aproximadas y datos de ejemplo — no son datos reales de Google. Están claramente aislados en `lib/places/mock-fixtures.ts`.

## Datos reales (con key de Google Maps Platform)

Una vez que `GOOGLE_MAPS_SERVER_API_KEY` esté configurada:

```bash
npm run seed:google
```

Esto resuelve el `google_place_id` real de cada café vía Places API y sobreescribe (`upsert` por `slug`) los datos de ejemplo con datos reales. Cualquier nombre que no se pueda confirmar con confianza se omite y se reporta en consola para revisión manual.

## Ejecutar localmente

```bash
npm run dev
```

Abre http://localhost:3000. Sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, verás el badge "Modo desarrollo · datos de ejemplo" sobre el mapa.

## Tests

```bash
npm test
```

## Desplegar en Vercel

1. Sube el repo a GitHub/GitLab/Bitbucket.
2. Importa el proyecto en Vercel.
3. Configura las mismas variables de entorno de `.env.local` en el proyecto de Vercel (Settings → Environment Variables).
4. Deploy.

## Próximos pasos recomendados

- Obtener una key de Google Maps Platform (Places API + Maps JavaScript API) y correr `npm run seed:google` para reemplazar los datos de ejemplo con datos reales.
- Fase 2: panel `/admin` (CRUD, estados draft/verified/published/partner).
- Fase 3: analítica de eventos (búsquedas, clics en "Cómo llegar", filtros usados).
```

- [ ] **Step 4: Commit the README**

```bash
git add README.md
git commit -m "docs: add README with setup, seeding, and deployment instructions"
```

- [ ] **Step 5: Configure `.env.local` with real Supabase credentials**

Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project's API settings. **If these are not available, stop here and report which of the remaining steps could not be verified.**

- [ ] **Step 6: Apply the migration and seed mock data**

Run the SQL in `supabase/migrations/0001_create_spaces.sql` against the Supabase project (SQL Editor or `supabase db push`), then:

```bash
npm run seed:mock
```

Expected: console output `Seeded 30 mock spaces (dev/demo data only — not real Google data).`

- [ ] **Step 7: Manual verification pass**

Run: `npm run dev`, open `http://localhost:3000`, and confirm each of the following (this is the phase-1 subset of the spec's §35 checklist):

- Home page shows the hero, search box, and Miraflores/San Isidro/Barranco quick links.
- The mock map (MapLibre) renders with pins for the seeded cafés and the "Modo desarrollo · datos de ejemplo" badge.
- Clicking a marker selects the matching list card (and vice versa).
- Search (`¿Dónde quieres trabajar?`) filters results by name/address.
- Category, district, and sort filters update the URL query string and the list/map.
- "Cerca de mí" / the distance sort option prompts for geolocation; denying it falls back to the Miraflores centroid without breaking the page.
- `/miraflores`, `/san-isidro`, `/barranco` each load and show only that district's spaces; an invalid district slug 404s.
- `/near-me` auto-requests geolocation and defaults to distance sort.
- `/spaces/[slug]` shows name, category, rating, address, open/closed status, the full week's hours with today highlighted, and a working "Cómo llegar" link that opens Google Maps in a new tab.
- The Workcofy Score section shows "Workcofy Score próximamente" (no seeded space has a score yet).
- Layout is usable one-handed on a mobile viewport (map on top, list below) and shows the 60/40 map/list split on desktop.
- View source on the home page and a space detail page to confirm the `<title>`/meta description match spec §9 and §28.
- Confirm no secret leaks: `grep -r "SUPABASE_SERVICE_ROLE_KEY\|GOOGLE_MAPS_SERVER_API_KEY" .next/static` (after `npm run build`) returns nothing.

Explicitly out of scope for this pass (tracked as known gaps until a real Google Maps Platform key exists): the real `GoogleMapAdapter` render/interaction, and `npm run seed:google` actually resolving real place data.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: verify Workcofy core discovery MVP end-to-end with mock data"
```

