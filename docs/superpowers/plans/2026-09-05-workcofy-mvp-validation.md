# Workcofy MVP de validación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lanzar Oportunidades (GetOnBoard) y Aprende (catálogo oficial de IA) como páginas públicas, renombrar Espacios a `/espacios`, y reposicionar navegación y Home, con tracking de clics salientes.

**Architecture:** Dos tablas nuevas en Supabase cargadas por scripts (sin admin). Páginas públicas server-rendered que leen `searchParams`, filtran con chips-enlace y renderizan cards. Los CTA salientes pasan por rutas `/ir/*` que cuentan clics y redirigen. La navegación y el Home se reescriben sobre los componentes y estilos existentes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, Supabase (anon para lectura, service role en scripts y rutas `/ir`), Vitest, tsx.

**Spec:** `docs/superpowers/specs/2026-09-05-workcofy-mvp-validation-design.md` (maestro: `docs/workcofy-mvp-spec-2026-09.md`).

## Global Constraints

- Sin dependencias npm nuevas.
- Copy en español; código, commits y comentarios en inglés (convención del repo).
- Identidad visual actual: píldoras negras `rounded-full bg-black text-white`, chips inactivos `border border-gray-200 text-gray-600 hover:border-black`, cards `rounded-2xl border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]`, amarillo `workcofy-yellow`, verde `workcofy-green`.
- Páginas que leen Supabase declaran `export const dynamic = 'force-dynamic'`.
- Los scripts NO importan `lib/supabase/admin.ts` (su `import 'server-only'` no resuelve bajo `tsx`); usan `scripts/lib/serviceRoleClient.ts`.
- Los scripts corren con `tsx --env-file-if-exists=.env.local`.
- Eventos no aparece en el navbar. Rewards no aparece en navbar ni Home.
- Cada tarea termina con `npx tsc --noEmit` limpio y `npm test` en verde antes de commitear.

## Mapa de archivos

**Datos y constantes**
- `supabase/migrations/0014_opportunities_courses.sql` — tablas `opportunities`, `courses`, RLS.
- `lib/professions.ts` — áreas profesionales compartidas.
- `lib/optionLabel.ts` — helper etiqueta-por-valor.
- `lib/opportunities/constants.ts`, `lib/courses/constants.ts` — enums, etiquetas, slugs de categoría.
- `lib/testing/sqlCheckValues.ts` — lee los `check (... in (...))` de una migración para los tests de constantes.
- `lib/data/opportunityTypes.ts`, `lib/data/courseTypes.ts` — tipos de fila.
- `lib/opportunities/queryBuilder.ts`, `lib/courses/queryBuilder.ts` — parse de params + descriptor puro.
- `lib/data/opportunities.ts`, `lib/data/courses.ts` — lecturas anon, incremento de clics.
- `lib/text/stripHtml.ts`, `lib/text/relativeDays.ts`, `lib/text/truncate.ts` — utilidades puras.
- `lib/opportunities/classifyAi.ts` — IA sí/no por palabras clave.
- `lib/opportunities/sources/getonboard.ts` — mapeo puro GetOnBoard → fila; `getonboardClient.ts` — fetch.
- `lib/courses/seedCatalog.ts` — catálogo semilla tipado.
- `scripts/lib/serviceRoleClient.ts`, `scripts/seed-getonboard.ts`, `scripts/seed-courses.ts`.

**UI compartida**
- `components/ui/FilterChips.tsx`, `SearchForm.tsx`, `CategoryTabs.tsx`, `Pagination.tsx`.

**Oportunidades**
- `components/opportunities/OpportunityCard.tsx`, `OpportunitiesListing.tsx`, `OpportunityDetail.tsx`.
- `app/oportunidades/page.tsx`, `app/oportunidades/[slug]/page.tsx`, `app/ir/oportunidad/[id]/route.ts`.

**Aprende**
- `components/courses/CourseCard.tsx`, `CoursesListing.tsx`.
- `app/aprende/page.tsx`, `app/aprende/[slug]/page.tsx`, `app/ir/curso/[id]/route.ts`.

**Espacios, navegación, Home, SEO**
- `app/espacios/page.tsx` (movido desde `app/near-me`), `app/espacios/[categoria]/page.tsx`, `next.config.mjs`, `middleware.ts`, `lib/categories.ts`.
- `lib/navLinks.ts`, `components/layout/Sidebar.tsx`, `AppShell.tsx`, `Footer.tsx`.
- `components/home/Hero.tsx`, `PillarsSection.tsx`, `OpportunitiesHomeSection.tsx`, `AiSection.tsx`, `CoursesHomeSection.tsx`, `ExplorarSection.tsx`, `app/page.tsx`.
- `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `.env.example`.

---

### Task 1: Migración, constantes compartidas y test de consistencia SQL

**Files:**
- Create: `supabase/migrations/0014_opportunities_courses.sql`
- Create: `lib/professions.ts`, `lib/optionLabel.ts`
- Create: `lib/opportunities/constants.ts`, `lib/courses/constants.ts`
- Create: `lib/testing/sqlCheckValues.ts`
- Test: `lib/opportunities/constants.test.ts`, `lib/courses/constants.test.ts`

**Interfaces:**
- Produces: `PROFESSION_OPTIONS`, `PROFESSION_VALUES`, `isProfessionValue(v)`, `professionLabel(v)`; `optionLabel(options, value)`; `OPPORTUNITY_TYPES`, `OPPORTUNITY_MODALITIES`, `EXPERIENCE_LEVELS`, `OPPORTUNITY_LANGUAGES`, `OPPORTUNITY_COUNTRIES`, `OPPORTUNITY_SOURCES`, `CONTENT_STATUSES`, `OPPORTUNITY_CATEGORY_SLUGS`, `opportunityCategoryFromSlug(slug)`; `COURSE_CATEGORIES`, `COURSE_TOOLS`, `COURSE_LEVELS`, `COURSE_PRICES`, `COURSE_LANGUAGES`, `courseCategoryFromSlug(slug)`; `readMigration(file)`, `extractCheckValues(sql, table, column)`.

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/0014_opportunities_courses.sql
-- Oportunidades y cursos: contenido nuevo del MVP de validación. Ver
-- docs/superpowers/specs/2026-09-05-workcofy-mvp-validation-design.md §2.
-- Loaded by scripts (seed:getonboard, seed:courses) and edited in Supabase's
-- Table Editor — there is no in-app admin for these tables in this phase.
-- Enum values here are mirrored in lib/opportunities/constants.ts and
-- lib/courses/constants.ts; a vitest compares both so they can't drift.

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  company text not null,
  company_logo_url text,
  type text not null check (type in ('empleo', 'freelance', 'proyecto', 'practicas')),
  modality text not null check (modality in ('remoto', 'hibrido', 'presencial')),
  is_ai boolean not null default false,
  area text check (area is null or area in ('marketing', 'ventas', 'diseno', 'finanzas', 'ingenieria', 'legal', 'rrhh', 'educacion', 'emprendimiento', 'operaciones', 'datos', 'producto', 'otros')),
  experience_level text check (experience_level is null or experience_level in ('junior', 'mid', 'senior', 'lead')),
  location text,
  country text,
  language text check (language is null or language in ('es', 'en')),
  salary_text text,
  summary text,
  description text,
  tags text[] not null default '{}',
  source text not null check (source in ('getonboard', 'manual')),
  source_url text not null,
  external_id text,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists opportunities_status_published_idx on opportunities (status, published_at desc);
create index if not exists opportunities_type_idx on opportunities (type);
create index if not exists opportunities_modality_idx on opportunities (modality);
create index if not exists opportunities_area_idx on opportunities (area);
create index if not exists opportunities_is_ai_idx on opportunities (is_ai);

alter table opportunities enable row level security;

drop policy if exists "Public can read published opportunities" on opportunities;
create policy "Public can read published opportunities"
  on opportunities for select
  to anon, authenticated
  using (status = 'published');

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  provider text not null,
  category text not null check (category in ('ia_desde_cero', 'ia_por_profesion', 'herramientas', 'certificaciones')),
  area text check (area is null or area in ('marketing', 'ventas', 'diseno', 'finanzas', 'ingenieria', 'legal', 'rrhh', 'educacion', 'emprendimiento', 'operaciones', 'datos', 'producto', 'otros')),
  tool text check (tool is null or tool in ('chatgpt', 'claude', 'gemini', 'copilot', 'automatizacion', 'productividad')),
  level text not null check (level in ('principiante', 'intermedio', 'avanzado')),
  duration_text text,
  price text not null check (price in ('gratis', 'pago')),
  price_text text,
  has_certificate boolean not null default false,
  language text not null check (language in ('es', 'en', 'multi')),
  official boolean not null default true,
  url text not null,
  image_url text,
  summary text,
  description text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  last_verified_at date,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_status_idx on courses (status);
create index if not exists courses_category_idx on courses (category);
create index if not exists courses_featured_idx on courses (featured);

alter table courses enable row level security;

drop policy if exists "Public can read published courses" on courses;
create policy "Public can read published courses"
  on courses for select
  to anon, authenticated
  using (status = 'published');
```

- [ ] **Step 2: Constantes compartidas**

```ts
// lib/optionLabel.ts
export interface LabeledOption {
  readonly value: string
  readonly label: string
}

export function optionLabel(options: readonly LabeledOption[], value: string | null | undefined): string | null {
  if (!value) return null
  return options.find((option) => option.value === value)?.label ?? null
}
```

```ts
// lib/professions.ts
// Shared "área profesional" list used by opportunities.area and courses.area
// (and by their public filters). Values must match the `area` check in
// supabase/migrations/0014_opportunities_courses.sql.
export const PROFESSION_OPTIONS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'diseno', label: 'Diseño' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'ingenieria', label: 'Ingeniería' },
  { value: 'legal', label: 'Legal' },
  { value: 'rrhh', label: 'Recursos Humanos' },
  { value: 'educacion', label: 'Educación' },
  { value: 'emprendimiento', label: 'Emprendimiento' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'datos', label: 'Datos' },
  { value: 'producto', label: 'Producto' },
  { value: 'otros', label: 'Otros' },
] as const

export type ProfessionValue = (typeof PROFESSION_OPTIONS)[number]['value']

export const PROFESSION_VALUES: ProfessionValue[] = PROFESSION_OPTIONS.map((option) => option.value)

export function isProfessionValue(value: string): value is ProfessionValue {
  return (PROFESSION_VALUES as string[]).includes(value)
}

export function professionLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return PROFESSION_OPTIONS.find((option) => option.value === value)?.label ?? null
}
```

```ts
// lib/opportunities/constants.ts
export const OPPORTUNITY_TYPES = [
  { value: 'empleo', label: 'Empleo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'practicas', label: 'Prácticas' },
] as const
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]['value']

export const OPPORTUNITY_MODALITIES = [
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'presencial', label: 'Presencial' },
] as const
export type OpportunityModality = (typeof OPPORTUNITY_MODALITIES)[number]['value']

export const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Semi senior' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Expert' },
] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]['value']

export const OPPORTUNITY_LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
] as const
export type OpportunityLanguage = (typeof OPPORTUNITY_LANGUAGES)[number]['value']

export const OPPORTUNITY_SOURCES = [
  { value: 'getonboard', label: 'Get on Board' },
  { value: 'manual', label: 'Workcofy' },
] as const
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number]['value']

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

// ISO-2 lowercase. Not lib/countries.ts (that list is the two countries
// with spaces on the map); opportunities span all of LatAm plus Spain/US.
export const OPPORTUNITY_COUNTRIES = [
  { value: 'pe', label: 'Perú' },
  { value: 'cl', label: 'Chile' },
  { value: 'mx', label: 'México' },
  { value: 'co', label: 'Colombia' },
  { value: 'ar', label: 'Argentina' },
  { value: 'uy', label: 'Uruguay' },
  { value: 'ec', label: 'Ecuador' },
  { value: 'bo', label: 'Bolivia' },
  { value: 'py', label: 'Paraguay' },
  { value: 've', label: 'Venezuela' },
  { value: 'br', label: 'Brasil' },
  { value: 'cr', label: 'Costa Rica' },
  { value: 'pa', label: 'Panamá' },
  { value: 'gt', label: 'Guatemala' },
  { value: 'do', label: 'República Dominicana' },
  { value: 'sv', label: 'El Salvador' },
  { value: 'hn', label: 'Honduras' },
  { value: 'ni', label: 'Nicaragua' },
  { value: 'es', label: 'España' },
  { value: 'us', label: 'Estados Unidos' },
] as const
export type OpportunityCountry = (typeof OPPORTUNITY_COUNTRIES)[number]['value']

// The five "categorías" of the master spec §9 are URL views over three
// orthogonal columns (see design spec §2.1) — each slug is a fixed filter.
export interface OpportunityCategory {
  slug: string
  label: string
  title: string
  description: string
  filter: { type?: OpportunityType; modality?: OpportunityModality; ai?: true }
}

export const OPPORTUNITY_CATEGORY_SLUGS: OpportunityCategory[] = [
  {
    slug: 'remoto',
    label: 'Remoto',
    title: 'Trabajo remoto',
    description: 'Oportunidades de trabajo remoto para Perú, LatAm y el mundo.',
    filter: { modality: 'remoto' },
  },
  {
    slug: 'freelance',
    label: 'Freelance',
    title: 'Oportunidades freelance',
    description: 'Proyectos y trabajos independientes para profesionales freelance.',
    filter: { type: 'freelance' },
  },
  {
    slug: 'proyectos',
    label: 'Proyectos',
    title: 'Proyectos',
    description: 'Trabajos puntuales o por proyecto.',
    filter: { type: 'proyecto' },
  },
  {
    slug: 'practicas',
    label: 'Prácticas',
    title: 'Prácticas profesionales',
    description: 'Prácticas y oportunidades para quienes están comenzando.',
    filter: { type: 'practicas' },
  },
  {
    slug: 'ia',
    label: 'IA',
    title: 'Oportunidades en inteligencia artificial',
    description: 'Trabajos y proyectos relacionados directa o indirectamente con IA.',
    filter: { ai: true },
  },
]

export function opportunityCategoryFromSlug(slug: string): OpportunityCategory | null {
  return OPPORTUNITY_CATEGORY_SLUGS.find((category) => category.slug === slug) ?? null
}
```

```ts
// lib/courses/constants.ts
export const COURSE_CATEGORIES = [
  {
    value: 'ia_desde_cero',
    slug: 'ia-desde-cero',
    label: 'IA desde cero',
    description: 'Para personas sin experiencia previa en inteligencia artificial.',
  },
  {
    value: 'ia_por_profesion',
    slug: 'ia-por-profesion',
    label: 'IA por profesión',
    description: 'Cómo aplicar IA en marketing, ventas, diseño, finanzas y otras áreas.',
  },
  {
    value: 'herramientas',
    slug: 'herramientas',
    label: 'Herramientas',
    description: 'Aprende a usar ChatGPT, Claude, Gemini, Copilot y herramientas de automatización.',
  },
  {
    value: 'certificaciones',
    slug: 'certificaciones',
    label: 'Cursos y certificaciones',
    description: 'Certificaciones oficiales de IA de Microsoft, Google, AWS y otros proveedores.',
  },
] as const
export type CourseCategory = (typeof COURSE_CATEGORIES)[number]['value']

export const COURSE_TOOLS = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'automatizacion', label: 'Automatización' },
  { value: 'productividad', label: 'Productividad' },
] as const
export type CourseTool = (typeof COURSE_TOOLS)[number]['value']

export const COURSE_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]['value']

export const COURSE_PRICES = [
  { value: 'gratis', label: 'Gratis' },
  { value: 'pago', label: 'Pago' },
] as const
export type CoursePrice = (typeof COURSE_PRICES)[number]['value']

export const COURSE_LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'multi', label: 'Varios idiomas' },
] as const
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number]['value']

export function courseCategoryFromSlug(slug: string) {
  return COURSE_CATEGORIES.find((category) => category.slug === slug) ?? null
}

export function courseCategoryFromValue(value: string | null | undefined) {
  if (!value) return null
  return COURSE_CATEGORIES.find((category) => category.value === value) ?? null
}
```

- [ ] **Step 3: Helper de lectura de la migración y tests que fallan**

```ts
// lib/testing/sqlCheckValues.ts
import { readFileSync } from 'node:fs'
import path from 'node:path'

export function readMigration(file: string): string {
  return readFileSync(path.join(process.cwd(), 'supabase', 'migrations', file), 'utf8')
}

// Pulls the quoted values out of `<column> in ('a', 'b')` inside one
// `create table` block, so a test can assert the TS enum matches the SQL
// check constraint exactly.
export function extractCheckValues(sql: string, table: string, column: string): string[] {
  const start = sql.indexOf(`create table if not exists ${table}`)
  if (start === -1) throw new Error(`Table ${table} not found in migration`)
  const block = sql.slice(start, sql.indexOf('\n);', start))
  const match = block.match(new RegExp(`\\b${column} in \\(([^)]*)\\)`))
  if (!match) throw new Error(`No check constraint for ${table}.${column}`)
  return match[1].split(',').map((value) => value.trim().replace(/^'|'$/g, ''))
}
```

```ts
// lib/opportunities/constants.test.ts
import { describe, expect, it } from 'vitest'
import { extractCheckValues, readMigration } from '@/lib/testing/sqlCheckValues'
import { PROFESSION_VALUES } from '@/lib/professions'
import {
  CONTENT_STATUSES,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORY_SLUGS,
  OPPORTUNITY_LANGUAGES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_SOURCES,
  OPPORTUNITY_TYPES,
  opportunityCategoryFromSlug,
} from './constants'

const sql = readMigration('0014_opportunities_courses.sql')
const values = (options: readonly { value: string }[]) => options.map((o) => o.value)

describe('opportunity constants match the migration', () => {
  it('type', () => expect(extractCheckValues(sql, 'opportunities', 'type')).toEqual(values(OPPORTUNITY_TYPES)))
  it('modality', () => expect(extractCheckValues(sql, 'opportunities', 'modality')).toEqual(values(OPPORTUNITY_MODALITIES)))
  it('experience_level', () => expect(extractCheckValues(sql, 'opportunities', 'experience_level')).toEqual(values(EXPERIENCE_LEVELS)))
  it('area', () => expect(extractCheckValues(sql, 'opportunities', 'area')).toEqual(PROFESSION_VALUES))
  it('language', () => expect(extractCheckValues(sql, 'opportunities', 'language')).toEqual(values(OPPORTUNITY_LANGUAGES)))
  it('source', () => expect(extractCheckValues(sql, 'opportunities', 'source')).toEqual(values(OPPORTUNITY_SOURCES)))
  it('status', () => expect(extractCheckValues(sql, 'opportunities', 'status')).toEqual([...CONTENT_STATUSES]))
})

describe('opportunityCategoryFromSlug', () => {
  it('resolves the five master-spec categories', () => {
    expect(OPPORTUNITY_CATEGORY_SLUGS.map((c) => c.slug)).toEqual(['remoto', 'freelance', 'proyectos', 'practicas', 'ia'])
    expect(opportunityCategoryFromSlug('ia')?.filter).toEqual({ ai: true })
    expect(opportunityCategoryFromSlug('proyectos')?.filter).toEqual({ type: 'proyecto' })
  })
  it('returns null for anything else', () => {
    expect(opportunityCategoryFromSlug('senior-react-developer-acme')).toBeNull()
  })
})
```

```ts
// lib/courses/constants.test.ts
import { describe, expect, it } from 'vitest'
import { extractCheckValues, readMigration } from '@/lib/testing/sqlCheckValues'
import { PROFESSION_VALUES } from '@/lib/professions'
import { CONTENT_STATUSES } from '@/lib/opportunities/constants'
import {
  COURSE_CATEGORIES,
  COURSE_LANGUAGES,
  COURSE_LEVELS,
  COURSE_PRICES,
  COURSE_TOOLS,
  courseCategoryFromSlug,
} from './constants'

const sql = readMigration('0014_opportunities_courses.sql')
const values = (options: readonly { value: string }[]) => options.map((o) => o.value)

describe('course constants match the migration', () => {
  it('category', () => expect(extractCheckValues(sql, 'courses', 'category')).toEqual(values(COURSE_CATEGORIES)))
  it('area', () => expect(extractCheckValues(sql, 'courses', 'area')).toEqual(PROFESSION_VALUES))
  it('tool', () => expect(extractCheckValues(sql, 'courses', 'tool')).toEqual(values(COURSE_TOOLS)))
  it('level', () => expect(extractCheckValues(sql, 'courses', 'level')).toEqual(values(COURSE_LEVELS)))
  it('price', () => expect(extractCheckValues(sql, 'courses', 'price')).toEqual(values(COURSE_PRICES)))
  it('language', () => expect(extractCheckValues(sql, 'courses', 'language')).toEqual(values(COURSE_LANGUAGES)))
  it('status', () => expect(extractCheckValues(sql, 'courses', 'status')).toEqual([...CONTENT_STATUSES]))
})

describe('courseCategoryFromSlug', () => {
  it('maps the four URL slugs', () => {
    expect(courseCategoryFromSlug('ia-desde-cero')?.value).toBe('ia_desde_cero')
    expect(courseCategoryFromSlug('certificaciones')?.value).toBe('certificaciones')
    expect(courseCategoryFromSlug('nope')).toBeNull()
  })
})
```

- [ ] **Step 4: Correr los tests**

Run: `npx vitest run lib/opportunities/constants.test.ts lib/courses/constants.test.ts`
Expected: PASS (todo verde; si un valor difiere entre SQL y TS el test lo señala).

- [ ] **Step 5: Aplicar la migración en Supabase**

Ejecutar el contenido de `0014_opportunities_courses.sql` en el SQL Editor del proyecto (o `supabase db push`). Verificar en Table Editor que existen `opportunities` y `courses` con RLS activo.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0014_opportunities_courses.sql lib/professions.ts lib/optionLabel.ts lib/opportunities lib/courses lib/testing
git commit -m "feat: add opportunities and courses tables, shared constants, SQL consistency tests"
```

---

### Task 2: Tipos, query builder y capa de datos de Oportunidades

**Files:**
- Create: `lib/data/opportunityTypes.ts`, `lib/opportunities/queryBuilder.ts`, `lib/data/opportunities.ts`
- Test: `lib/opportunities/queryBuilder.test.ts`

**Interfaces:**
- Consumes: constantes de Task 1.
- Produces: `OpportunityRecord`, `OpportunityInsert`; `OpportunityFilters`, `SearchParamsInput`, `OPPORTUNITY_PAGE_SIZE`, `parseOpportunityFilters(params)`, `opportunityFiltersToParams(filters)`, `buildOpportunityQueryDescriptor(filters)`; `listPublishedOpportunities(filters)`, `listRecentOpportunities(limit)`, `getOpportunityBySlug(slug)`, `getOpportunityById(id)`, `listPublishedOpportunitySlugs()`, `incrementOpportunityClicks(id, current)`.

- [ ] **Step 1: Tipos**

```ts
// lib/data/opportunityTypes.ts
import type {
  ContentStatus,
  ExperienceLevel,
  OpportunityLanguage,
  OpportunityModality,
  OpportunitySource,
  OpportunityType,
} from '@/lib/opportunities/constants'
import type { ProfessionValue } from '@/lib/professions'

export interface OpportunityRecord {
  id: string
  slug: string
  title: string
  company: string
  company_logo_url: string | null
  type: OpportunityType
  modality: OpportunityModality
  is_ai: boolean
  area: ProfessionValue | null
  experience_level: ExperienceLevel | null
  location: string | null
  country: string | null
  language: OpportunityLanguage | null
  salary_text: string | null
  summary: string | null
  description: string | null
  tags: string[]
  source: OpportunitySource
  source_url: string
  external_id: string | null
  published_at: string
  expires_at: string | null
  status: ContentStatus
  click_count: number
  created_at: string
  updated_at: string
}

export type OpportunityInsert = Omit<OpportunityRecord, 'id' | 'created_at' | 'updated_at' | 'click_count'>
```

- [ ] **Step 2: Test del query builder (falla)**

```ts
// lib/opportunities/queryBuilder.test.ts
import { describe, expect, it } from 'vitest'
import {
  OPPORTUNITY_PAGE_SIZE,
  buildOpportunityQueryDescriptor,
  opportunityFiltersToParams,
  parseOpportunityFilters,
} from './queryBuilder'

describe('parseOpportunityFilters', () => {
  it('reads the Spanish URL params into filter fields', () => {
    expect(
      parseOpportunityFilters({ q: 'react', tipo: 'freelance', modalidad: 'remoto', nivel: 'junior', area: 'diseno', pais: 'pe', ia: '1', page: '2' })
    ).toEqual({ q: 'react', type: 'freelance', modality: 'remoto', level: 'junior', area: 'diseno', country: 'pe', ai: true, page: 2 })
  })
  it('defaults to page 1, null ai, and takes the first value of repeated params', () => {
    expect(parseOpportunityFilters({ tipo: ['empleo', 'freelance'], page: 'abc' })).toMatchObject({ type: 'empleo', ai: null, page: 1 })
    expect(parseOpportunityFilters({ ia: '0' }).ai).toBe(false)
  })
})

describe('opportunityFiltersToParams', () => {
  it('round-trips and drops empty/default values', () => {
    expect(opportunityFiltersToParams({ q: 'x', type: 'empleo', ai: false, page: 1 })).toEqual({ q: 'x', tipo: 'empleo', ia: '0' })
    expect(opportunityFiltersToParams({ page: 3, ai: null })).toEqual({ page: '3' })
  })
})

describe('buildOpportunityQueryDescriptor', () => {
  it('keeps only valid enum values and computes the range', () => {
    const d = buildOpportunityQueryDescriptor({ type: 'freelance', modality: 'nope', level: 'senior', area: 'marketing', country: 'pe', ai: true, page: 2, q: '  ux  ' })
    expect(d.eqFilters).toEqual([
      { column: 'type', value: 'freelance' },
      { column: 'experience_level', value: 'senior' },
      { column: 'area', value: 'marketing' },
      { column: 'country', value: 'pe' },
    ])
    expect(d.isAi).toBe(true)
    expect(d.searchTerm).toBe('ux')
    expect(d.page).toBe(2)
    expect(d.from).toBe(OPPORTUNITY_PAGE_SIZE)
    expect(d.to).toBe(OPPORTUNITY_PAGE_SIZE * 2 - 1)
  })
  it('treats empty filters as page 1 with no constraints', () => {
    expect(buildOpportunityQueryDescriptor({})).toEqual({ eqFilters: [], isAi: null, searchTerm: null, page: 1, from: 0, to: OPPORTUNITY_PAGE_SIZE - 1 })
  })
})
```

Run: `npx vitest run lib/opportunities/queryBuilder.test.ts` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar el query builder**

```ts
// lib/opportunities/queryBuilder.ts
import { isProfessionValue } from '@/lib/professions'
import {
  EXPERIENCE_LEVELS,
  OPPORTUNITY_COUNTRIES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_TYPES,
} from './constants'

export const OPPORTUNITY_PAGE_SIZE = 30

export interface OpportunityFilters {
  q?: string | null
  type?: string | null
  modality?: string | null
  level?: string | null
  area?: string | null
  country?: string | null
  ai?: boolean | null
  page?: number
}

export type SearchParamsInput = Record<string, string | string[] | undefined>

export function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

// URL params are Spanish (they show in the address bar); the filter object
// uses the names the data layer speaks.
export function parseOpportunityFilters(params: SearchParamsInput): OpportunityFilters {
  const page = Number.parseInt(firstParam(params.page) ?? '1', 10)
  const ia = firstParam(params.ia)
  return {
    q: firstParam(params.q),
    type: firstParam(params.tipo),
    modality: firstParam(params.modalidad),
    level: firstParam(params.nivel),
    area: firstParam(params.area),
    country: firstParam(params.pais),
    ai: ia === '1' ? true : ia === '0' ? false : null,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function opportunityFiltersToParams(filters: OpportunityFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.q) out.q = filters.q
  if (filters.type) out.tipo = filters.type
  if (filters.modality) out.modalidad = filters.modality
  if (filters.level) out.nivel = filters.level
  if (filters.area) out.area = filters.area
  if (filters.country) out.pais = filters.country
  if (filters.ai === true) out.ia = '1'
  else if (filters.ai === false) out.ia = '0'
  if (filters.page && filters.page > 1) out.page = String(filters.page)
  return out
}

export interface OpportunityEqFilter {
  column: 'type' | 'modality' | 'experience_level' | 'area' | 'country'
  value: string
}

export interface OpportunityQueryDescriptor {
  eqFilters: OpportunityEqFilter[]
  isAi: boolean | null
  searchTerm: string | null
  page: number
  from: number
  to: number
}

const TYPE_VALUES = new Set<string>(OPPORTUNITY_TYPES.map((o) => o.value))
const MODALITY_VALUES = new Set<string>(OPPORTUNITY_MODALITIES.map((o) => o.value))
const LEVEL_VALUES = new Set<string>(EXPERIENCE_LEVELS.map((o) => o.value))
const COUNTRY_VALUES = new Set<string>(OPPORTUNITY_COUNTRIES.map((o) => o.value))

// Unknown values are ignored rather than rejected: a stale or hand-typed
// URL degrades to a broader list instead of an error page.
export function buildOpportunityQueryDescriptor(filters: OpportunityFilters): OpportunityQueryDescriptor {
  const eqFilters: OpportunityEqFilter[] = []
  if (filters.type && TYPE_VALUES.has(filters.type)) eqFilters.push({ column: 'type', value: filters.type })
  if (filters.modality && MODALITY_VALUES.has(filters.modality)) eqFilters.push({ column: 'modality', value: filters.modality })
  if (filters.level && LEVEL_VALUES.has(filters.level)) eqFilters.push({ column: 'experience_level', value: filters.level })
  if (filters.area && isProfessionValue(filters.area)) eqFilters.push({ column: 'area', value: filters.area })
  if (filters.country && COUNTRY_VALUES.has(filters.country)) eqFilters.push({ column: 'country', value: filters.country })

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const from = (page - 1) * OPPORTUNITY_PAGE_SIZE
  const trimmed = filters.q?.trim()
  return {
    eqFilters,
    isAi: filters.ai ?? null,
    searchTerm: trimmed ? trimmed : null,
    page,
    from,
    to: from + OPPORTUNITY_PAGE_SIZE - 1,
  }
}
```

Run: `npx vitest run lib/opportunities/queryBuilder.test.ts` → PASS.

- [ ] **Step 4: Capa de datos**

```ts
// lib/data/opportunities.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import {
  OPPORTUNITY_PAGE_SIZE,
  buildOpportunityQueryDescriptor,
  type OpportunityFilters,
} from '@/lib/opportunities/queryBuilder'

export interface OpportunityPage {
  items: OpportunityRecord[]
  total: number
  page: number
  pageSize: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Published and not expired. RLS already hides drafts/archived from the anon
// key; the status filter is repeated here so the intent is visible in code.
function publishedQuery() {
  const supabase = createServerSupabaseClient()
  return supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
}

export async function listPublishedOpportunities(filters: OpportunityFilters = {}): Promise<OpportunityPage> {
  const descriptor = buildOpportunityQueryDescriptor(filters)
  let query = publishedQuery()
  for (const filter of descriptor.eqFilters) query = query.eq(filter.column, filter.value)
  if (descriptor.isAi !== null) query = query.eq('is_ai', descriptor.isAi)
  if (descriptor.searchTerm) {
    // Same PostgREST-injection guard listSpaces() uses.
    const sanitized = descriptor.searchTerm.replace(/[,()."*\\]/g, ' ')
    const term = `%${sanitized}%`
    query = query.or(`title.ilike.${term},company.ilike.${term}`)
  }
  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(descriptor.from, descriptor.to)
  if (error) throw new Error(`Failed to list opportunities: ${error.message}`)
  return { items: (data ?? []) as OpportunityRecord[], total: count ?? 0, page: descriptor.page, pageSize: OPPORTUNITY_PAGE_SIZE }
}

export async function listRecentOpportunities(limit = 3): Promise<OpportunityRecord[]> {
  const { data, error } = await publishedQuery().order('published_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`Failed to list recent opportunities: ${error.message}`)
  return (data ?? []) as OpportunityRecord[]
}

export async function getOpportunityBySlug(slug: string): Promise<OpportunityRecord | null> {
  const { data, error } = await publishedQuery().eq('slug', slug).maybeSingle()
  if (error) throw new Error(`Failed to load opportunity "${slug}": ${error.message}`)
  return (data as OpportunityRecord | null) ?? null
}

export async function getOpportunityById(id: string): Promise<OpportunityRecord | null> {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await publishedQuery().eq('id', id).maybeSingle()
  if (error) throw new Error(`Failed to load opportunity ${id}: ${error.message}`)
  return (data as OpportunityRecord | null) ?? null
}

export async function listPublishedOpportunitySlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('slug, updated_at')
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
  if (error) throw new Error(`Failed to list opportunity slugs: ${error.message}`)
  return data ?? []
}

// Outbound-click counter for the /ir/oportunidad/[id] redirect. Same
// service-role pattern as incrementViewCount() in lib/data/spaces.ts.
export async function incrementOpportunityClicks(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('opportunities').update({ click_count: currentCount + 1 }).eq('id', id)
  if (error) console.warn(`Failed to increment click_count for opportunity ${id}: ${error.message}`)
}
```

- [ ] **Step 5: Verificar y commitear**

Run: `npx tsc --noEmit && npx vitest run lib/opportunities`
Expected: sin errores, tests en verde.

```bash
git add lib/data/opportunityTypes.ts lib/data/opportunities.ts lib/opportunities/queryBuilder.ts lib/opportunities/queryBuilder.test.ts
git commit -m "feat: opportunity types, URL filter parsing, and public read layer"
```

---

### Task 3: Utilidades de texto y clasificador IA

**Files:**
- Create: `lib/text/stripHtml.ts`, `lib/text/truncate.ts`, `lib/text/relativeDays.ts`, `lib/opportunities/classifyAi.ts`
- Test: `lib/text/stripHtml.test.ts`, `lib/text/relativeDays.test.ts`, `lib/opportunities/classifyAi.test.ts`

**Interfaces:**
- Produces: `stripHtml(html): string`, `truncateWords(text, max): string`, `formatRelativeDays(iso, now?): string`, `classifyAi({ title, tags, description, categoryName? }): boolean`.

- [ ] **Step 1: Tests que fallan**

```ts
// lib/text/stripHtml.test.ts
import { describe, expect, it } from 'vitest'
import { stripHtml } from './stripHtml'

describe('stripHtml', () => {
  it('turns block tags into line breaks and bullets, decodes entities, collapses blank lines', () => {
    const html = '<div>• Ventas SaaS<br>• CRM &amp; HubSpot</div><p>Extra&nbsp;line</p><ul><li>uno</li><li>dos</li></ul>'
    expect(stripHtml(html)).toBe('• Ventas SaaS\n• CRM & HubSpot\nExtra line\n• uno\n• dos')
  })
  it('handles empty and tag-free input', () => {
    expect(stripHtml('')).toBe('')
    expect(stripHtml('  plano  ')).toBe('plano')
  })
})
```

```ts
// lib/text/relativeDays.test.ts
import { describe, expect, it } from 'vitest'
import { formatRelativeDays } from './relativeDays'

const now = new Date('2026-09-05T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()

describe('formatRelativeDays', () => {
  it('formats today, yesterday, days, weeks and months', () => {
    expect(formatRelativeDays(daysAgo(0), now)).toBe('Hoy')
    expect(formatRelativeDays(daysAgo(1), now)).toBe('Ayer')
    expect(formatRelativeDays(daysAgo(3), now)).toBe('Hace 3 días')
    expect(formatRelativeDays(daysAgo(7), now)).toBe('Hace 1 semana')
    expect(formatRelativeDays(daysAgo(20), now)).toBe('Hace 2 semanas')
    expect(formatRelativeDays(daysAgo(40), now)).toBe('Hace 1 mes')
    expect(formatRelativeDays(daysAgo(95), now)).toBe('Hace 3 meses')
  })
})
```

```ts
// lib/opportunities/classifyAi.test.ts
import { describe, expect, it } from 'vitest'
import { classifyAi } from './classifyAi'

const base = { title: 'Analista comercial', tags: [] as string[], description: 'Vender a clientes.' }

describe('classifyAi', () => {
  it('flags AI by category, title, tags, or description', () => {
    expect(classifyAi({ ...base, categoryName: 'Machine Learning & AI' })).toBe(true)
    expect(classifyAi({ ...base, title: 'Especialista en Adopción de IA' })).toBe(true)
    expect(classifyAi({ ...base, tags: ['ai tools'] })).toBe(true)
    expect(classifyAi({ ...base, description: 'Integrarás modelos LLM con RAG.' })).toBe(true)
    expect(classifyAi({ ...base, description: 'Experiencia con ChatGPT y Copilot' })).toBe(true)
    expect(classifyAi({ ...base, title: 'Prompt Engineer' })).toBe(true)
  })
  it('does not flag Spanish words that merely end in -ia or contain "ai"', () => {
    expect(classifyAi({ ...base, title: 'Asistencia comercial', description: 'Experiencia en Illustrator y AIR' })).toBe(false)
    expect(classifyAi({ ...base, title: 'Desarrollador HTML y XML' })).toBe(false)
    expect(classifyAi({ ...base, categoryName: 'Data Science / Analytics' })).toBe(false)
  })
})
```

Run: `npx vitest run lib/text lib/opportunities/classifyAi.test.ts` → FAIL.

- [ ] **Step 2: Implementar**

```ts
// lib/text/stripHtml.ts
// Minimal HTML → plain text for job descriptions we ingest (GetOnBoard sends
// HTML fragments). Not a sanitizer for rendering HTML — output is always
// rendered as text.
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/ul|\/ol|\/tr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n')
    .trim()
}
```

```ts
// lib/text/truncate.ts
export function truncateWords(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${base.replace(/[,;:.]$/, '')}…`
}
```

```ts
// lib/text/relativeDays.ts
const DAY_MS = 86_400_000

export function formatRelativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (days < 30) return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  return months <= 1 ? 'Hace 1 mes' : `Hace ${months} meses`
}
```

```ts
// lib/opportunities/classifyAi.ts
// Keyword classifier for opportunities.is_ai. Deliberately simple for the
// validation MVP (design spec §3); a model-based pass is a later phase.
// `\bIA\b` / `\bAI\b` are case-sensitive on purpose: "asistencia" and "AIR"
// must not match, while "IA", "AI Tools" and "Adopción de IA" must. Tags are
// also checked upper-cased because sources lowercase them.
const AI_PATTERNS: RegExp[] = [
  /\bIA\b/,
  /\bAI\b/,
  /\bML\b/,
  /\bRAG\b/,
  /\bNLP\b/,
  /\bLLMs?\b/i,
  /\bGPT/i,
  /inteligencia artificial/i,
  /machine learning/i,
  /deep learning/i,
  /computer vision/i,
  /chatgpt/i,
  /\bclaude\b/i,
  /copilot/i,
  /\bgemini\b/i,
  /generativ/i,
  /\bprompt/i,
  /agentes? (de )?ia\b/i,
]

const AI_CATEGORY = /machine learning|\bai\b/i

export interface ClassifyAiInput {
  title: string
  tags: string[]
  description: string
  categoryName?: string | null
}

export function classifyAi({ title, tags, description, categoryName }: ClassifyAiInput): boolean {
  if (categoryName && AI_CATEGORY.test(categoryName)) return true
  const haystacks = [title, description, ...tags, ...tags.map((tag) => tag.toUpperCase())]
  return haystacks.some((text) => AI_PATTERNS.some((pattern) => pattern.test(text)))
}
```

Run: `npx vitest run lib/text lib/opportunities/classifyAi.test.ts` → PASS. Si `stripHtml` difiere del texto esperado en un salto de línea, ajustar la implementación (no el test).

- [ ] **Step 3: Commit**

```bash
git add lib/text lib/opportunities/classifyAi.ts lib/opportunities/classifyAi.test.ts
git commit -m "feat: text helpers and keyword AI classifier for opportunities"
```

---

### Task 4: Ingesta de GetOnBoard (mapeo, cliente y script)

**Files:**
- Create: `lib/opportunities/sources/getonboard.ts`, `lib/opportunities/sources/getonboardClient.ts`
- Create: `scripts/lib/serviceRoleClient.ts`, `scripts/seed-getonboard.ts`
- Modify: `package.json` (scripts)
- Test: `lib/opportunities/sources/getonboard.test.ts`

**Interfaces:**
- Consumes: `OpportunityInsert`, `classifyAi`, `stripHtml`, `truncateWords`, constantes.
- Produces: `GetOnBoardJob`, `GETONBOARD_CATEGORY_IDS`, `GETONBOARD_MAX_AGE_DAYS`, `mapType`, `mapModality`, `mapLevel`, `mapArea`, `countryCodeFor`, `formatSalary`, `shouldKeep(job)`, `isFresh(job, now)`, `mapGetOnBoardJob(job, now)`, `fetchGetOnBoardCategoryPage(categoryId, page)`, `createServiceRoleClient()`.

- [ ] **Step 1: Test del mapeo (falla)**

```ts
// lib/opportunities/sources/getonboard.test.ts
import { describe, expect, it } from 'vitest'
import {
  countryCodeFor,
  formatSalary,
  isFresh,
  mapArea,
  mapGetOnBoardJob,
  mapLevel,
  mapModality,
  mapType,
  shouldKeep,
  type GetOnBoardJob,
} from './getonboard'

const now = new Date('2026-09-05T12:00:00Z')

function job(overrides: Partial<GetOnBoardJob['attributes']> = {}, id = 'qa-tecnico-acme-lima'): GetOnBoardJob {
  return {
    id,
    type: 'job',
    links: { public_url: `https://www.getonbrd.com/jobs/${id}` },
    attributes: {
      title: 'QA Técnico',
      description_headline: 'Requisitos',
      description: '<p>Experiencia en <b>testing</b>.</p>',
      functions_headline: 'Funciones',
      functions: '<ul><li>Probar</li><li>Reportar</li></ul>',
      desirable_headline: '',
      desirable: '',
      remote: false,
      remote_modality: 'hybrid',
      countries: ['Peru'],
      lang: 'es',
      category_name: 'SysAdmin / DevOps / QA',
      min_salary: 1500,
      max_salary: 2000,
      published_at: Math.floor(now.getTime() / 1000) - 2 * 86_400,
      modality: { data: { attributes: { name: 'Full time', locale_key: 'full_time' } } },
      seniority: { data: { attributes: { name: 'Junior', locale_key: 'junior' } } },
      tags: { data: [{ attributes: { name: 'Selenium' } }, { attributes: { name: 'AI Tools' } }] },
      company: { data: { attributes: { name: 'Acme', logo: 'https://cdn/logo.png', web: 'https://acme.pe' } } },
      ...overrides,
    },
  }
}

describe('field mappers', () => {
  it('maps modality/type/level/area/country', () => {
    expect(mapType('freelance')).toBe('freelance')
    expect(mapType('internship')).toBe('practicas')
    expect(mapType('part_time')).toBe('empleo')
    expect(mapType(null)).toBe('empleo')
    expect(mapModality('fully_remote')).toBe('remoto')
    expect(mapModality('remote_local')).toBe('remoto')
    expect(mapModality('hybrid')).toBe('hibrido')
    expect(mapModality('no_remote')).toBe('presencial')
    expect(mapLevel('no_experience')).toBe('junior')
    expect(mapLevel('semi_senior')).toBe('mid')
    expect(mapLevel('expert')).toBe('lead')
    expect(mapLevel(null)).toBeNull()
    expect(mapArea('Digital Marketing')).toBe('marketing')
    expect(mapArea('People & HR')).toBe('rrhh')
    expect(mapArea('Machine Learning & AI')).toBe('datos')
    expect(mapArea('Product, Innovation & Agile')).toBe('producto')
    expect(mapArea('Customer Support')).toBe('operaciones')
    expect(mapArea('Hardware / Electronics')).toBe('ingenieria')
    expect(mapArea('Something new')).toBe('otros')
    expect(countryCodeFor('Perú')).toBe('pe')
    expect(countryCodeFor('Mexico')).toBe('mx')
    expect(countryCodeFor('Remote')).toBeNull()
  })
  it('formats salaries in USD', () => {
    expect(formatSalary(1500, 2000)).toBe('USD 1,500 – 2,000')
    expect(formatSalary(1500, null)).toBe('Desde USD 1,500')
    expect(formatSalary(null, 2000)).toBe('Hasta USD 2,000')
    expect(formatSalary(null, null)).toBeNull()
  })
})

describe('shouldKeep / isFresh', () => {
  it('keeps remote jobs and on-site jobs in LatAm or Spain, drops the rest', () => {
    expect(shouldKeep(job())).toBe(true)
    expect(shouldKeep(job({ remote_modality: 'fully_remote', countries: ['Remote'] }))).toBe(true)
    expect(shouldKeep(job({ remote_modality: 'no_remote', countries: ['United States'] }))).toBe(false)
    expect(shouldKeep(job({ remote_modality: 'hybrid', countries: ['España'] }))).toBe(true)
  })
  it('drops jobs older than the max age', () => {
    expect(isFresh(job(), now)).toBe(true)
    expect(isFresh(job({ published_at: Math.floor(now.getTime() / 1000) - 60 * 86_400 }), now)).toBe(false)
  })
})

describe('mapGetOnBoardJob', () => {
  it('produces a complete insert row', () => {
    const row = mapGetOnBoardJob(job(), now)
    expect(row).toMatchObject({
      slug: 'qa-tecnico-acme-lima',
      title: 'QA Técnico',
      company: 'Acme',
      company_logo_url: 'https://cdn/logo.png',
      type: 'empleo',
      modality: 'hibrido',
      is_ai: true,
      area: 'ingenieria',
      experience_level: 'junior',
      location: 'Perú',
      country: 'pe',
      language: 'es',
      salary_text: 'USD 1,500 – 2,000',
      tags: ['selenium', 'ai tools'],
      source: 'getonboard',
      source_url: 'https://www.getonbrd.com/jobs/qa-tecnico-acme-lima',
      external_id: 'qa-tecnico-acme-lima',
      status: 'published',
    })
    expect(row.description).toBe('Requisitos\nExperiencia en testing.\n\nFunciones\n• Probar\n• Reportar')
    expect(row.summary).toBe('• Probar • Reportar')
    expect(new Date(row.expires_at!).getTime() - new Date(row.published_at).getTime()).toBe(45 * 86_400_000)
  })
  it('labels remote jobs and falls back when the company is missing', () => {
    const row = mapGetOnBoardJob(
      job({ remote_modality: 'fully_remote', countries: ['Remote', 'Chile'], company: { data: null }, lang: 'lang_not_specified' }),
      now
    )
    expect(row.location).toBe('Remoto · Chile')
    expect(row.country).toBe('cl')
    expect(row.company).toBe('Empresa confidencial')
    expect(row.company_logo_url).toBeNull()
    expect(row.language).toBeNull()
  })
})
```

Run: `npx vitest run lib/opportunities/sources` → FAIL.

- [ ] **Step 2: Implementar el mapeo**

```ts
// lib/opportunities/sources/getonboard.ts
// Pure mapping from GetOnBoard's public API (verified 2026-09-05, no auth:
// GET https://www.getonbrd.com/api/v0/categories/{id}/jobs?per_page=100&page=N
//     &expand=["company","modality","seniority","tags"])
// to our opportunities row. Fetching lives in getonboardClient.ts so this
// file stays unit-testable.
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import type { ExperienceLevel, OpportunityModality, OpportunityType } from '@/lib/opportunities/constants'
import { OPPORTUNITY_COUNTRIES } from '@/lib/opportunities/constants'
import type { ProfessionValue } from '@/lib/professions'
import { classifyAi } from '@/lib/opportunities/classifyAi'
import { stripHtml } from '@/lib/text/stripHtml'
import { truncateWords } from '@/lib/text/truncate'

export interface GetOnBoardJob {
  id: string
  type: 'job'
  links: { public_url: string }
  attributes: {
    title: string
    description_headline: string
    description: string
    functions_headline: string
    functions: string
    desirable_headline: string
    desirable: string
    remote: boolean
    remote_modality: string
    countries: string[]
    lang: string
    category_name: string
    min_salary: number | null
    max_salary: number | null
    published_at: number
    modality: { data: { attributes: { name: string; locale_key: string } } | null }
    seniority: { data: { attributes: { name: string; locale_key: string } } | null }
    tags: { data: { attributes?: { name: string } }[] }
    company: { data: { attributes: { name: string; logo: string | null; web: string | null } } | null }
  }
}

// From GET /api/v0/categories (2026-09-05).
export const GETONBOARD_CATEGORY_IDS = [
  'programming', 'sysadmin-devops-qa', 'data-science-analytics', 'machine-learning-ai', 'mobile-developer',
  'cybersecurity', 'hardware-electronics', 'design-ux', 'digital-marketing', 'advertising-media', 'sales',
  'customer-support', 'technical-support', 'operations-management', 'innovation-agile', 'hr',
  'education-coaching', 'other',
]

export const GETONBOARD_MAX_AGE_DAYS = 45
const DAY_MS = 86_400_000

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  peru: 'pe', 'perú': 'pe', chile: 'cl', mexico: 'mx', 'méxico': 'mx', colombia: 'co', argentina: 'ar',
  uruguay: 'uy', ecuador: 'ec', bolivia: 'bo', paraguay: 'py', venezuela: 've', brasil: 'br', brazil: 'br',
  'costa rica': 'cr', panama: 'pa', 'panamá': 'pa', guatemala: 'gt', 'dominican republic': 'do',
  'república dominicana': 'do', 'el salvador': 'sv', honduras: 'hn', nicaragua: 'ni', 'españa': 'es',
  spain: 'es', 'estados unidos': 'us', 'united states': 'us', usa: 'us',
}

// Countries whose on-site/hybrid jobs we still list (design spec §3).
const KEEP_COUNTRY_CODES = new Set(OPPORTUNITY_COUNTRIES.map((c) => c.value).filter((code) => code !== 'us'))

export function countryCodeFor(name: string): string | null {
  return COUNTRY_CODE_BY_NAME[name.trim().toLowerCase()] ?? null
}

function countryLabel(code: string, fallback: string): string {
  return OPPORTUNITY_COUNTRIES.find((c) => c.value === code)?.label ?? fallback
}

export function mapType(localeKey: string | null): OpportunityType {
  if (localeKey === 'freelance') return 'freelance'
  if (localeKey === 'internship') return 'practicas'
  return 'empleo'
}

export function mapModality(remoteModality: string): OpportunityModality {
  if (['fully_remote', 'remote_local', 'temporarily_remote'].includes(remoteModality)) return 'remoto'
  if (remoteModality === 'hybrid') return 'hibrido'
  return 'presencial'
}

export function mapLevel(localeKey: string | null): ExperienceLevel | null {
  switch (localeKey) {
    case 'no_experience':
    case 'junior':
      return 'junior'
    case 'semi_senior':
      return 'mid'
    case 'senior':
      return 'senior'
    case 'expert':
      return 'lead'
    default:
      return null
  }
}

export function mapArea(categoryName: string): ProfessionValue {
  const name = categoryName.toLowerCase()
  if (/programming|sysadmin|devops|mobile|cyber|hardware/.test(name)) return 'ingenieria'
  if (/marketing|advertising/.test(name)) return 'marketing'
  if (/sales/.test(name)) return 'ventas'
  if (/design/.test(name)) return 'diseno'
  if (/\bhr\b|people/.test(name)) return 'rrhh'
  if (/data|machine learning/.test(name)) return 'datos'
  if (/product|innovation/.test(name)) return 'producto'
  if (/operations|support|admin/.test(name)) return 'operaciones'
  if (/education/.test(name)) return 'educacion'
  return 'otros'
}

const USD = new Intl.NumberFormat('en-US')

export function formatSalary(min: number | null, max: number | null): string | null {
  if (min && max) return `USD ${USD.format(min)} – ${USD.format(max)}`
  if (min) return `Desde USD ${USD.format(min)}`
  if (max) return `Hasta USD ${USD.format(max)}`
  return null
}

function isRemote(job: GetOnBoardJob): boolean {
  return mapModality(job.attributes.remote_modality) === 'remoto'
}

export function shouldKeep(job: GetOnBoardJob): boolean {
  if (isRemote(job)) return true
  return job.attributes.countries.some((name) => {
    const code = countryCodeFor(name)
    return code !== null && KEEP_COUNTRY_CODES.has(code)
  })
}

export function isFresh(job: GetOnBoardJob, now: Date): boolean {
  return now.getTime() - job.attributes.published_at * 1000 <= GETONBOARD_MAX_AGE_DAYS * DAY_MS
}

function primaryCountry(countries: string[]): string | null {
  for (const name of countries) {
    const code = countryCodeFor(name)
    if (code) return code
  }
  return null
}

function buildLocation(job: GetOnBoardJob): string {
  const named = job.attributes.countries
    .filter((name) => name.toLowerCase() !== 'remote')
    .map((name) => {
      const code = countryCodeFor(name)
      return code ? countryLabel(code, name) : name
    })
  if (isRemote(job)) return named.length ? `Remoto · ${named.join(', ')}` : 'Remoto'
  return named.length ? named.join(', ') : 'Sin ubicación'
}

function section(headline: string, html: string): string | null {
  const text = stripHtml(html)
  if (!text) return null
  const title = headline.trim()
  return title ? `${title}\n${text}` : text
}

function buildDescription(a: GetOnBoardJob['attributes']): string {
  return [
    section(a.description_headline, a.description),
    section(a.functions_headline, a.functions),
    section(a.desirable_headline, a.desirable),
  ]
    .filter((part): part is string => part !== null)
    .join('\n\n')
}

function buildSummary(a: GetOnBoardJob['attributes']): string | null {
  const text = stripHtml(a.functions || a.description || '')
  return text ? truncateWords(text, 200) : null
}

export function mapGetOnBoardJob(job: GetOnBoardJob, now: Date): OpportunityInsert {
  const a = job.attributes
  const company = a.company?.data?.attributes ?? null
  const tags = (a.tags?.data ?? [])
    .map((tag) => tag.attributes?.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase())
  const description = buildDescription(a)
  // Clamp future timestamps (clock skew on the source) to the run time.
  const publishedAt = new Date(Math.min(a.published_at * 1000, now.getTime()))
  return {
    slug: job.id,
    title: a.title.trim(),
    company: company?.name?.trim() || 'Empresa confidencial',
    company_logo_url: company?.logo || null,
    type: mapType(a.modality?.data?.attributes.locale_key ?? null),
    modality: mapModality(a.remote_modality),
    is_ai: classifyAi({ title: a.title, tags, description, categoryName: a.category_name }),
    area: mapArea(a.category_name),
    experience_level: mapLevel(a.seniority?.data?.attributes.locale_key ?? null),
    location: buildLocation(job),
    country: primaryCountry(a.countries),
    language: a.lang === 'es' || a.lang === 'en' ? a.lang : null,
    salary_text: formatSalary(a.min_salary, a.max_salary),
    summary: buildSummary(a),
    description,
    tags,
    source: 'getonboard',
    source_url: job.links.public_url,
    external_id: job.id,
    published_at: publishedAt.toISOString(),
    expires_at: new Date(publishedAt.getTime() + GETONBOARD_MAX_AGE_DAYS * DAY_MS).toISOString(),
    status: 'published',
  }
}
```

Run: `npx vitest run lib/opportunities/sources` → PASS.

- [ ] **Step 3: Cliente HTTP y cliente de service role para scripts**

```ts
// lib/opportunities/sources/getonboardClient.ts
import type { GetOnBoardJob } from './getonboard'

const BASE_URL = 'https://www.getonbrd.com/api/v0'
const EXPAND = encodeURIComponent('["company","modality","seniority","tags"]')

export async function fetchGetOnBoardCategoryPage(
  categoryId: string,
  page: number
): Promise<{ jobs: GetOnBoardJob[]; totalPages: number }> {
  const url = `${BASE_URL}/categories/${categoryId}/jobs?per_page=100&page=${page}&expand=${EXPAND}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Workcofy/1.0 (+https://workcofy.com)' },
  })
  if (!response.ok) throw new Error(`GetOnBoard ${categoryId} page ${page}: HTTP ${response.status}`)
  const body = (await response.json()) as { data?: GetOnBoardJob[]; meta?: { total_pages?: number } }
  return { jobs: body.data ?? [], totalPages: body.meta?.total_pages ?? 1 }
}
```

```ts
// scripts/lib/serviceRoleClient.ts
// Scripts can't import lib/supabase/admin.ts: its `import 'server-only'`
// only resolves inside Next's bundler. Same client, built here without it.
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (run via npm scripts, which load .env.local)')
  }
  return createClient(url, serviceRoleKey)
}
```

- [ ] **Step 4: Script de ingesta**

```ts
// scripts/seed-getonboard.ts
import { createServiceRoleClient } from './lib/serviceRoleClient'
import type { OpportunityInsert } from '@/lib/data/opportunityTypes'
import { GETONBOARD_CATEGORY_IDS, isFresh, mapGetOnBoardJob, shouldKeep } from '@/lib/opportunities/sources/getonboard'
import { fetchGetOnBoardCategoryPage } from '@/lib/opportunities/sources/getonboardClient'

const MAX_PAGES_PER_CATEGORY = 5
const UPSERT_CHUNK = 100

async function main() {
  const supabase = createServiceRoleClient()
  const now = new Date()
  const rowsBySlug = new Map<string, OpportunityInsert>()
  let read = 0
  let stale = 0
  let discarded = 0

  for (const category of GETONBOARD_CATEGORY_IDS) {
    let page = 1
    let totalPages = 1
    while (page <= totalPages && page <= MAX_PAGES_PER_CATEGORY) {
      const result = await fetchGetOnBoardCategoryPage(category, page)
      totalPages = result.totalPages
      read += result.jobs.length
      let sawFresh = false
      for (const job of result.jobs) {
        if (!isFresh(job, now)) {
          stale += 1
          continue
        }
        sawFresh = true
        if (!shouldKeep(job)) {
          discarded += 1
          continue
        }
        rowsBySlug.set(job.id, mapGetOnBoardJob(job, now))
      }
      // Pages come newest-first; once a whole page is older than the cutoff
      // nothing fresher is behind it.
      if (!sawFresh) break
      page += 1
    }
    console.log(`${category}: ${rowsBySlug.size} accumulated`)
  }

  const rows = [...rowsBySlug.values()].map((row) => ({ ...row, updated_at: now.toISOString() }))
  for (let index = 0; index < rows.length; index += UPSERT_CHUNK) {
    const { error } = await supabase
      .from('opportunities')
      .upsert(rows.slice(index, index + UPSERT_CHUNK), { onConflict: 'source,external_id' })
    if (error) {
      console.error(`Upsert failed at chunk ${index / UPSERT_CHUNK}: ${error.message}`)
      process.exit(1)
    }
  }

  const ai = rows.filter((row) => row.is_ai).length
  console.log(`Read ${read} · kept ${rows.length} · discarded (outside LatAm) ${discarded} · stale ${stale} · AI ${ai}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

En `package.json`, dentro de `"scripts"`, agregar:

```json
"seed:getonboard": "tsx --env-file-if-exists=.env.local scripts/seed-getonboard.ts",
"seed:courses": "tsx --env-file-if-exists=.env.local scripts/seed-courses.ts"
```

- [ ] **Step 5: Correr la ingesta real y verificar**

Run: `npm run seed:getonboard`
Expected: sin errores; línea final con conteos (cientos de filas conservadas, decenas marcadas IA). Verificar en Supabase Table Editor que `opportunities` tiene filas con `source_url` a getonbrd.com. Si el endpoint devolviera 429, reintentar más tarde; no agregar reintentos automáticos en esta etapa.

- [ ] **Step 6: Commit**

```bash
git add lib/opportunities/sources scripts/lib/serviceRoleClient.ts scripts/seed-getonboard.ts package.json
git commit -m "feat: GetOnBoard opportunity ingestion script with pure field mapping"
```

---

### Task 5: Tipos, query builder, resolución de slugs y capa de datos de Cursos

**Files:**
- Create: `lib/data/courseTypes.ts`, `lib/courses/queryBuilder.ts`, `lib/courses/resolveCourseSlug.ts`, `lib/data/courses.ts`
- Test: `lib/courses/queryBuilder.test.ts`, `lib/courses/resolveCourseSlug.test.ts`

**Interfaces:**
- Produces: `CourseRecord`, `CourseInsert`; `CourseFilters`, `parseCourseFilters(params)`, `courseFiltersToParams(filters)`, `buildCourseQueryDescriptor(filters)`; `resolveCourseSlug(slug): { title, description, filters } | null`; `listPublishedCourses(filters)`, `listFeaturedCourses(limit)`, `getCourseById(id)`, `incrementCourseClicks(id, current)`.

- [ ] **Step 1: Tipos**

```ts
// lib/data/courseTypes.ts
import type { ContentStatus } from '@/lib/opportunities/constants'
import type { CourseCategory, CourseLanguage, CourseLevel, CoursePrice, CourseTool } from '@/lib/courses/constants'
import type { ProfessionValue } from '@/lib/professions'

export interface CourseRecord {
  id: string
  slug: string
  title: string
  provider: string
  category: CourseCategory
  area: ProfessionValue | null
  tool: CourseTool | null
  level: CourseLevel
  duration_text: string | null
  price: CoursePrice
  price_text: string | null
  has_certificate: boolean
  language: CourseLanguage
  official: boolean
  url: string
  image_url: string | null
  summary: string | null
  description: string | null
  tags: string[]
  featured: boolean
  last_verified_at: string | null
  status: ContentStatus
  click_count: number
  created_at: string
  updated_at: string
}

export type CourseInsert = Omit<CourseRecord, 'id' | 'created_at' | 'updated_at' | 'click_count'>
```

- [ ] **Step 2: Tests (fallan)**

```ts
// lib/courses/queryBuilder.test.ts
import { describe, expect, it } from 'vitest'
import { buildCourseQueryDescriptor, courseFiltersToParams, parseCourseFilters } from './queryBuilder'

describe('parseCourseFilters', () => {
  it('reads Spanish params', () => {
    expect(
      parseCourseFilters({ categoria: 'herramientas', area: 'marketing', herramienta: 'claude', nivel: 'principiante', precio: 'gratis', idioma: 'es', certificado: '1' })
    ).toEqual({ category: 'herramientas', area: 'marketing', tool: 'claude', level: 'principiante', price: 'gratis', language: 'es', certificate: true })
    expect(parseCourseFilters({}).certificate).toBeNull()
  })
})

describe('courseFiltersToParams', () => {
  it('round-trips', () => {
    expect(courseFiltersToParams({ category: 'ia_desde_cero', certificate: true })).toEqual({ categoria: 'ia_desde_cero', certificado: '1' })
  })
})

describe('buildCourseQueryDescriptor', () => {
  it('keeps only valid values', () => {
    expect(
      buildCourseQueryDescriptor({ category: 'nope', area: 'ventas', tool: 'gemini', level: 'x', price: 'pago', language: 'multi', certificate: true })
    ).toEqual({
      eqFilters: [
        { column: 'area', value: 'ventas' },
        { column: 'tool', value: 'gemini' },
        { column: 'price', value: 'pago' },
        { column: 'language', value: 'multi' },
      ],
      certificate: true,
    })
  })
})
```

```ts
// lib/courses/resolveCourseSlug.test.ts
import { describe, expect, it } from 'vitest'
import { resolveCourseSlug } from './resolveCourseSlug'

describe('resolveCourseSlug', () => {
  it('maps category slugs', () => {
    expect(resolveCourseSlug('herramientas')).toMatchObject({ title: 'Herramientas', filters: { category: 'herramientas' } })
  })
  it('maps ia-para-<area> to the profession category plus area', () => {
    expect(resolveCourseSlug('ia-para-marketing')).toMatchObject({ title: 'IA para Marketing', filters: { category: 'ia_por_profesion', area: 'marketing' } })
    expect(resolveCourseSlug('ia-para-rrhh')?.title).toBe('IA para Recursos Humanos')
  })
  it('rejects unknown slugs', () => {
    expect(resolveCourseSlug('ia-para-astronautas')).toBeNull()
    expect(resolveCourseSlug('random')).toBeNull()
  })
})
```

Run: `npx vitest run lib/courses` → FAIL.

- [ ] **Step 3: Implementar**

```ts
// lib/courses/queryBuilder.ts
import { isProfessionValue } from '@/lib/professions'
import { firstParam, type SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from './constants'

export interface CourseFilters {
  category?: string | null
  area?: string | null
  tool?: string | null
  level?: string | null
  price?: string | null
  language?: string | null
  certificate?: boolean | null
}

export function parseCourseFilters(params: SearchParamsInput): CourseFilters {
  return {
    category: firstParam(params.categoria),
    area: firstParam(params.area),
    tool: firstParam(params.herramienta),
    level: firstParam(params.nivel),
    price: firstParam(params.precio),
    language: firstParam(params.idioma),
    certificate: firstParam(params.certificado) === '1' ? true : null,
  }
}

export function courseFiltersToParams(filters: CourseFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.category) out.categoria = filters.category
  if (filters.area) out.area = filters.area
  if (filters.tool) out.herramienta = filters.tool
  if (filters.level) out.nivel = filters.level
  if (filters.price) out.precio = filters.price
  if (filters.language) out.idioma = filters.language
  if (filters.certificate) out.certificado = '1'
  return out
}

export interface CourseEqFilter {
  column: 'category' | 'area' | 'tool' | 'level' | 'price' | 'language'
  value: string
}

export interface CourseQueryDescriptor {
  eqFilters: CourseEqFilter[]
  certificate: boolean | null
}

const valid = (options: readonly { value: string }[]) => new Set<string>(options.map((o) => o.value))
const CATEGORY_VALUES = valid(COURSE_CATEGORIES)
const TOOL_VALUES = valid(COURSE_TOOLS)
const LEVEL_VALUES = valid(COURSE_LEVELS)
const PRICE_VALUES = valid(COURSE_PRICES)
const LANGUAGE_VALUES = valid(COURSE_LANGUAGES)

export function buildCourseQueryDescriptor(filters: CourseFilters): CourseQueryDescriptor {
  const eqFilters: CourseEqFilter[] = []
  if (filters.category && CATEGORY_VALUES.has(filters.category)) eqFilters.push({ column: 'category', value: filters.category })
  if (filters.area && isProfessionValue(filters.area)) eqFilters.push({ column: 'area', value: filters.area })
  if (filters.tool && TOOL_VALUES.has(filters.tool)) eqFilters.push({ column: 'tool', value: filters.tool })
  if (filters.level && LEVEL_VALUES.has(filters.level)) eqFilters.push({ column: 'level', value: filters.level })
  if (filters.price && PRICE_VALUES.has(filters.price)) eqFilters.push({ column: 'price', value: filters.price })
  if (filters.language && LANGUAGE_VALUES.has(filters.language)) eqFilters.push({ column: 'language', value: filters.language })
  return { eqFilters, certificate: filters.certificate ?? null }
}
```

```ts
// lib/courses/resolveCourseSlug.ts
import { isProfessionValue, professionLabel } from '@/lib/professions'
import { courseCategoryFromSlug } from './constants'
import type { CourseFilters } from './queryBuilder'

export interface ResolvedCourseSlug {
  title: string
  description: string
  filters: CourseFilters
}

// /aprende/[slug] accepts the four category slugs plus `ia-para-<area>`
// (master spec §38 example: /aprende/ia-para-marketing).
export function resolveCourseSlug(slug: string): ResolvedCourseSlug | null {
  const category = courseCategoryFromSlug(slug)
  if (category) return { title: category.label, description: category.description, filters: { category: category.value } }

  const match = slug.match(/^ia-para-([a-z]+)$/)
  if (match && isProfessionValue(match[1])) {
    const label = professionLabel(match[1]) as string
    return {
      title: `IA para ${label}`,
      description: `Cursos y certificaciones oficiales para aplicar inteligencia artificial en ${label.toLowerCase()}.`,
      filters: { category: 'ia_por_profesion', area: match[1] },
    }
  }
  return null
}
```

```ts
// lib/data/courses.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { CourseRecord } from '@/lib/data/courseTypes'
import { buildCourseQueryDescriptor, type CourseFilters } from '@/lib/courses/queryBuilder'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function publishedQuery() {
  return createServerSupabaseClient().from('courses').select('*').eq('status', 'published')
}

// The catalog is small (dozens of rows), so no pagination — one ordered list.
export async function listPublishedCourses(filters: CourseFilters = {}): Promise<CourseRecord[]> {
  const descriptor = buildCourseQueryDescriptor(filters)
  let query = publishedQuery()
  for (const filter of descriptor.eqFilters) query = query.eq(filter.column, filter.value)
  if (descriptor.certificate) query = query.eq('has_certificate', true)
  const { data, error } = await query.order('featured', { ascending: false }).order('title', { ascending: true })
  if (error) throw new Error(`Failed to list courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

export async function listFeaturedCourses(limit = 3): Promise<CourseRecord[]> {
  const { data, error } = await publishedQuery().eq('featured', true).order('title', { ascending: true }).limit(limit)
  if (error) throw new Error(`Failed to list featured courses: ${error.message}`)
  return (data ?? []) as CourseRecord[]
}

export async function getCourseById(id: string): Promise<CourseRecord | null> {
  if (!UUID_RE.test(id)) return null
  const { data, error } = await publishedQuery().eq('id', id).maybeSingle()
  if (error) throw new Error(`Failed to load course ${id}: ${error.message}`)
  return (data as CourseRecord | null) ?? null
}

export async function incrementCourseClicks(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.from('courses').update({ click_count: currentCount + 1 }).eq('id', id)
  if (error) console.warn(`Failed to increment click_count for course ${id}: ${error.message}`)
}
```

Run: `npx vitest run lib/courses && npx tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/data/courseTypes.ts lib/data/courses.ts lib/courses
git commit -m "feat: course types, URL filter parsing, slug resolution, and read layer"
```

---

### Task 6: Catálogo semilla de cursos y script de carga

**Files:**
- Create: `lib/courses/seedCatalog.ts`, `scripts/seed-courses.ts`
- Modify: `lib/slug.ts` (agregar `generateContentSlug`), `lib/slug.test.ts`
- Test: `lib/courses/seedCatalog.test.ts`

**Interfaces:**
- Consumes: `CourseInsert`, constantes de cursos, `slugify`.
- Produces: `COURSE_SEED_CATALOG: CourseSeed[]`, `generateContentSlug(...parts)`.

Fuente del catálogo: el JSON investigado el 2026-09-05 en
`C:\Users\inver\AppData\Local\Temp\claude\c--ClaudeOne-Workcofy\f7ee93c8-9aec-419d-a723-221c99f30e3e\scratchpad\courses-seed.json`
(56 entradas con URL verificada; notas en `courses-seed-notes.md` del mismo directorio). Si ese archivo ya no existe, reconstruirlo según el spec §4: solo proveedores oficiales, `curl -L -o /dev/null -w "%{http_code}"` en 200 por URL.

- [ ] **Step 1: `generateContentSlug` con test**

Agregar a `lib/slug.test.ts`:

```ts
import { generateContentSlug } from './slug'

describe('generateContentSlug', () => {
  it('joins slugified parts, skipping empties', () => {
    expect(generateContentSlug('Fundamentos de IA generativa', 'Microsoft Learn')).toBe('fundamentos-de-ia-generativa-microsoft-learn')
    expect(generateContentSlug('Claude 101', '')).toBe('claude-101')
  })
})
```

Agregar a `lib/slug.ts`:

```ts
export function generateContentSlug(...parts: string[]): string {
  return parts.map(slugify).filter(Boolean).join('-')
}
```

Run: `npx vitest run lib/slug.test.ts` → PASS.

- [ ] **Step 2: Catálogo tipado**

```ts
// lib/courses/seedCatalog.ts
import type { CourseCategory, CourseLanguage, CourseLevel, CoursePrice, CourseTool } from './constants'
import type { ProfessionValue } from '@/lib/professions'

export interface CourseSeed {
  title: string
  provider: string
  category: CourseCategory
  area?: ProfessionValue | null
  tool?: CourseTool | null
  level: CourseLevel
  duration_text?: string | null
  price: CoursePrice
  price_text?: string | null
  has_certificate: boolean
  language: CourseLanguage
  url: string
  summary: string
  tags: string[]
  featured?: boolean
  last_verified_at: string
}

// Official-provider AI courses and certifications, researched and URL-verified
// on 2026-09-05 (design spec §4). Edit in Supabase's Table Editor after
// seeding; re-running `npm run seed:courses` upserts by slug.
export const COURSE_SEED_CATALOG: CourseSeed[] = [
  // one object per entry of courses-seed.json (see conversion command below)
]
```

Generar el contenido del array a partir del JSON y pegarlo (formatear a mano si hace falta):

```bash
node -e '
const rows = require(process.argv[1]);
const out = rows.map(r => ({ title: r.title, provider: r.provider, category: r.category, area: r.area ?? null, tool: r.tool ?? null, level: r.level, duration_text: r.duration_text ?? null, price: r.price, price_text: r.price_text ?? null, has_certificate: r.has_certificate, language: r.language, url: r.url, summary: r.summary, tags: r.tags, last_verified_at: r.verified_at }));
console.log(JSON.stringify(out, null, 2));
' "C:/Users/inver/AppData/Local/Temp/claude/c--ClaudeOne-Workcofy/f7ee93c8-9aec-419d-a723-221c99f30e3e/scratchpad/courses-seed.json"
```

Luego marcar `featured: true` en cuatro entradas que cubran las cuatro categorías, gratuitas y en español cuando exista (por ejemplo: un curso "IA desde cero" de Google o Microsoft en español, uno de Claude de Anthropic, uno de IA para marketing de HubSpot, y AI-900 de Microsoft).

- [ ] **Step 3: Test del catálogo**

```ts
// lib/courses/seedCatalog.test.ts
import { describe, expect, it } from 'vitest'
import { generateContentSlug } from '@/lib/slug'
import { COURSE_CATEGORIES } from './constants'
import { COURSE_SEED_CATALOG } from './seedCatalog'

describe('COURSE_SEED_CATALOG', () => {
  it('has unique slugs and https URLs', () => {
    const slugs = COURSE_SEED_CATALOG.map((c) => generateContentSlug(c.title, c.provider))
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const course of COURSE_SEED_CATALOG) expect(course.url).toMatch(/^https:\/\//)
  })
  it('covers every category and has featured picks', () => {
    for (const category of COURSE_CATEGORIES) {
      expect(COURSE_SEED_CATALOG.some((c) => c.category === category.value)).toBe(true)
    }
    expect(COURSE_SEED_CATALOG.filter((c) => c.featured).length).toBeGreaterThanOrEqual(3)
  })
  it('sets area for profession courses and tool for tool courses', () => {
    for (const course of COURSE_SEED_CATALOG) {
      if (course.category === 'ia_por_profesion') expect(course.area).toBeTruthy()
      if (course.category === 'herramientas') expect(course.tool).toBeTruthy()
    }
  })
})
```

Run: `npx vitest run lib/courses/seedCatalog.test.ts` → PASS (corregir entradas del catálogo si falla, por ejemplo cursos de herramientas sin `tool`).

- [ ] **Step 4: Script de carga**

```ts
// scripts/seed-courses.ts
import { createServiceRoleClient } from './lib/serviceRoleClient'
import { generateContentSlug } from '@/lib/slug'
import { COURSE_SEED_CATALOG } from '@/lib/courses/seedCatalog'
import type { CourseInsert } from '@/lib/data/courseTypes'

async function main() {
  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()
  const rows: (CourseInsert & { updated_at: string })[] = COURSE_SEED_CATALOG.map((course) => ({
    slug: generateContentSlug(course.title, course.provider),
    title: course.title,
    provider: course.provider,
    category: course.category,
    area: course.area ?? null,
    tool: course.tool ?? null,
    level: course.level,
    duration_text: course.duration_text ?? null,
    price: course.price,
    price_text: course.price_text ?? null,
    has_certificate: course.has_certificate,
    language: course.language,
    official: true,
    url: course.url,
    image_url: null,
    summary: course.summary,
    description: null,
    tags: course.tags,
    featured: course.featured ?? false,
    last_verified_at: course.last_verified_at,
    status: 'published',
    updated_at: now,
  }))

  const { error } = await supabase.from('courses').upsert(rows, { onConflict: 'slug' })
  if (error) {
    console.error(`Failed to seed courses: ${error.message}`)
    process.exit(1)
  }
  console.log(`Seeded ${rows.length} courses (${rows.filter((row) => row.featured).length} featured).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Run: `npm run seed:courses` → "Seeded 56 courses (4 featured)." Verificar en Table Editor.

- [ ] **Step 5: Commit**

```bash
git add lib/slug.ts lib/slug.test.ts lib/courses/seedCatalog.ts lib/courses/seedCatalog.test.ts scripts/seed-courses.ts
git commit -m "feat: official AI course seed catalog and loader script"
```

---

### Task 7: Primitivas de UI para listados (chips, búsqueda, tabs, paginación)

**Files:**
- Create: `components/ui/FilterChips.tsx`, `components/ui/SearchForm.tsx`, `components/ui/CategoryTabs.tsx`, `components/ui/Pagination.tsx`
- Test: `components/ui/filterHref.test.ts` (y `components/ui/filterHref.ts` con la función pura)

**Interfaces:**
- Produces: `filterHref(basePath, current, param, value)`, `FilterChips({ basePath, current, groups })`, `ChipGroup`, `SearchForm({ basePath, current, placeholder })`, `CategoryTabs({ items, activeHref })`, `Pagination({ basePath, current, page, total, pageSize })`.

Todos son server components sin hooks (los enlaces cambian la URL). `HorizontalScroller` es cliente y acepta hijos server-rendered.

- [ ] **Step 1: Test de `filterHref` (falla)**

```ts
// components/ui/filterHref.test.ts
import { describe, expect, it } from 'vitest'
import { filterHref } from './filterHref'

describe('filterHref', () => {
  it('sets a param, keeps the others, and resets page', () => {
    expect(filterHref('/oportunidades', { tipo: 'empleo', page: '3' }, 'nivel', 'junior')).toBe('/oportunidades?tipo=empleo&nivel=junior')
  })
  it('removes a param when value is null', () => {
    expect(filterHref('/oportunidades', { tipo: 'empleo' }, 'tipo', null)).toBe('/oportunidades')
  })
})
```

- [ ] **Step 2: Implementar**

```ts
// components/ui/filterHref.ts
export function filterHref(
  basePath: string,
  current: Record<string, string>,
  param: string,
  value: string | null
): string {
  const params = new URLSearchParams(current)
  params.delete('page')
  if (value === null) params.delete(param)
  else params.set(param, value)
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}
```

```tsx
// components/ui/FilterChips.tsx
import Link from 'next/link'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { filterHref } from './filterHref'

export interface ChipGroup {
  label: string
  param: string
  options: readonly { value: string; label: string }[]
  allLabel?: string
}

interface FilterChipsProps {
  basePath: string
  current: Record<string, string>
  groups: ChipGroup[]
}

export const CHIP_ACTIVE = 'whitespace-nowrap rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white'
export const CHIP_INACTIVE =
  'whitespace-nowrap rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-black'

// One row of link-chips per filter group. Active chip = param present in
// the URL; clicking "Todos" removes the param. No client state: the page is
// re-rendered by the server with the new searchParams.
export function FilterChips({ basePath, current, groups }: FilterChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const active = current[group.param] ?? null
        return (
          <div key={group.param} className="flex items-center gap-3">
            <span className="w-20 flex-none text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.label}</span>
            <HorizontalScroller className="gap-1.5">
              <Link href={filterHref(basePath, current, group.param, null)} className={active === null ? CHIP_ACTIVE : CHIP_INACTIVE}>
                {group.allLabel ?? 'Todos'}
              </Link>
              {group.options.map((option) => (
                <Link
                  key={option.value}
                  href={filterHref(basePath, current, group.param, option.value)}
                  className={active === option.value ? CHIP_ACTIVE : CHIP_INACTIVE}
                >
                  {option.label}
                </Link>
              ))}
            </HorizontalScroller>
          </div>
        )
      })}
    </div>
  )
}
```

```tsx
// components/ui/SearchForm.tsx
interface SearchFormProps {
  basePath: string
  current: Record<string, string>
  placeholder: string
}

// Plain GET form: keeps every other filter as hidden inputs so searching
// doesn't drop them, and resets pagination.
export function SearchForm({ basePath, current, placeholder }: SearchFormProps) {
  const hidden = Object.entries(current).filter(([key]) => key !== 'q' && key !== 'page')
  return (
    <form action={basePath} method="get" className="flex w-full items-center gap-2">
      {hidden.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ''}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
      />
      <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]">
        Buscar
      </button>
    </form>
  )
}
```

```tsx
// components/ui/CategoryTabs.tsx
import Link from 'next/link'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { CHIP_ACTIVE, CHIP_INACTIVE } from './FilterChips'

interface CategoryTabsProps {
  items: { href: string; label: string }[]
  activeHref: string
}

export function CategoryTabs({ items, activeHref }: CategoryTabsProps) {
  return (
    <HorizontalScroller className="gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={item.href === activeHref ? CHIP_ACTIVE : CHIP_INACTIVE}>
          {item.label}
        </Link>
      ))}
    </HorizontalScroller>
  )
}
```

```tsx
// components/ui/Pagination.tsx
import Link from 'next/link'

interface PaginationProps {
  basePath: string
  current: Record<string, string>
  page: number
  total: number
  pageSize: number
}

function pageHref(basePath: string, current: Record<string, string>, page: number): string {
  const params = new URLSearchParams(current)
  if (page > 1) params.set('page', String(page))
  else params.delete('page')
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

const BUTTON = 'rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-black'

export function Pagination({ basePath, current, page, total, pageSize }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500" aria-label="Paginación">
      {page > 1 && (
        <Link href={pageHref(basePath, current, page - 1)} className={BUTTON}>
          Anterior
        </Link>
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link href={pageHref(basePath, current, page + 1)} className={BUTTON}>
          Siguiente
        </Link>
      )}
    </nav>
  )
}
```

Run: `npx vitest run components/ui && npx tsc --noEmit` → PASS.

- [ ] **Step 3: Commit**

```bash
git add components/ui/filterHref.ts components/ui/filterHref.test.ts components/ui/FilterChips.tsx components/ui/SearchForm.tsx components/ui/CategoryTabs.tsx components/ui/Pagination.tsx
git commit -m "feat: link-driven filter chips, search form, category tabs and pagination"
```

---

### Task 8: Oportunidades — card, listado, detalle, rutas y tracking

**Files:**
- Create: `components/opportunities/OpportunityCard.tsx`, `components/opportunities/OpportunitiesListing.tsx`, `components/opportunities/OpportunityDetail.tsx`
- Create: `app/oportunidades/page.tsx`, `app/oportunidades/[slug]/page.tsx`, `app/ir/oportunidad/[id]/route.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 3, 7.
- Produces: `OpportunityCard({ opportunity, now? })`, `OpportunitiesListing({ basePath, category, searchParams })`, `OpportunityDetail({ opportunity })`.

- [ ] **Step 1: Card**

```tsx
// components/opportunities/OpportunityCard.tsx
import Link from 'next/link'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import { EXPERIENCE_LEVELS, OPPORTUNITY_MODALITIES, OPPORTUNITY_SOURCES, OPPORTUNITY_TYPES } from '@/lib/opportunities/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { formatRelativeDays } from '@/lib/text/relativeDays'

interface OpportunityCardProps {
  opportunity: OpportunityRecord
  now?: Date
}

const CHIP = 'rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700'

export function CompanyLogo({ name, logoUrl, className = 'h-10 w-10' }: { name: string; logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className={`${className} flex-none rounded-xl border border-gray-100 bg-white object-contain`} />
  }
  return (
    <span className={`${className} flex flex-none items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500`} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function OpportunityCard({ opportunity, now = new Date() }: OpportunityCardProps) {
  const detailUrl = `/oportunidades/${opportunity.slug}`
  const chips = [
    optionLabel(OPPORTUNITY_TYPES, opportunity.type),
    optionLabel(OPPORTUNITY_MODALITIES, opportunity.modality),
    optionLabel(EXPERIENCE_LEVELS, opportunity.experience_level),
  ].filter((label): label is string => label !== null)
  const area = professionLabel(opportunity.area)

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-3">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight">
            <Link href={detailUrl} className="hover:underline">
              {opportunity.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-gray-500">{opportunity.company}</p>
        </div>
        {opportunity.is_ai && (
          <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">IA</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className={CHIP}>
            {chip}
          </span>
        ))}
        {area && <span className={CHIP}>{area}</span>}
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {opportunity.location ?? 'Sin ubicación'}
        {opportunity.salary_text && <span className="text-gray-400"> · {opportunity.salary_text}</span>}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-xs text-gray-400">
          {formatRelativeDays(opportunity.published_at, now)} · {optionLabel(OPPORTUNITY_SOURCES, opportunity.source)}
        </span>
        <a
          href={`/ir/oportunidad/${opportunity.id}`}
          target="_blank"
          rel="noopener"
          className="whitespace-nowrap rounded-full border border-black bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]"
        >
          Ver oportunidad
        </a>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Listado (server component compartido por `/oportunidades` y las categorías)**

```tsx
// components/opportunities/OpportunitiesListing.tsx
import { listPublishedOpportunities } from '@/lib/data/opportunities'
import {
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORY_SLUGS,
  OPPORTUNITY_COUNTRIES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_TYPES,
  type OpportunityCategory,
} from '@/lib/opportunities/constants'
import {
  opportunityFiltersToParams,
  parseOpportunityFilters,
  type OpportunityFilters,
  type SearchParamsInput,
} from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import { CategoryTabs } from '@/components/ui/CategoryTabs'
import { FilterChips, type ChipGroup } from '@/components/ui/FilterChips'
import { Pagination } from '@/components/ui/Pagination'
import { SearchForm } from '@/components/ui/SearchForm'
import { OpportunityCard } from './OpportunityCard'

interface OpportunitiesListingProps {
  basePath: string
  category: OpportunityCategory | null
  searchParams: SearchParamsInput
}

const AI_OPTIONS = [
  { value: '1', label: 'Solo IA' },
  { value: '0', label: 'Sin IA' },
]

export async function OpportunitiesListing({ basePath, category, searchParams }: OpportunitiesListingProps) {
  const filters = parseOpportunityFilters(searchParams)
  // A category page bakes its own constraint in; the URL params refine within it.
  const effective: OpportunityFilters = {
    ...filters,
    ...(category?.filter.type ? { type: category.filter.type } : {}),
    ...(category?.filter.modality ? { modality: category.filter.modality } : {}),
    ...(category?.filter.ai ? { ai: true } : {}),
  }
  const current = opportunityFiltersToParams(filters)
  const result = await listPublishedOpportunities(effective)
  const now = new Date()

  const groups: ChipGroup[] = [
    ...(category?.filter.type ? [] : [{ label: 'Tipo', param: 'tipo', options: OPPORTUNITY_TYPES }]),
    ...(category?.filter.modality ? [] : [{ label: 'Modalidad', param: 'modalidad', options: OPPORTUNITY_MODALITIES }]),
    ...(category?.filter.ai ? [] : [{ label: 'IA', param: 'ia', options: AI_OPTIONS, allLabel: 'Todas' }]),
    { label: 'Nivel', param: 'nivel', options: EXPERIENCE_LEVELS },
    { label: 'Área', param: 'area', options: PROFESSION_OPTIONS, allLabel: 'Todas' },
    { label: 'País', param: 'pais', options: OPPORTUNITY_COUNTRIES },
  ]

  const tabs = [
    { href: '/oportunidades', label: 'Todas' },
    ...OPPORTUNITY_CATEGORY_SLUGS.map((entry) => ({ href: `/oportunidades/${entry.slug}`, label: entry.label })),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{category ? category.title : 'Oportunidades'}</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        {category
          ? category.description
          : 'Trabajos remotos, freelance, proyectos y prácticas para Perú, LatAm y el mundo. La postulación se hace en el sitio original.'}
      </p>

      <div className="mt-6">
        <CategoryTabs items={tabs} activeHref={basePath} />
      </div>
      <div className="mt-4 max-w-xl">
        <SearchForm basePath={basePath} current={current} placeholder="Buscar por puesto o empresa..." />
      </div>
      <div className="mt-4">
        <FilterChips basePath={basePath} current={current} groups={groups} />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {result.total} {result.total === 1 ? 'oportunidad' : 'oportunidades'}
      </p>

      {result.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold">No encontramos oportunidades con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros o con otra búsqueda.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} now={now} />
          ))}
        </div>
      )}

      <Pagination basePath={basePath} current={current} page={result.page} total={result.total} pageSize={result.pageSize} />
    </div>
  )
}
```

- [ ] **Step 3: Detalle**

```tsx
// components/opportunities/OpportunityDetail.tsx
import Link from 'next/link'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import { EXPERIENCE_LEVELS, OPPORTUNITY_MODALITIES, OPPORTUNITY_SOURCES, OPPORTUNITY_TYPES } from '@/lib/opportunities/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { formatRelativeDays } from '@/lib/text/relativeDays'
import { CompanyLogo } from './OpportunityCard'

const CHIP = 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700'

export function OpportunityDetail({ opportunity }: { opportunity: OpportunityRecord }) {
  const chips = [
    optionLabel(OPPORTUNITY_TYPES, opportunity.type),
    optionLabel(OPPORTUNITY_MODALITIES, opportunity.modality),
    optionLabel(EXPERIENCE_LEVELS, opportunity.experience_level),
    professionLabel(opportunity.area),
  ].filter((label): label is string => label !== null)
  const source = optionLabel(OPPORTUNITY_SOURCES, opportunity.source)
  const paragraphs = (opportunity.description ?? '').split('\n\n').filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-14">
      <Link href="/oportunidades" className="text-sm text-gray-500 hover:text-black">
        ← Todas las oportunidades
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <CompanyLogo name={opportunity.company} logoUrl={opportunity.company_logo_url} className="h-14 w-14" />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{opportunity.title}</h1>
          <p className="mt-1 text-gray-600">{opportunity.company}</p>
        </div>
        {opportunity.is_ai && <span className="ml-auto flex-none rounded-full bg-workcofy-yellow px-2.5 py-1 text-xs font-bold">IA</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className={CHIP}>
            {chip}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-400">Ubicación</dt>
          <dd className="font-medium">{opportunity.location ?? 'Sin ubicación'}</dd>
        </div>
        {opportunity.salary_text && (
          <div>
            <dt className="text-gray-400">Salario</dt>
            <dd className="font-medium">{opportunity.salary_text}</dd>
          </div>
        )}
        <div>
          <dt className="text-gray-400">Publicada</dt>
          <dd className="font-medium">{formatRelativeDays(opportunity.published_at)}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Fuente</dt>
          <dd className="font-medium">{source}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={`/ir/oportunidad/${opportunity.id}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
        >
          Ver oportunidad en {source}
        </a>
        <span className="text-xs text-gray-400">La postulación se realiza en el sitio original.</span>
      </div>

      {paragraphs.length > 0 && (
        <div className="mt-10 flex flex-col gap-4 text-sm leading-relaxed text-gray-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rutas**

```tsx
// app/oportunidades/page.tsx
import type { Metadata } from 'next'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Oportunidades de trabajo remoto, freelance y prácticas | Workcofy',
  description: 'Descubre trabajos remotos, proyectos freelance, prácticas y oportunidades en IA para Perú, LatAm y el mundo.',
}

export default function OportunidadesPage({ searchParams }: { searchParams: SearchParamsInput }) {
  return <OpportunitiesListing basePath="/oportunidades" category={null} searchParams={searchParams} />
}
```

```tsx
// app/oportunidades/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OpportunitiesListing } from '@/components/opportunities/OpportunitiesListing'
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail'
import { getOpportunityBySlug } from '@/lib/data/opportunities'
import { opportunityCategoryFromSlug } from '@/lib/opportunities/constants'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { truncateWords } from '@/lib/text/truncate'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: SearchParamsInput
}

// One dynamic segment serves both /oportunidades/remoto (a category view)
// and /oportunidades/<job-slug> (a detail page): categories are a fixed
// five-item list checked first, everything else is looked up as a job.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = opportunityCategoryFromSlug(params.slug)
  if (category) return { title: `${category.title} | Workcofy`, description: category.description }
  const opportunity = await getOpportunityBySlug(params.slug)
  if (!opportunity) return {}
  const title = `${opportunity.title} en ${opportunity.company} | Workcofy`
  const description = opportunity.summary ?? truncateWords(opportunity.description ?? '', 160)
  return { title, description, openGraph: { title, description } }
}

export default async function OportunidadSlugPage({ params, searchParams }: PageProps) {
  const category = opportunityCategoryFromSlug(params.slug)
  if (category) {
    return <OpportunitiesListing basePath={`/oportunidades/${category.slug}`} category={category} searchParams={searchParams} />
  }
  const opportunity = await getOpportunityBySlug(params.slug)
  if (!opportunity) notFound()
  return <OpportunityDetail opportunity={opportunity} />
}
```

```ts
// app/ir/oportunidad/[id]/route.ts
import { NextResponse } from 'next/server'
import { getOpportunityById, incrementOpportunityClicks } from '@/lib/data/opportunities'

export const dynamic = 'force-dynamic'

// Outbound redirect that counts the click (master spec §44). Awaited on
// purpose: on serverless a dangling promise may be dropped after the response.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const opportunity = await getOpportunityById(params.id)
  if (!opportunity) return new NextResponse('Oportunidad no encontrada', { status: 404 })
  await incrementOpportunityClicks(opportunity.id, opportunity.click_count)
  return NextResponse.redirect(opportunity.source_url, 302)
}
```

- [ ] **Step 5: Verificar a mano**

Run: `npx tsc --noEmit && npm run dev`
Abrir `http://localhost:3000/oportunidades`: se ven cards con logo, chips y fecha relativa; los chips cambian la URL y filtran; buscar "marketing" filtra; `/oportunidades/ia` muestra solo IA y oculta el grupo de chips "IA"; `/oportunidades/remoto` oculta "Modalidad"; clic en un título abre el detalle; "Ver oportunidad" abre getonbrd.com en otra pestaña y en Supabase `click_count` de esa fila sube en 1; `/oportunidades/no-existe` da 404.

- [ ] **Step 6: Commit**

```bash
git add components/opportunities app/oportunidades app/ir/oportunidad
git commit -m "feat: public Oportunidades listing, category views, detail page, and click-tracked outbound link"
```

---

### Task 9: Aprende — card, listado, rutas y tracking

**Files:**
- Create: `components/courses/CourseCard.tsx`, `components/courses/CoursesListing.tsx`
- Create: `app/aprende/page.tsx`, `app/aprende/[slug]/page.tsx`, `app/ir/curso/[id]/route.ts`

**Interfaces:**
- Consumes: Tasks 1, 5, 7.
- Produces: `CourseCard({ course })`, `CoursesListing({ basePath, fixed, heading, intro, searchParams })`.

- [ ] **Step 1: Card**

```tsx
// components/courses/CourseCard.tsx
import type { CourseRecord } from '@/lib/data/courseTypes'
import { COURSE_LANGUAGES, COURSE_LEVELS, courseCategoryFromValue } from '@/lib/courses/constants'
import { optionLabel } from '@/lib/optionLabel'

const CHIP = 'rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700'

export function CourseCard({ course }: { course: CourseRecord }) {
  const category = courseCategoryFromValue(course.category)
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-gray-400">{course.provider}</span>
        {course.official && <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">Oficial</span>}
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold leading-snug tracking-tight">{course.title}</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {category && <span className={CHIP}>{category.label}</span>}
        <span className={CHIP}>{optionLabel(COURSE_LEVELS, course.level)}</span>
        {course.duration_text && <span className={CHIP}>{course.duration_text}</span>}
        <span className={CHIP}>{optionLabel(COURSE_LANGUAGES, course.language)}</span>
      </div>

      {course.summary && <p className="mt-3 line-clamp-3 text-sm text-gray-600">{course.summary}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="flex items-center gap-2 text-xs">
          <span className={course.price === 'gratis' ? 'font-semibold text-workcofy-green' : 'font-semibold text-gray-700'}>
            {course.price === 'gratis' ? 'Gratis' : course.price_text ?? 'Pago'}
          </span>
          {course.has_certificate && <span className="text-gray-400">· Certificado</span>}
        </span>
        <a
          href={`/ir/curso/${course.id}`}
          target="_blank"
          rel="noopener"
          className="whitespace-nowrap rounded-full border border-black bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]"
        >
          Ver curso
        </a>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Listado**

```tsx
// components/courses/CoursesListing.tsx
import { listPublishedCourses } from '@/lib/data/courses'
import { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_LEVELS, COURSE_PRICES, COURSE_TOOLS } from '@/lib/courses/constants'
import { courseFiltersToParams, parseCourseFilters, type CourseFilters } from '@/lib/courses/queryBuilder'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import { CategoryTabs } from '@/components/ui/CategoryTabs'
import { FilterChips, type ChipGroup } from '@/components/ui/FilterChips'
import { CourseCard } from './CourseCard'

interface CoursesListingProps {
  basePath: string
  /** Filters baked into the route (category pages, ia-para-<area>); URL params refine within them. */
  fixed: CourseFilters
  heading: string
  intro: string
  searchParams: SearchParamsInput
}

const CERTIFICATE_OPTIONS = [{ value: '1', label: 'Con certificado' }]

export async function CoursesListing({ basePath, fixed, heading, intro, searchParams }: CoursesListingProps) {
  const filters = parseCourseFilters(searchParams)
  const effective: CourseFilters = { ...filters, ...fixed }
  const current = courseFiltersToParams(filters)
  const courses = await listPublishedCourses(effective)

  const groups: ChipGroup[] = [
    ...(fixed.category ? [] : [{ label: 'Categoría', param: 'categoria', options: COURSE_CATEGORIES, allLabel: 'Todas' }]),
    ...(fixed.area ? [] : [{ label: 'Área', param: 'area', options: PROFESSION_OPTIONS, allLabel: 'Todas' }]),
    { label: 'Herramienta', param: 'herramienta', options: COURSE_TOOLS, allLabel: 'Todas' },
    { label: 'Nivel', param: 'nivel', options: COURSE_LEVELS },
    { label: 'Precio', param: 'precio', options: COURSE_PRICES },
    { label: 'Idioma', param: 'idioma', options: COURSE_LANGUAGES },
    { label: 'Certificado', param: 'certificado', options: CERTIFICATE_OPTIONS, allLabel: 'Indistinto' },
  ]

  const tabs = [
    { href: '/aprende', label: 'Todos' },
    ...COURSE_CATEGORIES.map((category) => ({ href: `/aprende/${category.slug}`, label: category.label })),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{heading}</h1>
      <p className="mt-2 max-w-2xl text-gray-500">{intro}</p>

      <div className="mt-6">
        <CategoryTabs items={tabs} activeHref={basePath} />
      </div>
      <div className="mt-4">
        <FilterChips basePath={basePath} current={current} groups={groups} />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
      </p>

      {courses.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold">No hay cursos con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Rutas**

```tsx
// app/aprende/page.tsx
import type { Metadata } from 'next'
import { CoursesListing } from '@/components/courses/CoursesListing'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aprende IA aplicada al trabajo: cursos y certificaciones oficiales | Workcofy',
  description: 'Cursos y certificaciones oficiales de Anthropic, OpenAI, Google, Microsoft, AWS y más para usar inteligencia artificial en tu trabajo.',
}

export default function AprendePage({ searchParams }: { searchParams: SearchParamsInput }) {
  return (
    <CoursesListing
      basePath="/aprende"
      fixed={{}}
      heading="Aprende"
      intro="Cursos y certificaciones oficiales para usar la inteligencia artificial en tu trabajo. Curados por Workcofy, dictados por quienes crean las herramientas."
      searchParams={searchParams}
    />
  )
}
```

```tsx
// app/aprende/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CoursesListing } from '@/components/courses/CoursesListing'
import { resolveCourseSlug } from '@/lib/courses/resolveCourseSlug'
import type { SearchParamsInput } from '@/lib/opportunities/queryBuilder'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: SearchParamsInput
}

export function generateMetadata({ params }: PageProps): Metadata {
  const resolved = resolveCourseSlug(params.slug)
  if (!resolved) return {}
  return { title: `${resolved.title} | Workcofy`, description: resolved.description }
}

export default function AprendeSlugPage({ params, searchParams }: PageProps) {
  const resolved = resolveCourseSlug(params.slug)
  if (!resolved) notFound()
  return (
    <CoursesListing
      basePath={`/aprende/${params.slug}`}
      fixed={resolved.filters}
      heading={resolved.title}
      intro={resolved.description}
      searchParams={searchParams}
    />
  )
}
```

```ts
// app/ir/curso/[id]/route.ts
import { NextResponse } from 'next/server'
import { getCourseById, incrementCourseClicks } from '@/lib/data/courses'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const course = await getCourseById(params.id)
  if (!course) return new NextResponse('Curso no encontrado', { status: 404 })
  await incrementCourseClicks(course.id, course.click_count)
  return NextResponse.redirect(course.url, 302)
}
```

- [ ] **Step 4: Verificar a mano**

`npx tsc --noEmit && npm run dev`; abrir `/aprende` (56 cards, destacados primero), `/aprende/herramientas`, `/aprende/ia-para-marketing` (solo marketing, sin chips de categoría ni área), `/aprende/ia-para-x` → 404; "Ver curso" abre el proveedor y `click_count` sube.

- [ ] **Step 5: Commit**

```bash
git add components/courses app/aprende app/ir/curso
git commit -m "feat: public Aprende catalog with category and profession views and click-tracked links"
```

---

### Task 10: Espacios en `/espacios`, categorías por URL, ficha pública

**Files:**
- Move: `app/near-me/page.tsx` → `app/espacios/page.tsx`
- Create: `app/espacios/[categoria]/page.tsx`
- Modify: `lib/categories.ts`, `lib/categories.test.ts`, `components/discovery/EspaciosDashboard.tsx`, `next.config.mjs`, `middleware.ts`, `components/discovery/SpaceCard.tsx`, `components/discovery/DiscoveryView.tsx`, `components/layout/AppShell.tsx`, `components/layout/Footer.tsx`, `components/layout/AvatarMenu.tsx`, `components/layout/HeaderAuthLinks.tsx`, `app/admin/layout.tsx`, `app/auth/callback/route.ts`, `app/login/page.tsx`

**Interfaces:**
- Produces: `SPACE_CATEGORY_SLUGS`, `spaceCategoryFromSlug(slug)`; prop `initialCategory` en `EspaciosDashboard`.

- [ ] **Step 1: Slugs de categoría con test**

Agregar a `lib/categories.test.ts`:

```ts
import { SPACE_CATEGORY_SLUGS, spaceCategoryFromSlug } from './categories'

describe('spaceCategoryFromSlug', () => {
  it('maps public URL slugs to category values', () => {
    expect(spaceCategoryFromSlug('cafeterias')?.value).toBe('cafe')
    expect(spaceCategoryFromSlug('hoteles')?.value).toBe('hotel')
    expect(spaceCategoryFromSlug('bibliotecas')?.value).toBe('library')
    expect(spaceCategoryFromSlug('gimnasios')).toBeNull()
    expect(SPACE_CATEGORY_SLUGS.map((c) => c.slug)).toEqual(['cafeterias', 'work-cafe', 'coworking', 'hoteles', 'bibliotecas'])
  })
})
```

Agregar a `lib/categories.ts`:

```ts
// Public URL slugs for /espacios/[categoria] (master spec §38).
export interface SpaceCategorySlug {
  slug: string
  value: CategoryValue
  title: string
  description: string
}

export const SPACE_CATEGORY_SLUGS: SpaceCategorySlug[] = [
  { slug: 'cafeterias', value: 'cafe', title: 'Cafeterías para trabajar', description: 'Cafés con WiFi, enchufes y buen ambiente para trabajar con tu laptop.' },
  { slug: 'work-cafe', value: 'work_cafe', title: 'Work cafés', description: 'Cafés pensados para trabajar: mesas amplias, enchufes y zonas tranquilas.' },
  { slug: 'coworking', value: 'coworking', title: 'Coworkings', description: 'Espacios de coworking con escritorios, salas de reunión y comunidad.' },
  { slug: 'hoteles', value: 'hotel', title: 'Lobbies de hotel para trabajar', description: 'Lobbies y cafés de hotel donde puedes trabajar entre reuniones.' },
  { slug: 'bibliotecas', value: 'library', title: 'Bibliotecas', description: 'Bibliotecas y salas de lectura silenciosas para concentrarte.' },
]

export function spaceCategoryFromSlug(slug: string): SpaceCategorySlug | null {
  return SPACE_CATEGORY_SLUGS.find((category) => category.slug === slug) ?? null
}
```

Run: `npx vitest run lib/categories.test.ts` → PASS.

- [ ] **Step 2: Mover la ruta y agregar categorías**

```bash
git mv app/near-me app/espacios
```

En `app/espacios/page.tsx` cambiar la metadata a:

```ts
export const metadata = {
  title: 'Espacios para trabajar: cafeterías, coworkings y más | Workcofy',
  description: 'Encuentra cafés, work cafés, coworkings, hoteles y bibliotecas donde trabajar cerca de ti, con WiFi, enchufes y ambiente verificados.',
}
```

Crear `app/espacios/[categoria]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { spaceCategoryFromSlug } from '@/lib/categories'
import { listSpaces } from '@/lib/data/spaces'
import { isCurrentUserAdmin } from '@/lib/admin/isCurrentUserAdmin'
import { EspaciosDashboard } from '@/components/discovery/EspaciosDashboard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { categoria: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) return {}
  return { title: `${category.title} | Workcofy`, description: category.description }
}

// Same dashboard as /espacios with the category pre-selected — a crawlable
// URL per space type, reusing the list-first shell unchanged.
export default async function EspaciosCategoriaPage({ params }: PageProps) {
  const category = spaceCategoryFromSlug(params.categoria)
  if (!category) notFound()
  const [spaces, isAdmin] = await Promise.all([listSpaces(), isCurrentUserAdmin()])
  return <EspaciosDashboard spaces={spaces} isAdmin={isAdmin} initialCategory={category.value} />
}
```

En `components/discovery/EspaciosDashboard.tsx`:

```ts
// props
interface EspaciosDashboardProps {
  spaces: SpaceRecord[]
  isAdmin: boolean
  /** Category baked into the route (/espacios/[categoria]); falls back to ?category= otherwise. */
  initialCategory?: string | null
}
export function EspaciosDashboard({ spaces, isAdmin, initialCategory = null }: EspaciosDashboardProps) {
// ...
const [category, setCategory] = useState<string | null>(initialCategory ?? searchParams.get('category'))
```

y reemplazar las dos ocurrencias de `href="/near-me?view=map"` por `href="/espacios?view=map"`.

- [ ] **Step 3: Redirect permanente y referencias internas**

`next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'maps.googleapis.com' }],
  },
  async redirects() {
    // /near-me was the Espacios URL before the 2026-09 repositioning.
    return [{ source: '/near-me', destination: '/espacios', permanent: true }]
  },
}

export default nextConfig
```

Reemplazos exactos (`/near-me` → `/espacios`, conservando el resto de cada línea):

- `components/discovery/DiscoveryView.tsx`: comentario de la línea 90, `pathname === '/near-me'` (línea 91) y `href="/near-me"` (línea 263).
- `components/layout/AppShell.tsx`: `pathname === '/near-me'` → `pathname === '/espacios'`.
- `components/layout/Footer.tsx`: comentarios y `pathname === '/near-me'` → `'/espacios'`.
- `components/layout/AvatarMenu.tsx` y `components/layout/HeaderAuthLinks.tsx`: `/near-me?view=map&favorites=1` → `/espacios?view=map&favorites=1`.
- `app/admin/layout.tsx`: `href="/near-me"` → `href="/espacios"`.
- `app/auth/callback/route.ts`: `${origin}/near-me` → `${origin}/espacios`.
- `app/login/page.tsx`: `: '/near-me'` → `: '/espacios'`.
- `lib/discovery/selectNearbyPopularSpaces.ts`: comentario `(/near-me)` → `(/espacios)`.
- `components/home/Hero.tsx` y `components/home/ExplorarSection.tsx` se reescriben en Task 12; `components/layout/Sidebar.tsx` en Task 11.

Verificar: `grep -rn "near-me" app components lib middleware.ts` solo debe listar `nav-near-me.png` (icono) y `middleware.ts` (se edita abajo).

- [ ] **Step 4: Middleware y ficha pública**

`middleware.ts` completo:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

// While the online version is under maintenance, these routes redirect back
// to the marketing home instead of loading — Espacios and the whole
// login/registro/reset flow. Local dev never sets NEXT_PUBLIC_LAUNCH_LOCKED.
const LOCKED_PATHS = ['/espacios', '/login', '/registro', '/recuperar', '/restablecer']

export async function middleware(request: NextRequest) {
  if (LAUNCH_LOCKED && LOCKED_PATHS.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { response, user, supabase } = await updateSession(request)

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
      const redirect = NextResponse.redirect(loginUrl)
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      const redirect = NextResponse.redirect(new URL('/', request.url))
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.png$).*)'],
}
```

(Se eliminan el redirect de `/` → mapa para usuarios logueados y el gate de login en `/spaces/`, ambos por decisión aprobada.)

En `components/discovery/SpaceCard.tsx`: eliminar `import { useFavorites } ...` y `const { loggedIn } = useFavorites()`, y reemplazar el bloque `{!loggedIn ? (<Link href={`/login?next=...`}>…</Link>) : onViewDetail ? (…) : (…)}` por solo las dos ramas restantes:

```tsx
{onViewDetail ? (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation()
      onViewDetail()
    }}
    className={viewSpaceButtonClass}
  >
    Ver espacio
  </button>
) : (
  <Link href={spaceUrl} onClick={(event) => event.stopPropagation()} className={viewSpaceButtonClass}>
    Ver espacio
  </Link>
)}
```

(Conservar el resto del contenido de esa rama tal como está en el archivo; solo desaparece la rama `!loggedIn` y el comentario que la explica.)

- [ ] **Step 5: Verificar y commitear**

`npx tsc --noEmit && npm test && npm run dev`: `/near-me` redirige a `/espacios`; `/espacios/cafeterias` abre el dashboard con "Café" seleccionado; `/spaces/<slug>` abre sin sesión; un usuario logueado que entra a `/` ve el Home.

```bash
git add -A
git commit -m "feat: move Espacios to /espacios with category URLs, open space pages to the public"
```

---

### Task 11: Navegación (navbar, sidebar, footer)

**Files:**
- Modify: `lib/navLinks.ts`, `components/layout/Sidebar.tsx`, `components/layout/Footer.tsx`

**Interfaces:**
- Produces: `NAV_LINKS` con `Inicio`, `Oportunidades`, `Aprende`, `Espacios`.

- [ ] **Step 1: `NAV_LINKS`**

```ts
// lib/navLinks.ts
// The site's primary navigation (master spec §5), shared by Header, Sidebar
// and Footer so they can't drift apart. Eventos is deliberately absent for
// the validation MVP; Rewards lives inside Perfil, not here.
export const NAV_LINKS = [
  { href: '/', label: 'Inicio', icon: '/icons/nav-menu.png' },
  { href: '/oportunidades', label: 'Oportunidades', icon: '/icons/nav-equipos.png' },
  { href: '/aprende', label: 'Aprende', icon: '/icons/event-laptop.png' },
  { href: '/espacios', label: 'Espacios', icon: '/icons/nav-explorar.png' },
]

export function isNavLinkActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
```

`Header.tsx` no cambia (ya itera `NAV_LINKS`).

- [ ] **Step 2: Sidebar**

Reemplazar el bloque `<nav ...>…</nav>` de `components/layout/Sidebar.tsx` (desde `<nav className="mt-6 flex flex-col gap-1 px-2.5">` hasta su cierre) por:

```tsx
<nav className="mt-6 flex flex-col gap-1 px-2.5">
  {NAV_LINKS.filter((link) => link.href !== '/').map((link) => {
    const active = isNavLinkActive(link.href, pathname)
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-base font-semibold transition-colors ${
          active ? 'bg-workcofy-yellow/15 text-workcofy-black' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SIDEBAR_ICONS[link.label] ?? link.icon} alt="" className="h-5 w-auto flex-none" />
        {link.label}
      </Link>
    )
  })}

  <Link
    href="/perfil"
    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-base font-semibold transition-colors ${
      pathname === '/perfil' ? 'bg-workcofy-yellow/15 text-workcofy-black' : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icons/rewards-coin.png" alt="" className="h-5 w-auto flex-none" />
    Perfil
  </Link>

  {isAdmin && (
    <Link
      href="/admin/espacios"
      className={`mt-2 flex items-center gap-2 rounded-xl border-t border-gray-100 px-2.5 pb-2 pt-3 text-base font-semibold transition-colors ${
        pathname.startsWith('/admin') ? 'bg-workcofy-yellow/15 text-workcofy-black' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      Admin
    </Link>
  )}
</nav>
```

Además en el mismo archivo: importar `isNavLinkActive` junto a `NAV_LINKS`; cambiar `SIDEBAR_ICONS` a

```ts
const SIDEBAR_ICONS: Record<string, string> = {
  Oportunidades: '/icons/sidebar-equipo.png',
  Aprende: '/icons/event-laptop.png',
  Espacios: '/icons/sidebar-explorar.png',
}
```

y el enlace del logo pasa a `href="/"` con `aria-label="Ir al inicio"` (eliminar el import de `LAUNCH_LOCKED` si queda sin uso).

- [ ] **Step 3: Footer**

En `components/layout/Footer.tsx` reemplazar el párrafo bajo el logo por:

```tsx
<p className="mt-3 text-sm text-gray-500">
  Trabaja mejor. Desde cualquier lugar. Oportunidades, aprendizaje y espacios para trabajar en la era de la IA.
</p>
```

El listado "Secciones" ya itera `NAV_LINKS`.

- [ ] **Step 4: Verificar y commitear**

`npx tsc --noEmit && npm run lint`; en el navegador el header muestra Inicio · Oportunidades · Aprende · Espacios; el sidebar de escritorio (usuario logueado en `/espacios`) muestra los tres enlaces más Perfil y Admin, con el activo resaltado.

```bash
git add lib/navLinks.ts components/layout/Sidebar.tsx components/layout/Footer.tsx
git commit -m "feat: new primary navigation (Inicio, Oportunidades, Aprende, Espacios)"
```

---

### Task 12: Home reposicionado

**Files:**
- Modify: `components/home/Hero.tsx`, `components/home/ExplorarSection.tsx`, `app/page.tsx`
- Create: `components/home/PillarsSection.tsx`, `components/home/OpportunitiesHomeSection.tsx`, `components/home/AiSection.tsx`, `components/home/CoursesHomeSection.tsx`
- Delete: `components/home/EquiposSection.tsx`, `components/home/EventosSection.tsx`, `components/home/CoinsSection.tsx`, `components/home/BenefitsTeaser.tsx`

- [ ] **Step 1: Hero**

```tsx
// components/home/Hero.tsx
import Link from 'next/link'
import Image from 'next/image'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

const PRIMARY = 'inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]'
const SECONDARY = 'inline-flex items-center gap-2 rounded-full border border-black bg-white px-8 py-3.5 text-base font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]'

// Master spec §6. The illustration stays: it shows the product without
// repeating the headline.
export function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center md:px-8 md:pt-14">
      <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
        El talento está en todas partes. Las oportunidades no.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 md:text-lg">
        Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/oportunidades" className={PRIMARY}>
          Explorar oportunidades
        </Link>
        {LAUNCH_LOCKED ? (
          <span title="Próximamente" className="inline-flex cursor-not-allowed items-center rounded-full bg-gray-200 px-8 py-3.5 text-base font-semibold text-gray-400">
            Encontrar un espacio
          </span>
        ) : (
          <Link href="/espacios" className={SECONDARY}>
            Encontrar un espacio
          </Link>
        )}
      </div>

      <div className="relative mt-10">
        <Image
          src="/hero-bg.png"
          alt="Workcofy — trabaja mejor desde cualquier lugar"
          width={1672}
          height={847}
          priority
          className="h-auto w-full"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Pilares y bloque de IA**

```tsx
// components/home/PillarsSection.tsx
import Link from 'next/link'

interface Pillar {
  icon: string
  title: string
  text: string
  cta: string
  href: string | null
}

// Master spec §7. Eventos is listed but not linked (out of the validation MVP).
const PILLARS: Pillar[] = [
  { icon: '/icons/nav-equipos.png', title: 'Oportunidades', text: 'Encuentra trabajos remotos, proyectos, oportunidades freelance y nuevas formas de trabajar.', cta: 'Explorar oportunidades', href: '/oportunidades' },
  { icon: '/icons/event-laptop.png', title: 'Aprende', text: 'Desarrolla nuevas habilidades y aprende a utilizar la inteligencia artificial en tu trabajo.', cta: 'Aprender', href: '/aprende' },
  { icon: '/icons/nav-explorar.png', title: 'Espacios', text: 'Descubre cafeterías, coworkings, hoteles, bibliotecas y otros lugares donde puedes trabajar.', cta: 'Encontrar un espacio', href: '/espacios' },
  { icon: '/icons/nav-eventos.png', title: 'Eventos', text: 'Participa en workshops, AI Sessions, networking y encuentros para aprender y conectar.', cta: 'Ver eventos', href: null },
]

export function PillarsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <h2 className="text-center text-2xl font-bold tracking-tight md:text-4xl">Encuentra lo que necesitas para trabajar mejor</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex flex-col rounded-3xl border border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pillar.icon} alt="" className="h-6 w-6" />
              <h3 className="text-lg font-bold tracking-tight">{pillar.title}</h3>
              {pillar.href === null && (
                <span className="ml-auto rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Próximamente</span>
              )}
            </div>
            <p className="mt-3 flex-1 text-sm text-gray-600">{pillar.text}</p>
            {pillar.href ? (
              <Link href={pillar.href} className="mt-5 inline-block w-fit rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]">
                {pillar.cta}
              </Link>
            ) : (
              <span className="mt-5 inline-block w-fit cursor-not-allowed rounded-full bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-400">{pillar.cta}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
```

```tsx
// components/home/AiSection.tsx
import Link from 'next/link'

// Master spec §31.
export function AiSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-3xl bg-black px-5 py-10 text-white sm:px-8 md:px-12 md:py-14">
        <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
          La inteligencia artificial está cambiando la forma en que trabajamos.
        </h2>
        <p className="mt-4 max-w-2xl text-gray-300">
          Aprende a utilizarla, descubre nuevas oportunidades y desarrolla habilidades que te permitan adaptarte al nuevo mundo laboral.
        </p>
        <Link href="/aprende" className="mt-6 inline-block rounded-full bg-workcofy-yellow px-6 py-2.5 text-sm font-semibold text-black transition-all hover:shadow-md active:scale-[0.97]">
          Explorar aprendizaje
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Bloques dinámicos de oportunidades y cursos**

```tsx
// components/home/OpportunitiesHomeSection.tsx
import Link from 'next/link'
import { listRecentOpportunities } from '@/lib/data/opportunities'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'

// Master spec §33: the three most recent published opportunities.
export async function OpportunitiesHomeSection() {
  const opportunities = await listRecentOpportunities(3)
  if (opportunities.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Oportunidades</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Nuevas oportunidades</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      <Link href="/oportunidades" className="mt-8 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]">
        Ver todas las oportunidades
      </Link>
    </section>
  )
}
```

```tsx
// components/home/CoursesHomeSection.tsx
import Link from 'next/link'
import { listFeaturedCourses } from '@/lib/data/courses'
import { CourseCard } from '@/components/courses/CourseCard'

// Master spec §35: featured courses picked in the courses table.
export async function CoursesHomeSection() {
  const courses = await listFeaturedCourses(3)
  if (courses.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Aprende</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Aprende algo nuevo hoy</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <Link href="/aprende" className="mt-8 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]">
        Explorar cursos
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Sección Espacios existente y composición del Home**

En `components/home/ExplorarSection.tsx`: `01 — Espacios` → `Espacios`; el `<h2>` pasa a `Encuentra tu próximo lugar para trabajar.`; ambos `href="/near-me"` → `href="/espacios"`.

```tsx
// app/page.tsx
import { Hero } from '@/components/home/Hero'
import { PillarsSection } from '@/components/home/PillarsSection'
import { OpportunitiesHomeSection } from '@/components/home/OpportunitiesHomeSection'
import { AiSection } from '@/components/home/AiSection'
import { ExplorarSection } from '@/components/home/ExplorarSection'
import { CoursesHomeSection } from '@/components/home/CoursesHomeSection'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div>
      <Hero />
      <PillarsSection />
      <OpportunitiesHomeSection />
      <AiSection />
      <ExplorarSection />
      <CoursesHomeSection />
    </div>
  )
}
```

```bash
git rm components/home/EquiposSection.tsx components/home/EventosSection.tsx components/home/CoinsSection.tsx components/home/BenefitsTeaser.tsx
```

Comprobar con `grep -rn "EquiposSection\|EventosSection\|CoinsSection\|BenefitsTeaser\|anySpaceHasBenefits" app components` que no quedan referencias (si `anySpaceHasBenefits` queda sin uso en `lib/data/benefits.ts`, dejarla: `listSpaceBenefits` del mismo archivo sigue en uso en la ficha).

- [ ] **Step 5: Verificar y commitear**

`npx tsc --noEmit && npm run lint && npm run dev`: el Home muestra Hero nuevo, cuatro pilares (Eventos con Próximamente), 3 oportunidades reales, bloque negro de IA, sección Espacios, 3 cursos destacados. Mobile: las grillas colapsan a una columna.

```bash
git add -A app/page.tsx components/home
git commit -m "feat: repositioned Home with four pillars, AI block, and live opportunities and courses"
```

---

### Task 13: SEO (metadata, sitemap, robots) y verificación final

**Files:**
- Modify: `app/layout.tsx`, `.env.example`, `README.md`
- Create: `app/sitemap.ts`, `app/robots.ts`

- [ ] **Step 1: Metadata raíz y URL del sitio**

En `app/layout.tsx`:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'),
  title: 'Workcofy | Trabaja mejor. Desde cualquier lugar.',
  description: 'Workcofy conecta personas con oportunidades, conocimiento, espacios y experiencias para trabajar mejor en la era de la IA.',
}
```

En `.env.example` agregar al final:

```
# Public site URL used for sitemap/robots and absolute metadata URLs.
NEXT_PUBLIC_SITE_URL=https://workcofy.com
```

- [ ] **Step 2: Sitemap y robots**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SPACE_CATEGORY_SLUGS } from '@/lib/categories'
import { COURSE_CATEGORIES } from '@/lib/courses/constants'
import { listSpaces } from '@/lib/data/spaces'
import { listPublishedOpportunitySlugs } from '@/lib/data/opportunities'
import { OPPORTUNITY_CATEGORY_SLUGS } from '@/lib/opportunities/constants'
import { PROFESSION_VALUES } from '@/lib/professions'

export const dynamic = 'force-dynamic'

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com').replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()
  const staticPaths = [
    '/', '/oportunidades', '/aprende', '/espacios', '/terminos', '/privacidad',
    ...OPPORTUNITY_CATEGORY_SLUGS.map((c) => `/oportunidades/${c.slug}`),
    ...COURSE_CATEGORIES.map((c) => `/aprende/${c.slug}`),
    ...PROFESSION_VALUES.filter((v) => v !== 'otros').map((v) => `/aprende/ia-para-${v}`),
    ...SPACE_CATEGORY_SLUGS.map((c) => `/espacios/${c.slug}`),
  ]
  const [opportunities, spaces] = await Promise.all([listPublishedOpportunitySlugs(), listSpaces()])

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: now })),
    ...opportunities.map((row) => ({ url: `${base}/oportunidades/${row.slug}`, lastModified: new Date(row.updated_at) })),
    ...spaces.map((space) => ({ url: `${base}/spaces/${space.slug}`, lastModified: now })),
  ]
}
```

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com').replace(/\/$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/ir/', '/perfil', '/favoritos', '/auth/'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: README**

Agregar al README, después de "Datos reales (con key de Google Maps Platform)":

```markdown
## Oportunidades y cursos

Las tablas `opportunities` y `courses` (migración `0014`) se cargan por script y se editan en el Table Editor de Supabase:

```bash
npm run seed:getonboard   # trae vacantes de la API pública de GetOnBoard (últimos 45 días, LatAm + remoto)
npm run seed:courses      # carga el catálogo de cursos oficiales de IA (lib/courses/seedCatalog.ts)
```

Ambos leen `.env.local` automáticamente. Re-ejecutarlos actualiza filas existentes (upsert). Los clics en "Ver oportunidad" / "Ver curso" se cuentan en `click_count`.
```

- [ ] **Step 4: Verificación final**

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: todo en verde y el build termina sin errores. Luego `npm run start` y comprobar `/sitemap.xml`, `/robots.txt`, y un recorrido completo: Home → Oportunidades → detalle → Ver oportunidad; Home → Aprende → Ver curso; Home → Espacios → ficha sin login; `/near-me` → `/espacios`.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/sitemap.ts app/robots.ts .env.example README.md
git commit -m "feat: site metadata, sitemap and robots for the repositioned MVP"
```

---

## Después del plan

- Configurar `NEXT_PUBLIC_SITE_URL` en Vercel y ejecutar la migración `0014` en el proyecto de producción antes del deploy.
- Correr `npm run seed:getonboard` contra producción (con el `.env.local` apuntando a ese proyecto) y repetirlo cada pocos días mientras dure la validación.
- Fuera de alcance (spec §9): admin CRUD, rutas de aprendizaje, más fuentes, clasificación con Claude, filtros avanzados de Espacios, Eventos.
