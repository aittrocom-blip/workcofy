# Registration Expansion (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/registro` into a source of real business data (name, country, city, acquisition source, consents) from day one, without adding a client-side write path to `profiles`.

**Architecture:** The new fields are collected in the existing registration form and passed as `signUp()`'s `options.data` (Supabase user metadata, landing on `auth.users.raw_user_meta_data`). The `handle_new_user()` trigger — already responsible for creating the `profiles` row — is extended to read that metadata and populate the new columns in the same insert. No new RLS write policy is needed.

**Tech Stack:** Next.js 14 App Router, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), TypeScript, Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-28-registration-expansion-design.md`

## Global Constraints

- `name`, `country`, `city`, `acquisition_source` stay nullable at the database level — required-ness is enforced by the form only, so a future social-login signup (no metadata) doesn't violate a constraint.
- `terms_accepted` stays `not null default false`.
- No new RLS write policy on `profiles` for the `authenticated` role.
- `country` values are lowercase 2-letter ISO codes (matching the existing `pe`/`cl` convention in `lib/countries.ts`), not display labels.
- No automated tests for this pass (form + migration + static pages, no extractable pure logic) — verification is manual, per the spec's Testing section.
- `npx tsc --noEmit` and the existing `vitest` suite (83 tests) must stay clean after every task.
- Match existing code style: no comments explaining *what* code does, only non-obvious *why*.

---

## Task 1: Migration — new `profiles` columns + updated signup trigger

**Files:**
- Create: `supabase/migrations/0007_profile_registration_fields.sql`

**Interfaces:**
- Produces: nine new columns on `profiles` — `name text`, `country text`, `city text`, `acquisition_source text`, `marketing_consent boolean not null default false`, `marketing_consent_at timestamptz`, `terms_accepted boolean not null default false`, `terms_version text`, `terms_accepted_at timestamptz` — that Task 4's form submission populates via the trigger.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/0007_profile_registration_fields.sql`:

```sql
alter table profiles add column if not exists name text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists acquisition_source text;
alter table profiles add column if not exists marketing_consent boolean not null default false;
alter table profiles add column if not exists marketing_consent_at timestamptz;
alter table profiles add column if not exists terms_accepted boolean not null default false;
alter table profiles add column if not exists terms_version text;
alter table profiles add column if not exists terms_accepted_at timestamptz;

-- Reads the extra fields signUp()'s options.data attaches to auth.users as
-- raw_user_meta_data — the client never gets a session until email
-- confirmation, so this trigger (not a client-side update) is the only way
-- to populate these columns at signup time. See the design spec's
-- "How new fields reach the database" section for the rejected alternatives.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, name, country, city, acquisition_source,
    marketing_consent, marketing_consent_at, terms_accepted, terms_version, terms_accepted_at
  )
  values (
    new.id, coalesce(new.email, ''),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'acquisition_source',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    case when (new.raw_user_meta_data->>'marketing_consent')::boolean then now() else null end,
    coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false),
    new.raw_user_meta_data->>'terms_version',
    case when (new.raw_user_meta_data->>'terms_accepted')::boolean then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = '';
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**" --exclude "**/.worktrees/**"` — expect `83 passed`.

- [ ] **Step 3: Tell the user to run the migration**

This SQL cannot be applied directly — no DDL access. Tell the user to paste
`supabase/migrations/0007_profile_registration_fields.sql`'s contents into
the Supabase SQL Editor and run it before Task 4's registration form can be
manually verified end-to-end.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_profile_registration_fields.sql
git commit -m "feat: add profile registration fields migration"
```

---

## Task 2: Full country list for the registration form

**Files:**
- Create: `lib/allCountries.ts`

**Interfaces:**
- Produces: `ALL_COUNTRIES: { value: string; label: string }[]` — sorted alphabetically by `label`, `value` a lowercase 2-letter ISO 3166-1 alpha-2 code — consumed by Task 4's country `<select>`.

- [ ] **Step 1: Write the country list**

Create `lib/allCountries.ts`:

```ts
// Full country list for the registration form's country selector —
// deliberately separate from lib/countries.ts's COUNTRY_OPTIONS, which is
// scoped to where Workcofy currently operates (Perú/Chile) for the
// discovery filters. This one is "where a signing-up user might be from,"
// a different concern with a much longer value set.
export const ALL_COUNTRIES: { value: string; label: string }[] = [
  { value: 'af', label: 'Afganistán' },
  { value: 'za', label: 'Sudáfrica' },
  { value: 'al', label: 'Albania' },
  { value: 'de', label: 'Alemania' },
  { value: 'ad', label: 'Andorra' },
  { value: 'ao', label: 'Angola' },
  { value: 'sa', label: 'Arabia Saudita' },
  { value: 'dz', label: 'Argelia' },
  { value: 'ar', label: 'Argentina' },
  { value: 'am', label: 'Armenia' },
  { value: 'au', label: 'Australia' },
  { value: 'at', label: 'Austria' },
  { value: 'az', label: 'Azerbaiyán' },
  { value: 'bs', label: 'Bahamas' },
  { value: 'bd', label: 'Bangladés' },
  { value: 'bb', label: 'Barbados' },
  { value: 'bh', label: 'Baréin' },
  { value: 'be', label: 'Bélgica' },
  { value: 'bz', label: 'Belice' },
  { value: 'bj', label: 'Benín' },
  { value: 'by', label: 'Bielorrusia' },
  { value: 'mm', label: 'Birmania' },
  { value: 'bo', label: 'Bolivia' },
  { value: 'ba', label: 'Bosnia y Herzegovina' },
  { value: 'bw', label: 'Botsuana' },
  { value: 'br', label: 'Brasil' },
  { value: 'bn', label: 'Brunéi' },
  { value: 'bg', label: 'Bulgaria' },
  { value: 'bf', label: 'Burkina Faso' },
  { value: 'bi', label: 'Burundi' },
  { value: 'bt', label: 'Bután' },
  { value: 'cv', label: 'Cabo Verde' },
  { value: 'kh', label: 'Camboya' },
  { value: 'cm', label: 'Camerún' },
  { value: 'ca', label: 'Canadá' },
  { value: 'qa', label: 'Catar' },
  { value: 'td', label: 'Chad' },
  { value: 'cl', label: 'Chile' },
  { value: 'cn', label: 'China' },
  { value: 'cy', label: 'Chipre' },
  { value: 'co', label: 'Colombia' },
  { value: 'km', label: 'Comoras' },
  { value: 'kp', label: 'Corea del Norte' },
  { value: 'kr', label: 'Corea del Sur' },
  { value: 'ci', label: 'Costa de Marfil' },
  { value: 'cr', label: 'Costa Rica' },
  { value: 'hr', label: 'Croacia' },
  { value: 'cu', label: 'Cuba' },
  { value: 'dk', label: 'Dinamarca' },
  { value: 'dm', label: 'Dominica' },
  { value: 'ec', label: 'Ecuador' },
  { value: 'eg', label: 'Egipto' },
  { value: 'sv', label: 'El Salvador' },
  { value: 'ae', label: 'Emiratos Árabes Unidos' },
  { value: 'er', label: 'Eritrea' },
  { value: 'sk', label: 'Eslovaquia' },
  { value: 'si', label: 'Eslovenia' },
  { value: 'es', label: 'España' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'ee', label: 'Estonia' },
  { value: 'sz', label: 'Esuatini' },
  { value: 'et', label: 'Etiopía' },
  { value: 'ph', label: 'Filipinas' },
  { value: 'fi', label: 'Finlandia' },
  { value: 'fj', label: 'Fiyi' },
  { value: 'fr', label: 'Francia' },
  { value: 'ga', label: 'Gabón' },
  { value: 'gm', label: 'Gambia' },
  { value: 'ge', label: 'Georgia' },
  { value: 'gh', label: 'Ghana' },
  { value: 'gd', label: 'Granada' },
  { value: 'gr', label: 'Grecia' },
  { value: 'gt', label: 'Guatemala' },
  { value: 'gy', label: 'Guyana' },
  { value: 'gn', label: 'Guinea' },
  { value: 'gw', label: 'Guinea-Bisáu' },
  { value: 'gq', label: 'Guinea Ecuatorial' },
  { value: 'ht', label: 'Haití' },
  { value: 'hn', label: 'Honduras' },
  { value: 'hu', label: 'Hungría' },
  { value: 'in', label: 'India' },
  { value: 'id', label: 'Indonesia' },
  { value: 'iq', label: 'Irak' },
  { value: 'ir', label: 'Irán' },
  { value: 'ie', label: 'Irlanda' },
  { value: 'is', label: 'Islandia' },
  { value: 'sb', label: 'Islas Salomón' },
  { value: 'il', label: 'Israel' },
  { value: 'it', label: 'Italia' },
  { value: 'jm', label: 'Jamaica' },
  { value: 'jp', label: 'Japón' },
  { value: 'jo', label: 'Jordania' },
  { value: 'kz', label: 'Kazajistán' },
  { value: 'ke', label: 'Kenia' },
  { value: 'kg', label: 'Kirguistán' },
  { value: 'ki', label: 'Kiribati' },
  { value: 'kw', label: 'Kuwait' },
  { value: 'la', label: 'Laos' },
  { value: 'ls', label: 'Lesoto' },
  { value: 'lv', label: 'Letonia' },
  { value: 'lb', label: 'Líbano' },
  { value: 'lr', label: 'Liberia' },
  { value: 'ly', label: 'Libia' },
  { value: 'li', label: 'Liechtenstein' },
  { value: 'lt', label: 'Lituania' },
  { value: 'lu', label: 'Luxemburgo' },
  { value: 'mk', label: 'Macedonia del Norte' },
  { value: 'mg', label: 'Madagascar' },
  { value: 'my', label: 'Malasia' },
  { value: 'mw', label: 'Malaui' },
  { value: 'mv', label: 'Maldivas' },
  { value: 'ml', label: 'Malí' },
  { value: 'mt', label: 'Malta' },
  { value: 'ma', label: 'Marruecos' },
  { value: 'mu', label: 'Mauricio' },
  { value: 'mr', label: 'Mauritania' },
  { value: 'mx', label: 'México' },
  { value: 'fm', label: 'Micronesia' },
  { value: 'md', label: 'Moldavia' },
  { value: 'mc', label: 'Mónaco' },
  { value: 'mn', label: 'Mongolia' },
  { value: 'me', label: 'Montenegro' },
  { value: 'mz', label: 'Mozambique' },
  { value: 'na', label: 'Namibia' },
  { value: 'nr', label: 'Nauru' },
  { value: 'np', label: 'Nepal' },
  { value: 'ni', label: 'Nicaragua' },
  { value: 'ne', label: 'Níger' },
  { value: 'ng', label: 'Nigeria' },
  { value: 'no', label: 'Noruega' },
  { value: 'nz', label: 'Nueva Zelanda' },
  { value: 'om', label: 'Omán' },
  { value: 'nl', label: 'Países Bajos' },
  { value: 'pk', label: 'Pakistán' },
  { value: 'pw', label: 'Palaos' },
  { value: 'pa', label: 'Panamá' },
  { value: 'pg', label: 'Papúa Nueva Guinea' },
  { value: 'py', label: 'Paraguay' },
  { value: 'pe', label: 'Perú' },
  { value: 'pl', label: 'Polonia' },
  { value: 'pt', label: 'Portugal' },
  { value: 'gb', label: 'Reino Unido' },
  { value: 'cf', label: 'República Centroafricana' },
  { value: 'cz', label: 'República Checa' },
  { value: 'cg', label: 'República del Congo' },
  { value: 'cd', label: 'República Democrática del Congo' },
  { value: 'do', label: 'República Dominicana' },
  { value: 'rw', label: 'Ruanda' },
  { value: 'ro', label: 'Rumanía' },
  { value: 'ru', label: 'Rusia' },
  { value: 'ws', label: 'Samoa' },
  { value: 'kn', label: 'San Cristóbal y Nieves' },
  { value: 'sm', label: 'San Marino' },
  { value: 'vc', label: 'San Vicente y las Granadinas' },
  { value: 'lc', label: 'Santa Lucía' },
  { value: 'st', label: 'Santo Tomé y Príncipe' },
  { value: 'sn', label: 'Senegal' },
  { value: 'rs', label: 'Serbia' },
  { value: 'sc', label: 'Seychelles' },
  { value: 'sl', label: 'Sierra Leona' },
  { value: 'sg', label: 'Singapur' },
  { value: 'sy', label: 'Siria' },
  { value: 'so', label: 'Somalia' },
  { value: 'lk', label: 'Sri Lanka' },
  { value: 'se', label: 'Suecia' },
  { value: 'ch', label: 'Suiza' },
  { value: 'sr', label: 'Surinam' },
  { value: 'th', label: 'Tailandia' },
  { value: 'tz', label: 'Tanzania' },
  { value: 'tj', label: 'Tayikistán' },
  { value: 'tl', label: 'Timor Oriental' },
  { value: 'tg', label: 'Togo' },
  { value: 'to', label: 'Tonga' },
  { value: 'tt', label: 'Trinidad y Tobago' },
  { value: 'tn', label: 'Túnez' },
  { value: 'tm', label: 'Turkmenistán' },
  { value: 'tr', label: 'Turquía' },
  { value: 'tv', label: 'Tuvalu' },
  { value: 'ua', label: 'Ucrania' },
  { value: 'ug', label: 'Uganda' },
  { value: 'uy', label: 'Uruguay' },
  { value: 'uz', label: 'Uzbekistán' },
  { value: 'vu', label: 'Vanuatu' },
  { value: 've', label: 'Venezuela' },
  { value: 'vn', label: 'Vietnam' },
  { value: 'ye', label: 'Yemen' },
  { value: 'dj', label: 'Yibuti' },
  { value: 'zm', label: 'Zambia' },
  { value: 'zw', label: 'Zimbabue' },
].sort((a, b) => a.label.localeCompare(b.label, 'es'))
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**" --exclude "**/.worktrees/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

In a Node REPL or a scratch file, confirm `ALL_COUNTRIES[0].label` sorts
correctly in Spanish collation (e.g. "Afganistán" before "Albania" before
"Alemania") — the `.sort(...localeCompare(a, b, 'es'))` at the bottom of
the file handles this; no separate test needed since Task 4's `<select>`
will visibly confirm the order.

- [ ] **Step 4: Commit**

```bash
git add lib/allCountries.ts
git commit -m "feat: add full country list for registration form"
```

---

## Task 3: Placeholder legal pages + Footer links

**Files:**
- Create: `app/terminos/page.tsx`
- Create: `app/privacidad/page.tsx`
- Modify: `components/layout/Footer.tsx`

**Interfaces:**
- Produces: `/terminos` and `/privacidad` routes, linked from Task 4's registration form (terms checkbox) and from the Footer.

- [ ] **Step 1: Write the Terms placeholder page**

Create `app/terminos/page.tsx`:

```tsx
export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <span className="inline-block rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">
        Borrador — texto provisional
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-gray-400">Última actualización: 28 de agosto de 2026</p>
      <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-gray-600">
        <p>
          Este es un texto provisional. Al crear una cuenta en Workcofy aceptas usar la
          plataforma de forma responsable y de acuerdo a la legislación aplicable. Este texto
          será reemplazado por los Términos y Condiciones definitivos antes del lanzamiento
          formal del servicio.
        </p>
        <p>
          Si tienes preguntas sobre el uso de la plataforma mientras tanto, puedes contactarnos
          directamente.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the Privacy placeholder page**

Create `app/privacidad/page.tsx`:

```tsx
export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <span className="inline-block rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500">
        Borrador — texto provisional
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Política de Privacidad</h1>
      <p className="mt-2 text-sm text-gray-400">Última actualización: 28 de agosto de 2026</p>
      <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-gray-600">
        <p>
          Este es un texto provisional. Workcofy recopila la información que proporcionas al
          registrarte (nombre, correo, país, ciudad) para operar y mejorar el servicio. Este
          texto será reemplazado por la Política de Privacidad definitiva antes del lanzamiento
          formal del servicio.
        </p>
        <p>
          Si tienes preguntas sobre el uso de tus datos mientras tanto, puedes contactarnos
          directamente.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add Footer links**

In `components/layout/Footer.tsx`, add a legal-links row next to the
copyright line. Replace:

```tsx
      <div className="mx-auto mt-10 max-w-7xl border-t border-gray-100 pt-6 text-xs text-gray-400">
        © {year} Workcofy. Todos los derechos reservados.
      </div>
```

with:

```tsx
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-6 text-xs text-gray-400">
        <span>© {year} Workcofy. Todos los derechos reservados.</span>
        <Link href="/terminos" className="hover:text-black">
          Términos
        </Link>
        <Link href="/privacidad" className="hover:text-black">
          Privacidad
        </Link>
      </div>
```

`Link` is already imported in this file (used elsewhere for `NAV_LINKS`)
— no new import needed.

- [ ] **Step 4: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**" --exclude "**/.worktrees/**"` — expect `83 passed`.

- [ ] **Step 5: Manual verification**

With the dev server running, visit `/terminos` and `/privacidad` directly
— confirm both render with the "Borrador" badge and the placeholder text.
Visit any page with a footer (e.g. `/`) and confirm "Términos" and
"Privacidad" links appear next to the copyright line and navigate
correctly.

- [ ] **Step 6: Commit**

```bash
git add app/terminos/page.tsx app/privacidad/page.tsx components/layout/Footer.tsx
git commit -m "feat: add placeholder legal pages and footer links"
```

---

## Task 4: Expand the registration form

**Files:**
- Modify: `app/registro/page.tsx`

**Interfaces:**
- Consumes: `ALL_COUNTRIES: { value: string; label: string }[]` from `lib/allCountries.ts` (Task 2); `/terminos` route (Task 3, for the terms checkbox's link).
- Produces: `signUp()` calls with `options.data` populated — the shape Task 1's `handle_new_user()` trigger reads (`name`, `country`, `city`, `acquisition_source`, `marketing_consent`, `terms_accepted`, `terms_version`).

- [ ] **Step 1: Replace the registration page**

Replace the full contents of `app/registro/page.tsx` with:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { translateAuthError, NETWORK_ERROR_MESSAGE } from '@/lib/supabase/authErrors'
import { ALL_COUNTRIES } from '@/lib/allCountries'

const TERMS_VERSION = 'v1'

const ACQUISITION_SOURCES: { value: string; label: string }[] = [
  { value: 'google', label: 'Google / buscador' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Recomendación de un amigo' },
  { value: 'venue', label: 'Un café / hotel / coworking' },
  { value: 'ads', label: 'Publicidad' },
  { value: 'other', label: 'Otro' },
]

export default function RegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [acquisitionSource, setAcquisitionSource] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            country,
            city,
            acquisition_source: acquisitionSource,
            marketing_consent: marketingConsent,
            terms_accepted: termsAccepted,
            terms_version: TERMS_VERSION,
          },
        },
      })

      if (signUpError) {
        setError(translateAuthError(signUpError))
        return
      }
      setStatus('sent')
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setStatus((current) => (current === 'sent' ? current : 'idle'))
    }
  }

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Revisa tu correo</h1>
        <p className="mt-3 text-sm text-gray-500">
          Te enviamos un link de confirmación a {email}. Ábrelo para activar tu cuenta.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs font-medium text-gray-500">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-medium text-gray-500">
            Correo
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country" className="text-xs font-medium text-gray-500">
            País
          </label>
          <select
            id="country"
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="" disabled>
              Selecciona tu país
            </option>
            {ALL_COUNTRIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="text-xs font-medium text-gray-500">
            Ciudad
          </label>
          <input
            id="city"
            type="text"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Tu ciudad"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="acquisitionSource" className="text-xs font-medium text-gray-500">
            ¿Cómo conociste Workcofy?
          </label>
          <select
            id="acquisitionSource"
            required
            value={acquisitionSource}
            onChange={(event) => setAcquisitionSource(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {ACQUISITION_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>
            Acepto los{' '}
            <Link href="/terminos" target="_blank" className="font-semibold text-black hover:underline">
              Términos y Condiciones
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-black"
          />
          <span>Quiero recibir novedades y promociones de Workcofy</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {status === 'loading' ? 'Creando...' : 'Registrarme'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-black hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**" --exclude "**/.worktrees/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

Requires Task 1's migration to already be run against the live database
(ask the user to confirm before this step). With the dev server running,
visit `/registro`, fill in every field (name, email, a real password,
country, city, acquisition source), check "Acepto los Términos y
Condiciones", optionally check the marketing checkbox, submit. Confirm the
page switches to "Revisa tu correo". Then, in the Supabase SQL Editor, run
`select name, country, city, acquisition_source, marketing_consent,
marketing_consent_at, terms_accepted, terms_version, terms_accepted_at
from profiles order by created_at desc limit 1;` and confirm every field
matches what was submitted — `terms_accepted` is `true`, `terms_version`
is `'v1'`, and `terms_accepted_at`/`marketing_consent_at` are set to a
real timestamp (not null) if that checkbox was checked.

- [ ] **Step 4: Commit**

```bash
git add app/registro/page.tsx
git commit -m "feat: expand registration form with profile fields and consents"
```

---

## Self-Review Notes

- **Spec coverage:** every "New files"/"Changed files" entry from the spec
  has a task — migration (Task 1), `lib/allCountries.ts` (Task 2),
  `/terminos` + `/privacidad` + Footer links (Task 3), `/registro` form
  (Task 4). The spec's "How new fields reach the database" decision
  (metadata → trigger, no new RLS policy) is implemented exactly as
  decided, with no RLS changes anywhere in this plan.
- **No placeholders:** the full country list, the full acquisition-source
  list, and the complete legal-page/registration-page code are written out
  in full in each task — nothing deferred to "add the rest here."
- **Type consistency:** the metadata keys the trigger reads in Task 1
  (`name`, `country`, `city`, `acquisition_source`, `marketing_consent`,
  `terms_accepted`, `terms_version`) match exactly the keys Task 4's
  `signUp()` call sends in `options.data` — same names, same casing.
  `ALL_COUNTRIES`'s shape (`{ value: string; label: string }[]`) matches
  how Task 4 consumes it (`.map((option) => ...)` reading `.value`/
  `.label`).
