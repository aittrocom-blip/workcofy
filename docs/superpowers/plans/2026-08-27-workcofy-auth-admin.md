# Workcofy Auth + Admin Verification Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real email/password accounts (via Supabase Auth) and a minimal admin panel that lets the site owner mark spaces Workcofy Verified.

**Architecture:** Supabase Auth owns signup/login/email-verification/session state entirely — we only wire up its client SDK. Three Supabase client variants now exist side by side: the existing anon server client (`lib/supabase/server.ts`, unchanged, used for public reads), the existing service-role admin client (`lib/supabase/admin.ts`, unchanged, used for privileged writes), and two new ones — a browser client (for the login/signup forms, which need immediate client-side feedback) and a middleware client (refreshes the session cookie on every request via `@supabase/ssr`). A `profiles` table (one row per `auth.users` row, auto-created by a DB trigger) carries the single `is_admin` flag. `middleware.ts` redirects unauthenticated or non-admin visitors away from `/admin/*`; the admin Server Action re-checks `is_admin` itself before writing, so the redirect is a UX convenience, not the actual security boundary.

**Tech Stack:** Next.js 14 App Router, `@supabase/supabase-js` (already installed, ^2.45.0), `@supabase/ssr` (new), TypeScript, Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-27-workcofy-auth-admin-design.md`

## Global Constraints

- Reuse `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` — no new env vars.
- No `insert`/`update` RLS policy on `profiles` for the `authenticated` role — nothing in the client writes to it in this phase.
- The admin Server Action must re-check `profiles.is_admin` server-side itself — never trust the middleware redirect alone.
- No new automated test framework or fake tests for routes/middleware/Server Actions — this codebase's existing `vitest` suite covers pure `lib/` logic only, and this feature is forms/routes/middleware with no extractable pure logic. Each task instead ends with an explicit manual verification against the running dev server.
- The existing 83-test `vitest` suite and `npx tsc --noEmit` must stay clean after every task.
- Match existing code style: no comments explaining *what* code does, only non-obvious *why*; no unrequested refactors of untouched files.

---

## Task 1: Install `@supabase/ssr` and add the `profiles` migration

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `supabase/migrations/0006_profiles.sql`

**Interfaces:**
- Produces: a `profiles` table (`id uuid primary key`, `email text`, `is_admin boolean default false`, `created_at timestamptz`) that every later task's admin-check queries against.

- [ ] **Step 1: Install the package**

Run: `npm install @supabase/ssr`

Expected: `package.json` and `package-lock.json` gain `@supabase/ssr`. No version pin needed — take whatever `npm` resolves as latest.

- [ ] **Step 2: Write the migration file**

Create `supabase/migrations/0006_profiles.sql`:

```sql
-- One row per auth.users row, auto-created on signup. is_admin is set
-- manually in the Supabase SQL editor for now (single hardcoded admin,
-- see docs/superpowers/specs/2026-08-27-workcofy-auth-admin-design.md) —
-- no client-side write path exists for this table in this phase.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read their own profile" on profiles;
create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output (clean).
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 4: Tell the user to run the migration**

This SQL cannot be applied by the agent (no direct Postgres/DDL access all
session — same limitation noted for every prior migration). State clearly
to the user: paste the contents of `supabase/migrations/0006_profiles.sql`
into the Supabase SQL Editor and run it before Task 6 onward can be
manually verified end-to-end.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json supabase/migrations/0006_profiles.sql
git commit -m "feat: add profiles table migration and @supabase/ssr dependency"
```

---

## Task 2: Browser and middleware Supabase clients

**Files:**
- Create: `lib/supabase/browserClient.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts` (project root)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` (existing env vars).
- Produces: `createBrowserSupabaseClient()` (used by Tasks 3, 4, 6 in client components) and the request-level session refresh + `/admin` gate (used by every task from here on, transparently).

- [ ] **Step 1: Create the browser client**

Create `lib/supabase/browserClient.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return createBrowserClient(url, anonKey)
}
```

- [ ] **Step 2: Create the middleware session-refresh helper**

Create `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the session cookie on every request (the standard @supabase/ssr
// pattern) and returns both the response to continue with and the resolved
// user, so callers (middleware.ts) can make routing decisions without a
// second round trip.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user, supabase }
}
```

- [ ] **Step 3: Create the middleware entry point**

Create `middleware.ts` at the project root:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request)

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.png$).*)'],
}
```

- [ ] **Step 4: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 5: Manual verification**

Start the dev server (`npm run dev`), then:
- Visit `http://localhost:3000/admin/espacios` while logged out — expect a
  redirect to `/login` (the page doesn't exist until Task 4, a 404 there is
  fine for now — what matters is the URL changed to `/login`, proving the
  redirect fired).
- Visit any normal page (`/`, `/near-me`) — expect it to load exactly as
  before, unaffected by the middleware.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/browserClient.ts lib/supabase/middleware.ts middleware.ts
git commit -m "feat: add Supabase browser client and session/admin-gate middleware"
```

---

## Task 3: Signup page (`/registro`)

**Files:**
- Create: `app/registro/page.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` from Task 2.

- [ ] **Step 1: Write the signup page**

Create `app/registro/page.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export default function RegistroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setError(null)

    const supabase = createBrowserSupabaseClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (signUpError) {
      setError(signUpError.message)
      setStatus('idle')
      return
    }
    setStatus('sent')
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
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
        />
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
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

With the dev server running, visit `http://localhost:3000/registro`, submit
a real email you control + a password ≥6 characters. Expect the page to
switch to the "Revisa tu correo" state. Check that inbox for a Supabase
confirmation email (subject line from Supabase's default template).

- [ ] **Step 4: Commit**

```bash
git add app/registro/page.tsx
git commit -m "feat: add signup page"
```

---

## Task 4: Login page (`/login`)

**Files:**
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` from Task 2.

- [ ] **Step 1: Write the login page**

Create `app/login/page.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Ingresa</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-semibold text-black hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

Before this step, confirm the email from Task 3 and complete signup once
`/auth/callback` exists (Task 5) — or, if that's not ready yet, skip ahead
and return to this verification after Task 5. Then visit
`http://localhost:3000/login`, sign in with those credentials, and confirm
it redirects to `/`.

- [ ] **Step 4: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page"
```

---

## Task 5: Email confirmation callback (`/auth/callback`)

**Files:**
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Consumes: the `code` query param Supabase appends to the `emailRedirectTo` URL from Task 3.

- [ ] **Step 1: Write the route handler**

Create `app/auth/callback/route.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      throw new Error(
        'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      )
    }
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

Click the confirmation link from the email sent in Task 3's verification.
Expect it to redirect to `http://localhost:3000/`, and the account to now
be confirmed (verify by signing in via `/login` from Task 4 — it should
succeed instead of erroring with an unconfirmed-email message).

- [ ] **Step 4: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add email confirmation callback route"
```

---

## Task 6: Header shows real session state

**Files:**
- Create: `components/layout/HeaderAuthLinks.tsx`
- Modify: `components/layout/Header.tsx:55-74`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` from Task 2.
- Produces: `<HeaderAuthLinks />` — a self-contained client component with no props, rendering either "Ingresa"/"Regístrate" links or the signed-in user's email + "Cerrar sesión", used only by `Header.tsx`.

- [ ] **Step 1: Write the auth-aware header links component**

Create `components/layout/HeaderAuthLinks.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

export function HeaderAuthLinks() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoaded(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Avoid a flash of the wrong state before the client resolves the session.
  if (!loaded) return <div className="hidden h-9 w-32 sm:block" />

  if (user) {
    return (
      <div className="hidden items-center gap-3 sm:flex">
        <span className="text-sm text-gray-600">{user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-semibold text-gray-500 hover:text-black"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="hidden px-2 text-sm font-semibold text-gray-500 hover:text-black sm:inline-flex">
        Ingresa
      </Link>
      <Link
        href="/registro"
        className="hidden items-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-black hover:text-black sm:inline-flex"
      >
        Regístrate
      </Link>
    </>
  )
}
```

- [ ] **Step 2: Wire it into the Header**

In `components/layout/Header.tsx`, replace lines 55-74 (the `<div className="flex items-center gap-2">...</div>` block containing the static "Explora" link plus the two placeholder spans) with:

```tsx
        <div className="flex items-center gap-2">
          <Link
            href="/near-me"
            className="rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            Explora
          </Link>
          <HeaderAuthLinks />
        </div>
```

Add the import near the top of `components/layout/Header.tsx`, alongside the existing `NAV_LINKS` import:

```tsx
import { HeaderAuthLinks } from '@/components/layout/HeaderAuthLinks'
```

- [ ] **Step 3: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 4: Manual verification**

Logged out, load any page — expect "Ingresa" and "Regístrate" in the
header. Log in via `/login`. Expect the header to now show your email and
"Cerrar sesión" instead, without a full page reload being required (the
`onAuthStateChange` listener updates it). Click "Cerrar sesión" — expect
it to flip back to "Ingresa"/"Regístrate".

- [ ] **Step 5: Commit**

```bash
git add components/layout/HeaderAuthLinks.tsx components/layout/Header.tsx
git commit -m "feat: show real session state in the header"
```

---

## Task 7: Admin spaces list (`/admin/espacios`)

**Files:**
- Create: `app/admin/espacios/page.tsx`

**Interfaces:**
- Consumes: `listSpaces()` from `lib/data/spaces.ts` (existing, returns `Promise<SpaceRecord[]>`), `districtLabel()` from `lib/districts.ts` (existing).

- [ ] **Step 1: Write the admin list page**

Create `app/admin/espacios/page.tsx`:

```tsx
import Link from 'next/link'
import { listSpaces } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

export default async function AdminEspaciosPage() {
  const spaces = await listSpaces()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Espacios</h1>
      <p className="mt-1 text-sm text-gray-500">{spaces.length} espacios activos</p>

      <ul className="mt-6 flex flex-col gap-2">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              href={`/admin/espacios/${space.slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm hover:border-black"
            >
              <span>
                {space.name}
                <span className="ml-2 text-gray-400">{districtLabel(space.district)}</span>
              </span>
              <span
                className={
                  space.verified
                    ? 'rounded-full bg-workcofy-green/20 px-2.5 py-1 text-xs font-semibold'
                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500'
                }
              >
                {space.verified ? 'Verificado' : 'Sin verificar'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 3: Manual verification**

This requires an admin account: after completing Task 1's Step 4 (running
the migration) and signing up/confirming a real account (Tasks 3 and 5),
run this in the Supabase SQL Editor, substituting your real email:

```sql
update profiles set is_admin = true where email = 'you@example.com';
```

Then log in as that account and visit `http://localhost:3000/admin/espacios`.
Expect the full space list with verified/unverified badges. Log in as a
different (non-admin) account, or log out entirely, and confirm visiting
the same URL redirects away (per Task 2's middleware).

- [ ] **Step 4: Commit**

```bash
git add app/admin/espacios/page.tsx
git commit -m "feat: add admin spaces list page"
```

---

## Task 8: Admin space verification form + Server Action

**Files:**
- Create: `app/admin/espacios/[slug]/actions.ts`
- Create: `app/admin/espacios/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getSpaceBySlug()` from `lib/data/spaces.ts` (existing, `Promise<SpaceRecord | null>`), `AMENITY_LABELS` from `lib/amenities/types.ts` (existing, `Record<string, string>`), `createAdminSupabaseClient()` from `lib/supabase/admin.ts` (existing), `createServerSupabaseClient()` from `lib/supabase/server.ts` (existing, used here only to read the current session's user for the admin re-check — note this client doesn't read cookies today; see Step 1 for the cookie-aware variant this task actually needs).
- Produces: `updateVerification(spaceId: string, verified: boolean, verifiedAmenities: string[]): Promise<void>` — the Server Action, used only by this task's own form.

- [ ] **Step 1: Write the Server Action**

`lib/supabase/server.ts`'s existing client has no cookie access and can't
resolve "who is the current user" — that's fine for its existing anon-read
use, but this action needs the real session. Write the action using its
own cookie-aware server client (matching the pattern from Task 5's route
handler) purely to resolve `auth.getUser()`, then switch to the existing
`createAdminSupabaseClient()` for the actual privileged write.

Create `app/admin/espacios/[slug]/actions.ts`:

```ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Server Actions can't set cookies on an already-sent response;
        // the middleware already refreshes the session on navigation.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) throw new Error('No autorizado')
}

export async function updateVerification(
  spaceId: string,
  slug: string,
  verified: boolean,
  verifiedAmenities: string[]
) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('spaces')
    .update({
      verified,
      verified_amenities: verifiedAmenities,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
}
```

- [ ] **Step 2: Write the verification form page**

Create `app/admin/espacios/[slug]/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { useEffect } from 'react'
import { AMENITY_LABELS } from '@/lib/amenities/types'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { updateVerification } from './actions'

interface AdminSpacePageProps {
  params: { slug: string }
}

export default function AdminSpacePage({ params }: AdminSpacePageProps) {
  const [space, setSpace] = useState<SpaceRecord | null | undefined>(undefined)
  const [verified, setVerified] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/espacios/${params.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SpaceRecord | null) => {
        setSpace(data)
        if (data) {
          setVerified(data.verified)
          setSelectedAmenities(data.verified_amenities)
        }
      })
  }, [params.slug])

  if (space === null) notFound()
  if (space === undefined) {
    return <div className="mx-auto max-w-xl px-4 py-10 text-sm text-gray-500">Cargando...</div>
  }

  function toggleAmenity(key: string) {
    setSelectedAmenities((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await updateVerification(space!.id, space!.slug, verified, selectedAmenities)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm">
        Workcofy Verified
        <input
          type="checkbox"
          checked={verified}
          onChange={(event) => setVerified(event.target.checked)}
          className="h-4 w-4 accent-black"
        />
      </label>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Amenities confirmadas
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {Object.entries(AMENITY_LABELS).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
          >
            {label}
            <input
              type="checkbox"
              checked={selectedAmenities.includes(key)}
              onChange={() => toggleAmenity(key)}
              className="h-4 w-4 accent-black"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      {saved && <p className="mt-2 text-sm text-workcofy-green">Guardado.</p>}
    </div>
  )
}
```

This page fetches from an API route rather than being a server component,
because it needs client-side checkbox state — write that route now.

- [ ] **Step 3: Write the space-lookup API route the form fetches from**

Create `app/api/admin/espacios/[slug]/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getSpaceBySlug } from '@/lib/data/spaces'

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(space)
}
```

Note: `middleware.ts`'s matcher (Task 2, Step 3) excludes only
`_next/static`, `_next/image`, `favicon.ico`, and `icons/` — it does not
exclude `/api`, so this route is also covered by the `/admin` gate check
only when its own path starts with `/admin`; `/api/admin/...` does **not**
start with `/admin`, so it is not gated by middleware. That's acceptable
here because `getSpaceBySlug` only returns the same public fields already
visible on `/spaces/[slug]` to any anonymous visitor — no privileged data
is exposed by this route.

- [ ] **Step 4: Verify the project still typechecks and tests pass**

Run: `npx tsc --noEmit` — expect no output.
Run: `npx vitest run --exclude "**/.claude/**"` — expect `83 passed`.

- [ ] **Step 5: Manual verification**

As the admin account from Task 7, open any space from
`/admin/espacios`. Toggle "Workcofy Verified" on, check a couple of
amenities, click "Guardar" — expect "Guardado." to appear. Reload the
page — expect the checkbox and amenity states to have persisted. Then
visit the public `/spaces/<slug>` page for that same space — expect the
Workcofy Verified badge and the "Workcofy comprobó este espacio" list
(from `app/spaces/[slug]/page.tsx`, already built earlier this session) to
now show, reflecting the amenities just checked.

Also confirm the negative case: sign in as a non-admin account (or log
out), attempt to visit `/admin/espacios/<slug>` directly — expect the
middleware redirect from Task 2 to fire before the page loads.

- [ ] **Step 6: Commit**

```bash
git add app/admin/espacios/[slug]/actions.ts app/admin/espacios/[slug]/page.tsx app/api/admin/espacios/[slug]/route.ts
git commit -m "feat: add admin space verification form and server action"
```

---

## Self-Review Notes

- **Spec coverage:** every file listed in the spec's "New files" and
  "Changed files" sections has a task (migration → Task 1; middleware +
  browser client → Task 2; registro/login/callback → Tasks 3-5; Header →
  Task 6; admin list + detail + action → Tasks 7-8). The spec's one
  additional file, `app/admin/espacios/[slug]/page.tsx`, ended up needing
  a companion API route (`app/api/admin/espacios/[slug]/route.ts`) not
  called out in the spec, because the form's checkbox state requires a
  client component, which can't call `getSpaceBySlug` (a server-only
  function reading `next/headers`-free but still a server module) directly
  — this is a routine implementation-level addition, not a scope change,
  and Task 8 documents why.
- **Type consistency:** `updateVerification(spaceId, slug, verified, verifiedAmenities)` in Task 8's action matches the call site in the same task's page component exactly (`updateVerification(space!.id, space!.slug, verified, selectedAmenities)`).
- **No placeholders:** every step has complete, runnable code — no TBDs.
