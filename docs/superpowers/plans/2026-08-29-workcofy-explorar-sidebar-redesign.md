# Explorar Sidebar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top navbar with a left sidebar for logged-in desktop users on `/near-me`, and
rework the map's own floating controls, pins, and pin-click card to feel like a dedicated map app.

**Architecture:** A new `AppShell` client component swaps `Header`/`Footer` for `Sidebar` based on
route (`/near-me`) and auth state, with the map's `fullScreen` mode (already map-first, already
built) gaining a placeholder avatar system, re-enabled search, a list-view toggle reusing the
existing `SpaceList`, shared imperative zoom controls across both map backends, photo-based pins
with a favorite indicator, and a lightweight floating card replacing the large slide-over panel on
desktop pin-click.

**Tech Stack:** Next.js 14 App Router, Supabase (`@supabase/ssr` + `@supabase/supabase-js`),
TypeScript, Tailwind CSS, `@vis.gl/react-google-maps`, `maplibre-gl`.

**Spec:** `docs/superpowers/specs/2026-08-29-workcofy-explorar-sidebar-redesign-design.md`

## Global Constraints

- **Desktop only.** Every change in this plan is scoped to desktop (`md:` breakpoint and up) on the
  `/near-me` route for logged-in users. Mobile/tablet on `/near-me`, and every other route at any
  screen size, must render exactly as they do today — verify this explicitly in each task's manual
  check, not just "didn't touch that code."
- Currency stays "Rewards" everywhere (icon `/w-coins.png`), never "Coins"/"W Coins"/"Puntos".
- Equipos/Eventos/Comunidad sidebar entries are disabled placeholders (`title="Próximamente"`,
  `cursor-not-allowed`, dimmed) — no new routes, no navigation.
- Rewards sidebar entry links to `/perfil` (reuses the existing Rewards panel there) — no new
  `/rewards` page.
- Verified stays the *only* meaning of a yellow pin border — favorited spaces get a small heart
  badge on the pin instead, never a color change.
- No new automated tests — this codebase's established convention for client-component
  layout/interaction work (`FavoriteButton.tsx`, `ReviewsSection.tsx`, `RewardsBadge.tsx`, etc.
  all ship with zero test files) is manual dev-server verification; `tsc --noEmit` is the
  correctness gate.
- Avatar artwork is real (7 user-supplied characters, `explorador-default` as the designated
  default), sourced only from `AVATAR_OPTIONS` in `lib/avatars.ts` — no other file may hardcode an
  avatar image path.

---

### Task 1: `useAuthUser` hook + `HeaderAuthLinks` refactor

**Files:**
- Create: `lib/hooks/useAuthUser.ts`
- Modify: `components/layout/HeaderAuthLinks.tsx` (full file — see below)

**Interfaces:**
- Produces: `useAuthUser(): { user: User | null; loading: boolean; signOut: () => Promise<void> }`
  — `User` is `@supabase/supabase-js`'s type. Every later task that needs "is someone logged in,
  and how do I sign them out" (Task 2's `AppShell`, Task 3's `Sidebar`/`AvatarMenu`) imports this
  instead of writing its own `getUser`/`onAuthStateChange` copy.

- [ ] **Step 1: Write the hook**

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

- [ ] **Step 2: Refactor `HeaderAuthLinks.tsx` to use it**

Replace the entire file with:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { RewardsBadge } from '@/components/layout/RewardsBadge'

interface HeaderAuthLinksProps {
  variant?: 'desktop' | 'mobile'
}

export function HeaderAuthLinks({ variant = 'desktop' }: HeaderAuthLinksProps) {
  const router = useRouter()
  const { user, loading, signOut } = useAuthUser()
  const isDesktop = variant === 'desktop'

  if (loading) {
    return isDesktop ? <div className="hidden h-9 w-32 sm:block" /> : null
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className={isDesktop ? 'hidden items-center gap-3 sm:flex' : 'flex flex-col gap-1'}>
        <div className={isDesktop ? 'contents' : 'px-2 py-1'}>
          <RewardsBadge />
        </div>
        <Link
          href="/favoritos"
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          }
        >
          Favoritos
        </Link>
        <Link
          href="/perfil"
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          }
        >
          Perfil
        </Link>
        <span className={isDesktop ? 'text-sm text-gray-600' : 'px-2 py-2 text-sm text-gray-600'}>
          {user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className={
            isDesktop
              ? 'text-sm font-semibold text-gray-500 hover:text-black'
              : 'rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-black'
          }
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className={isDesktop ? 'contents' : 'flex flex-col gap-1'}>
      <Link
        href="/login"
        className={
          isDesktop
            ? 'hidden px-2 text-sm font-semibold text-gray-500 hover:text-black sm:inline-flex sm:items-center'
            : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
        }
      >
        Ingresa
      </Link>
      <Link
        href="/registro"
        className={
          isDesktop
            ? 'hidden items-center rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-black hover:text-black sm:inline-flex'
            : 'rounded-lg px-2 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
        }
      >
        Regístrate
      </Link>
    </div>
  )
}
```

(Behavior is byte-for-byte identical to before — only the auth-fetch/subscribe/sign-out
implementation moved into the shared hook.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Visit any page with the Header (e.g. `/`), confirm logged-out state shows
Ingresa/Regístrate, log in, confirm logged-in state shows Favoritos/Perfil/email/Cerrar sesión and
the Rewards badge — i.e. the Header behaves exactly as it did before this refactor.

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useAuthUser.ts components/layout/HeaderAuthLinks.tsx
git commit -m "refactor: extract useAuthUser hook from HeaderAuthLinks"
```

---

### Task 2: `AppShell` + `Sidebar` (nav shell, no avatar yet)

**Files:**
- Create: `components/layout/AppShell.tsx`
- Create: `components/layout/Sidebar.tsx`
- Modify: `components/layout/RewardsBadge.tsx` (add a `size` prop)
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `useAuthUser()` from Task 1; `NAV_LINKS` from `lib/navLinks.ts` (existing:
  `[{href, label, icon}]` for Explorar/Equipos/Eventos/Comunidad/Rewards, each `icon` already a
  real PNG path — `/icons/nav-explorar.png`, `/icons/nav-equipos.png`, `/icons/nav-eventos.png`,
  `/icons/nav-comunidad.png`, `/icons/nav-rewards.png`).
- Produces: `Sidebar` — no props, self-contained (Task 3 will add avatar fetching to this same
  file). `RewardsBadge` gains `size?: 'sm' | 'lg'` (default `'sm'`, i.e. today's header behavior
  unchanged).

- [ ] **Step 1: Add a `size` prop to `RewardsBadge`**

Replace `components/layout/RewardsBadge.tsx` with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface RewardsBadgeProps {
  size?: 'sm' | 'lg'
}

export function RewardsBadge({ size = 'sm' }: RewardsBadgeProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadBalance(uid: string | null) {
      if (!uid) {
        setBalance(null)
        return
      }
      const { data } = await supabase.from('reward_events').select('coins').eq('user_id', uid)
      setBalance((data ?? []).reduce((sum, row) => sum + row.coins, 0))
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      loadBalance(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      loadBalance(uid)
    })

    function handleRewardEarned() {
      supabase.auth.getUser().then(({ data }) => loadBalance(data.user?.id ?? null))
    }
    window.addEventListener('workcofy:reward-earned', handleRewardEarned)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('workcofy:reward-earned', handleRewardEarned)
    }
  }, [])

  if (userId === null || balance === null) return null

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/rewards-coin.png" alt="" className="h-[18px] w-[18px]" />
        <span className="text-lg font-bold text-workcofy-black">{balance}</span>
        <span className="text-xs font-medium text-gray-500">Rewards</span>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/rewards-coin.png" alt="" className="h-3.5 w-3.5" />
      {balance}
    </span>
  )
}
```

(Uses the real coin artwork the user supplied — `public/icons/rewards-coin.png`, already added and
resized to 96×96 in this repo — replacing the placeholder `/w-coins.png` everywhere `RewardsBadge`
renders, both the header and the new sidebar. `CoinsSection.tsx` and `RewardsPanel.tsx`'s own
separate `/w-coins.png` references are untouched — out of scope for this plan.)

(`h-3.5 w-3.5` is 14px; `18px` is the "~30% bigger" icon the spec calls for. All existing call
sites — `HeaderAuthLinks.tsx` — use the default `size="sm"` and are unaffected.)

- [ ] **Step 2: Write `Sidebar`**

```tsx
// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NAV_LINKS } from '@/lib/navLinks'
import { RewardsBadge } from '@/components/layout/RewardsBadge'

// Real artwork the user supplied for the sidebar, distinct from the
// smaller mobile-menu icons NAV_LINKS.icon already points at (Header's
// mobile dropdown keeps using those, unchanged, since it wasn't part of
// this redesign). No dedicated "Equipos" icon was supplied — it falls back
// to the existing shared NAV_LINKS.icon for that one item.
const SIDEBAR_ICONS: Record<string, string> = {
  Explorar: '/icons/sidebar-explorar.png',
  Comunidad: '/icons/sidebar-comunidad.png',
  Eventos: '/icons/sidebar-eventos.png',
  Rewards: '/icons/sidebar-rewards.png',
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-[280px] flex-none flex-col border-r border-gray-100 bg-white">
      <div className="px-5 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <nav className="mt-8 flex flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const iconSrc = SIDEBAR_ICONS[link.label] ?? link.icon

          if (link.label === 'Explorar') {
            return (
              <span
                key={link.href}
                className="flex items-center gap-2.5 rounded-xl bg-workcofy-yellow/15 px-3 py-2.5 text-sm font-semibold text-workcofy-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </span>
            )
          }

          if (link.label === 'Rewards') {
            return (
              <Link
                key={link.href}
                href="/perfil"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </Link>
            )
          }

          return (
            <span
              key={link.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconSrc} alt="" className="h-4 w-4 opacity-40" />
              {link.label}
            </span>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4 border-t border-gray-100 px-5 py-6">
        <RewardsBadge size="lg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatars/explorador-default.png"
          alt=""
          className="h-11 w-11 rounded-full border border-gray-200 object-cover"
        />
      </div>
    </aside>
  )
}
```

(The bottom avatar image is a static placeholder in this task — Task 3 replaces it with the real
click-to-open `AvatarMenu` and wires up the first-login picker.)

- [ ] **Step 3: Write `AppShell`**

The Sidebar layout must only ever apply on desktop widths (Global Constraint) — a client-side
`matchMedia` check gates it alongside the existing pathname/auth checks:

```tsx
// components/layout/AppShell.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/layout/Sidebar'

// Matches Tailwind's `md` breakpoint (768px) — the same threshold every
// other desktop/mobile split in this codebase already uses (e.g.
// FiltersBar's `hidden md:block` / `md:hidden` pairs).
const DESKTOP_QUERY = '(min-width: 768px)'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(mql.matches)
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useAuthUser()
  const isDesktop = useIsDesktop()
  const showSidebarLayout = pathname === '/near-me' && !loading && user !== null && isDesktop

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

(`useIsDesktop` starts `false` on the server and on first client render — the safe default, same
reasoning as `loading`: never flash the Sidebar before we're sure both the auth AND the viewport
conditions hold.)

- [ ] **Step 4: Wire `AppShell` into the root layout**

In `app/layout.tsx`, replace:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'

export const metadata: Metadata = {
  title: 'Workcofy | Encuentra dónde trabajar, reunirte y crear',
  description: 'Descubre cafés, work cafés y espacios de trabajo cerca de ti en Lima.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <FavoritesProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  )
}
```

with:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { FavoritesProvider } from '@/components/providers/FavoritesProvider'

export const metadata: Metadata = {
  title: 'Workcofy | Encuentra dónde trabajar, reunirte y crear',
  description: 'Descubre cafés, work cafés y espacios de trabajo cerca de ti en Lima.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        <FavoritesProvider>
          <AppShell>{children}</AppShell>
        </FavoritesProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. Logged out, visit `/near-me` on a desktop-width browser window — confirm the
Header still shows (unchanged). Log in, visit `/near-me` again — confirm the Header/Footer are
gone and the Sidebar shows instead, with Explorar highlighted, Equipos/Eventos/Comunidad dimmed
with a "Próximamente" tooltip on hover, Rewards linking to `/perfil`, and the Rewards balance
showing at the bottom (assuming Rewards migration from the prior phase is applied). Visit any
other route (e.g. `/`, `/perfil`) while logged in — confirm the normal Header/Footer still render
there, unaffected. Shrink the browser to a mobile width on `/near-me` while logged in — confirm
the Header (with hamburger) still renders, not the Sidebar. Resize the window back and forth
across the 768px boundary while on `/near-me` logged in — confirm the layout switches live
between Sidebar and Header without a reload (the `matchMedia` listener picks this up).

- [ ] **Step 7: Commit**

```bash
git add components/layout/AppShell.tsx components/layout/Sidebar.tsx components/layout/RewardsBadge.tsx app/layout.tsx
git commit -m "feat: add AppShell and Sidebar for logged-in desktop /near-me"
```

---

### Task 3: Avatar system (migration, catalog, picker modal, avatar menu)

**Files:**
- Create: `supabase/migrations/0012_avatar.sql`
- Create: `lib/avatars.ts`
- Create: `components/account/AvatarPickerModal.tsx`
- Create: `components/layout/AvatarMenu.tsx`
- Modify: `components/layout/Sidebar.tsx`

**Already done, ahead of this task — do not redo:** `public/avatars/{explorador-default,chica,chico,
intelectual,robotico,espacial,ai}.png` and `public/icons/{sidebar-explorar,sidebar-comunidad,
sidebar-eventos,sidebar-rewards,rewards-coin}.png` already exist in this repo (copied from
`media/avatares/` and `media/iconos/`, resized to 256×256 / 96×96 respectively). This task only
references these paths in code — it does not create, move, or resize any image file.

**Interfaces:**
- Consumes: `useAuthUser()` from Task 1; `Sidebar` shell from Task 2.
- Produces: `lib/avatars.ts` — `interface AvatarOption { id: string; src: string; label: string }`,
  `AVATAR_OPTIONS: AvatarOption[]` (7 entries, real artwork), `avatarFor(avatarId: string |
  null): AvatarOption` (never returns undefined — falls back to `AVATAR_OPTIONS[0]`, which is
  `explorador-default`, the user-designated default).
  `AvatarPickerModal({ userId: string; onPicked: (avatarId: string) => void })`.
  `AvatarMenu({ avatarId: string | null })`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0012_avatar.sql
-- Adds the avatar-selection column for the Explorar sidebar redesign. See
-- docs/superpowers/specs/2026-08-29-workcofy-explorar-sidebar-redesign-design.md.
--
-- Nullable: null means "hasn't picked one yet" (triggers the first-login
-- picker modal client-side). No FK/enum at the DB level — validity is
-- enforced in the application against the small, fixed lib/avatars.ts set.
alter table profiles add column if not exists avatar_id text;

-- Re-states the full authenticated-update column list (not just adding
-- avatar_id) because `revoke` + `grant` together is how this table's
-- column-level grant is kept as a single source of truth — see
-- 0009_profiles_update_policy.sql, which already shipped the first four
-- columns. This migration doesn't edit that file (it's already applied in
-- production) — it re-issues the same idempotent revoke+grant pair with
-- avatar_id appended.
revoke update on profiles from authenticated;
grant update (name, country, city, marketing_consent, marketing_consent_at, avatar_id) on profiles to authenticated;
```

- [ ] **Step 2: Write the avatar catalog**

```ts
// lib/avatars.ts
export interface AvatarOption {
  id: string
  src: string
  label: string
}

// Real character art the user supplied (media/avatares/*.png in the repo
// root, resized from ~1250px/1-2.8MB sources down to 256×256 and copied
// into public/avatars/ ahead of this plan's execution). explorador-default
// is first on purpose — it's both the picker's first option and, via
// avatarFor's fallback below, the avatar shown before a user has chosen one.
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'explorador-default', src: '/avatars/explorador-default.png', label: 'Explorador' },
  { id: 'chica', src: '/avatars/chica.png', label: 'Chica' },
  { id: 'chico', src: '/avatars/chico.png', label: 'Chico' },
  { id: 'intelectual', src: '/avatars/intelectual.png', label: 'Intelectual' },
  { id: 'robotico', src: '/avatars/robotico.png', label: 'Robótico' },
  { id: 'espacial', src: '/avatars/espacial.png', label: 'Espacial' },
  { id: 'ai', src: '/avatars/ai.png', label: 'AI' },
]

export function avatarFor(avatarId: string | null): AvatarOption {
  return AVATAR_OPTIONS.find((option) => option.id === avatarId) ?? AVATAR_OPTIONS[0]
}
```

- [ ] **Step 3: Write the picker modal**

```tsx
// components/account/AvatarPickerModal.tsx
'use client'

import { AVATAR_OPTIONS } from '@/lib/avatars'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

interface AvatarPickerModalProps {
  userId: string
  onPicked: (avatarId: string) => void
}

export function AvatarPickerModal({ userId, onPicked }: AvatarPickerModalProps) {
  async function pick(avatarId: string) {
    const supabase = createBrowserSupabaseClient()
    await supabase.from('profiles').update({ avatar_id: avatarId }).eq('id', userId)
    onPicked(avatarId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-lg font-bold tracking-tight">Elige tu avatar</h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => pick(option.id)}
              aria-label={option.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={option.src}
                alt={option.label}
                className="h-16 w-16 rounded-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

(No "skip" affordance — the modal always shows for a user with `avatar_id = null` until they pick
one, per the spec's "one-time required choice" framing. No copy promising a future "change it in
your profile" feature since that isn't built.)

- [ ] **Step 4: Write the avatar menu**

```tsx
// components/layout/AvatarMenu.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { avatarFor } from '@/lib/avatars'

interface AvatarMenuProps {
  avatarId: string | null
}

export function AvatarMenu({ avatarId }: AvatarMenuProps) {
  const router = useRouter()
  const { signOut } = useAuthUser()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const avatar = avatarFor(avatarId)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menú de cuenta"
        className="h-11 w-11 overflow-hidden rounded-full border border-gray-200"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar.src} alt="" className="h-full w-full object-cover" />
      </button>

      {open && (
        <div className="absolute bottom-0 left-full z-40 ml-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <Link
            href="/favoritos"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Favoritos
          </Link>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Perfil
          </Link>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Wire avatar fetching + the modal + the menu into `Sidebar`**

In `components/layout/Sidebar.tsx`, add the imports and replace the bottom section. Full updated
file:

```tsx
// components/layout/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAV_LINKS } from '@/lib/navLinks'
import { RewardsBadge } from '@/components/layout/RewardsBadge'
import { AvatarMenu } from '@/components/layout/AvatarMenu'
import { AvatarPickerModal } from '@/components/account/AvatarPickerModal'
import { useAuthUser } from '@/lib/hooks/useAuthUser'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'

// Real artwork the user supplied for the sidebar, distinct from the
// smaller mobile-menu icons NAV_LINKS.icon already points at (Header's
// mobile dropdown keeps using those, unchanged, since it wasn't part of
// this redesign). No dedicated "Equipos" icon was supplied — it falls back
// to the existing shared NAV_LINKS.icon for that one item.
const SIDEBAR_ICONS: Record<string, string> = {
  Explorar: '/icons/sidebar-explorar.png',
  Comunidad: '/icons/sidebar-comunidad.png',
  Eventos: '/icons/sidebar-eventos.png',
  Rewards: '/icons/sidebar-rewards.png',
}

export function Sidebar() {
  const { user } = useAuthUser()
  // undefined = not fetched yet, null = fetched but no avatar chosen
  // (triggers the picker modal), string = a chosen avatar id.
  const [avatarId, setAvatarId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    const supabase = createBrowserSupabaseClient()
    supabase
      .from('profiles')
      .select('avatar_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setAvatarId(data?.avatar_id ?? null))
  }, [user])

  return (
    <aside className="flex h-screen w-[280px] flex-none flex-col border-r border-gray-100 bg-white">
      <div className="px-5 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-wordmark.png"
            alt="Workcofy"
            width={1251}
            height={476}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <nav className="mt-8 flex flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => {
          const iconSrc = SIDEBAR_ICONS[link.label] ?? link.icon

          if (link.label === 'Explorar') {
            return (
              <span
                key={link.href}
                className="flex items-center gap-2.5 rounded-xl bg-workcofy-yellow/15 px-3 py-2.5 text-sm font-semibold text-workcofy-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </span>
            )
          }

          if (link.label === 'Rewards') {
            return (
              <Link
                key={link.href}
                href="/perfil"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt="" className="h-4 w-4" />
                {link.label}
              </Link>
            )
          }

          return (
            <span
              key={link.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconSrc} alt="" className="h-4 w-4 opacity-40" />
              {link.label}
            </span>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4 border-t border-gray-100 px-5 py-6">
        <RewardsBadge size="lg" />
        {avatarId !== undefined && <AvatarMenu avatarId={avatarId} />}
      </div>

      {user && avatarId === null && (
        <AvatarPickerModal userId={user.id} onPicked={(id) => setAvatarId(id)} />
      )}
    </aside>
  )
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Apply the migration and verify manually**

Paste `supabase/migrations/0012_avatar.sql` into the Supabase SQL Editor and run it. Then:
`npm run dev`, log in as a test user whose `profiles.avatar_id` is `null` (or set it to null via
SQL for an existing test user), visit `/near-me` on desktop — confirm the picker modal appears
automatically. Pick one — confirm the modal closes and that avatar now shows at the bottom of the
Sidebar. Click the avatar — confirm the menu opens with Favoritos/Perfil/Cerrar sesión (no email
line), closes on outside-click and on `Escape`. Reload the page — confirm the picker modal does
NOT reappear (the choice persisted) and the same avatar shows.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0012_avatar.sql lib/avatars.ts components/account/AvatarPickerModal.tsx components/layout/AvatarMenu.tsx components/layout/Sidebar.tsx
git commit -m "feat: add placeholder avatar selection system"
```

---

### Task 4: Photo-based map pins with a favorite indicator

**Files:**
- Modify: `lib/map/types.ts`
- Modify: `components/discovery/DiscoveryView.tsx` (markers computation only — full-screen UI
  changes come in Task 6)
- Modify: `components/map/GoogleMapAdapter.tsx`
- Modify: `components/map/MockMapAdapter.tsx`

**Interfaces:**
- Consumes: `useFavorites()` from the existing `FavoritesProvider` (`isFavorited(spaceId: string):
  boolean`, already mounted at the root layout, unaffected by Task 2's `AppShell` change since
  `FavoritesProvider` wraps `AppShell`).
- Produces: `MapMarkerData` gains `photoUrl: string | null` and `favorited: boolean`. Both map
  adapters render these; every other consumer of `MapMarkerData` (none exist besides
  `DiscoveryView` and the two adapters) is unaffected.

- [ ] **Step 1: Extend `MapMarkerData`**

In `lib/map/types.ts`, replace:

```ts
export interface MapMarkerData {
  id: string
  position: { lat: number; lng: number }
  label: string
  verified: boolean
}
```

with:

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

- [ ] **Step 2: Feed the new fields from `DiscoveryView`**

In `components/discovery/DiscoveryView.tsx`, add the import:

```tsx
import { useFavorites } from '@/components/providers/FavoritesProvider'
```

Inside the component, near the top (alongside the existing `const { coordinate, status,
requestLocation } = useUserLocation()` line), add:

```tsx
  const { isFavorited } = useFavorites()
```

Then replace the existing `markers` computation:

```tsx
  const markers = filtered
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
    }))
```

with:

```tsx
  const markers = filtered
    .filter((space) => space.latitude != null && space.longitude != null)
    .map((space) => ({
      id: space.id,
      position: { lat: space.latitude as number, lng: space.longitude as number },
      label: space.name,
      verified: space.verified,
      photoUrl: space.photos?.find((photo) => photo.url)?.url ?? null,
      favorited: isFavorited(space.id),
    }))
```

- [ ] **Step 3: Update `GoogleMapAdapter`'s marker rendering**

In `components/map/GoogleMapAdapter.tsx`, replace the `markers.map(...)` block:

```tsx
        {markers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId
          return (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              onClick={() => onMarkerSelect(marker.id)}
            >
              {/* The official Workcofy isotype doubles as the map pin itself,
                  backed by a colored disc: yellow for Workcofy Verified spaces,
                  white for everything else discovered by the community. */}
              <div
                className={`flex items-center justify-center rounded-full p-1 shadow transition-transform duration-150 ${
                  isSelected ? 'scale-[1.18] shadow-lg' : ''
                } ${marker.verified ? 'bg-workcofy-yellow' : 'bg-white'}`}
              >
                <img src="/logo-solo-alpha.png" alt="Workcofy" className="h-[26px] w-auto" />
              </div>
            </AdvancedMarker>
          )
        })}
```

with:

```tsx
        {markers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId
          return (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              onClick={() => onMarkerSelect(marker.id)}
            >
              <div className="relative">
                {/* A circular photo of the space is the pin itself when one
                    exists. The border color keeps its one existing meaning —
                    yellow for Workcofy Verified, white otherwise — favorited
                    status gets its own heart badge instead of touching color. */}
                <div
                  className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] shadow transition-transform duration-150 ${
                    isSelected ? 'scale-[1.18] shadow-lg' : ''
                  } ${marker.verified ? 'border-workcofy-yellow' : 'border-white'}`}
                >
                  {marker.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={marker.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center ${
                        marker.verified ? 'bg-workcofy-yellow' : 'bg-white'
                      }`}
                    >
                      <img src="/logo-solo-alpha.png" alt="Workcofy" className="h-4 w-auto" />
                    </div>
                  )}
                </div>
                {marker.favorited && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-red-500" fill="currentColor">
                      <path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z" />
                    </svg>
                  </span>
                )}
              </div>
            </AdvancedMarker>
          )
        })}
```

(The heart's SVG `path` is copied verbatim from `components/space/FavoriteButton.tsx`'s
`HeartIcon`, so it reads as the same icon everywhere in the app.)

- [ ] **Step 4: Update `MockMapAdapter`'s marker rendering**

In `components/map/MockMapAdapter.tsx`, replace the entire `createMarkerElement` function:

```ts
function createMarkerElement(isSelected: boolean, verified: boolean, onSelect: () => void): HTMLElement {
  const el = document.createElement('div')
  el.style.cursor = 'pointer'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.borderRadius = '9999px'
  el.style.padding = '4px'
  // Yellow disc for Workcofy Verified spaces, white for everything else
  // discovered by the community — same distinction as GoogleMapAdapter.
  el.style.backgroundColor = verified ? '#F4B942' : '#ffffff'
  el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease'
  el.style.transform = isSelected ? 'scale(1.18)' : 'scale(1)'
  el.style.boxShadow = isSelected
    ? '0 6px 10px rgba(0,0,0,0.35)'
    : '0 2px 4px rgba(0,0,0,0.25)'

  const img = document.createElement('img')
  img.src = MARK_SRC
  img.alt = 'Workcofy'
  img.style.height = `${MARK_HEIGHT - 8}px`
  img.style.width = 'auto'
  img.style.display = 'block'
  el.appendChild(img)

  el.addEventListener('click', onSelect)
  return el
}
```

with:

```ts
function createMarkerElement(
  isSelected: boolean,
  verified: boolean,
  photoUrl: string | null,
  favorited: boolean,
  onSelect: () => void
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.cursor = 'pointer'

  const el = document.createElement('div')
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.width = '36px'
  el.style.height = '36px'
  el.style.borderRadius = '9999px'
  el.style.overflow = 'hidden'
  // Border color keeps its one existing meaning — yellow for Workcofy
  // Verified, white otherwise. Favorited gets its own heart badge below,
  // never a color change.
  el.style.border = `3px solid ${verified ? '#F4B942' : '#ffffff'}`
  el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease'
  el.style.transform = isSelected ? 'scale(1.18)' : 'scale(1)'
  el.style.boxShadow = isSelected
    ? '0 6px 10px rgba(0,0,0,0.35)'
    : '0 2px 4px rgba(0,0,0,0.25)'

  if (photoUrl) {
    const img = document.createElement('img')
    img.src = photoUrl
    img.alt = ''
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'
    el.appendChild(img)
  } else {
    el.style.backgroundColor = verified ? '#F4B942' : '#ffffff'
    const img = document.createElement('img')
    img.src = MARK_SRC
    img.alt = 'Workcofy'
    img.style.height = `${MARK_HEIGHT - 8}px`
    img.style.width = 'auto'
    el.appendChild(img)
  }

  wrapper.appendChild(el)

  if (favorited) {
    const heart = document.createElement('span')
    heart.style.position = 'absolute'
    heart.style.bottom = '-2px'
    heart.style.right = '-2px'
    heart.style.display = 'flex'
    heart.style.alignItems = 'center'
    heart.style.justifyContent = 'center'
    heart.style.width = '16px'
    heart.style.height = '16px'
    heart.style.borderRadius = '9999px'
    heart.style.backgroundColor = '#ffffff'
    heart.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
    // Same heart path as FavoriteButton.tsx's HeartIcon and
    // GoogleMapAdapter's marker, so it reads as the same icon everywhere.
    heart.innerHTML =
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="#ef4444"><path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.5 4c2.1-.3 4 .8 6.5 3.3C14.5 4.8 16.4 3.7 18.5 4c3.5.5 5 4 3.5 7.3-2.5 4.6-10 9.2-10 9.2z"/></svg>'
    wrapper.appendChild(heart)
  }

  wrapper.addEventListener('click', onSelect)
  return wrapper
}
```

Then update the one call site (inside the `useEffect` that rebuilds markers on `[markers,
selectedMarkerId, onMarkerSelect]` change):

```ts
    markers.forEach((markerData) => {
      const isSelected = markerData.id === selectedMarkerId
      const el = createMarkerElement(isSelected, markerData.verified, () => onMarkerSelect(markerData.id))
```

becomes:

```ts
    markers.forEach((markerData) => {
      const isSelected = markerData.id === selectedMarkerId
      const el = createMarkerElement(
        isSelected,
        markerData.verified,
        markerData.photoUrl,
        markerData.favorited,
        () => onMarkerSelect(markerData.id)
      )
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. Visit `/near-me` (works whether or not `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is
set — `MapView` picks the adapter based on that). Confirm pins with a photo show it circularly;
pins without one fall back to the isotype-in-disc look. Confirm a Verified space still shows a
yellow border either way. Favorite a space from anywhere in the app (e.g. its `/spaces/[slug]`
page), return to `/near-me`, confirm that space's pin now shows a small red heart badge; un-favorite
it, confirm the badge disappears. If you can toggle between the two map backends (with/without the
API key env var), verify both render the photo+heart treatment consistently.

- [ ] **Step 7: Commit**

```bash
git add lib/map/types.ts components/discovery/DiscoveryView.tsx components/map/GoogleMapAdapter.tsx components/map/MockMapAdapter.tsx
git commit -m "feat: render photo-based map pins with a favorite indicator"
```

---

### Task 5: Shared imperative zoom controls

**Files:**
- Modify: `lib/map/types.ts`
- Modify: `components/map/GoogleMapAdapter.tsx`
- Modify: `components/map/MockMapAdapter.tsx`
- Modify: `components/map/MapView.tsx`
- Create: `components/map/MapZoomControls.tsx`

**Interfaces:**
- Produces: `MapViewHandle { zoomIn: () => void; zoomOut: () => void }`. `MapView`,
  `GoogleMapAdapter`, and `MockMapAdapter` all become `forwardRef<MapViewHandle, MapViewProps>`
  components — a parent can pass a `ref` and call `ref.current.zoomIn()`/`zoomOut()` regardless of
  which backend is active. `MapZoomControls({ onZoomIn: () => void; onZoomOut: () => void })` — a
  small presentational `+`/`−` stack; Task 6 wires it (and the ref) into `DiscoveryView`.

- [ ] **Step 1: Add the handle type**

In `lib/map/types.ts`, add:

```ts
export interface MapViewHandle {
  zoomIn: () => void
  zoomOut: () => void
}
```

- [ ] **Step 2: Forward a zoom ref from `GoogleMapAdapter`**

In `components/map/GoogleMapAdapter.tsx`, add to the imports:

```tsx
import { forwardRef, useImperativeHandle } from 'react'
import type { MapViewProps, MapViewHandle } from '@/lib/map/types'
```

(replacing the existing `import type { MapViewProps } from '@/lib/map/types'` line). Add a small
helper component right after `CenterOnUserLocation`:

```tsx
// Exposes zoomIn/zoomOut on the ref GoogleMapAdapter forwards, so a parent
// component (DiscoveryView's custom zoom buttons) can drive the camera
// without needing to know this is a Google map underneath. Must live
// inside <GoogleMap> since useMap() needs that context.
function ZoomHandle({ forwardedRef }: { forwardedRef: React.Ref<MapViewHandle> }) {
  const map = useMap()
  useImperativeHandle(
    forwardedRef,
    () => ({
      zoomIn: () => map?.setZoom((map.getZoom() ?? 14) + 1),
      zoomOut: () => map?.setZoom((map.getZoom() ?? 14) - 1),
    }),
    [map]
  )
  return null
}
```

Change the component declaration from:

```tsx
export function GoogleMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
  userLocation,
}: MapViewProps) {
```

to:

```tsx
export const GoogleMapAdapter = forwardRef<MapViewHandle, MapViewProps>(function GoogleMapAdapter(
  { center, zoom, markers, selectedMarkerId, onMarkerSelect, userLocation },
  ref
) {
```

Add `<ZoomHandle forwardedRef={ref} />` as the first child inside `<GoogleMap>` (before the
`{markers.map(...)}` block). Add `zoomControl={false}` to the `<GoogleMap>` props (so Google's own
default zoom buttons don't also show — the custom `MapZoomControls` from Step 5 below is the only
zoom UI):

```tsx
      <GoogleMap
        mapId="workcofy-map"
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        zoomControl={false}
        className="h-full w-full"
      >
```

Close the function with `})` instead of `}` at the end of the file (matching the `forwardRef(...)`
wrapper opened above).

- [ ] **Step 3: Forward a zoom ref from `MockMapAdapter`**

In `components/map/MockMapAdapter.tsx`, add to the imports:

```tsx
import { forwardRef, useImperativeHandle } from 'react'
import type { MapViewProps, MapViewHandle } from '@/lib/map/types'
```

(replacing the existing `import type { MapViewProps } from '@/lib/map/types'` line). Change the
component declaration from:

```tsx
export function MockMapAdapter({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerSelect,
  userLocation,
}: MapViewProps) {
```

to:

```tsx
export const MockMapAdapter = forwardRef<MapViewHandle, MapViewProps>(function MockMapAdapter(
  { center, zoom, markers, selectedMarkerId, onMarkerSelect, userLocation },
  ref
) {
```

Add, alongside the existing `useRef` declarations near the top of the component body:

```tsx
  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
    }),
    []
  )
```

(MapLibre's `Map` instance already has native `zoomIn()`/`zoomOut()` methods — no new map-library
API needed.) Change the final `return <div ... />` line's enclosing function close from `}` to
`})`.

- [ ] **Step 4: Forward the ref through `MapView`**

Replace `components/map/MapView.tsx` with:

```tsx
'use client'

import { forwardRef } from 'react'
import type { MapViewProps, MapViewHandle } from '@/lib/map/types'
import { GoogleMapAdapter } from '@/components/map/GoogleMapAdapter'
import { MockMapAdapter } from '@/components/map/MockMapAdapter'

export function hasGoogleMapsKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  if (hasGoogleMapsKey()) {
    return <GoogleMapAdapter ref={ref} {...props} />
  }

  return (
    <div className="relative h-full w-full">
      <MockMapAdapter ref={ref} {...props} />
      <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
        Modo desarrollo · datos de ejemplo
      </span>
    </div>
  )
})
```

- [ ] **Step 5: Write `MapZoomControls`**

```tsx
// components/map/MapZoomControls.tsx
'use client'

interface MapZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

export function MapZoomControls({ onZoomIn, onZoomOut }: MapZoomControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Acercar"
        className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
      >
        +
      </button>
      <span className="h-px bg-gray-100" />
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Alejar"
        className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-gray-700 hover:bg-gray-50"
      >
        −
      </button>
    </div>
  )
}
```

(This component isn't wired into `DiscoveryView` yet — that's Task 6, alongside the other new
floating controls it's visually grouped with.)

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`MapView`/`GoogleMapAdapter`/`MockMapAdapter` are not yet consumed with a
`ref` anywhere — Task 6 adds that call site — so this task alone produces no visible behavior
change yet; that's expected and confirmed by the type-check passing with the new ref-forwarding
signatures.)

- [ ] **Step 7: Commit**

```bash
git add lib/map/types.ts components/map/GoogleMapAdapter.tsx components/map/MockMapAdapter.tsx components/map/MapView.tsx components/map/MapZoomControls.tsx
git commit -m "feat: expose imperative zoom controls from both map adapters"
```

---

### Task 6: Assemble the redesigned `fullScreen` map UI

**Files:**
- Modify: `components/discovery/DiscoveryView.tsx`

**Interfaces:**
- Consumes: `MapZoomControls`, `MapViewHandle` from Task 5; `SpaceList` (existing, already
  imported in this file), `SpaceCard` (existing, already imported), `FiltersBar`'s existing
  `hideSearch`/`hideLocationFilters`/`floating` props.
- Produces: no new exports — this task is entirely internal wiring inside `DiscoveryView`'s
  `fullScreen` branch. Desktop-only; the `fullScreen` branch's mobile-facing blocks (the bottom
  docked `FiltersBar`, and the mobile slide-over panel added below) are unchanged from today.

- [ ] **Step 1: Add the new imports and state**

At the top of `components/discovery/DiscoveryView.tsx`, change:

```tsx
import { useEffect, useMemo, useState } from 'react'
```

to:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
```

Add, alongside the existing imports:

```tsx
import type { MapViewHandle } from '@/lib/map/types'
import { MapZoomControls } from '@/components/map/MapZoomControls'
```

Inside the component, alongside the existing `const [selectedId, setSelectedId] =
useState<string | null>(null)` line, add:

```tsx
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const mapRef = useRef<MapViewHandle>(null)
```

- [ ] **Step 2: Pass the ref into `MapView`**

Inside the `fullScreen` branch's `<MapView ... />` call, add `ref={mapRef}`:

```tsx
          <MapView
            ref={mapRef}
            center={coordinate}
            zoom={mapZoom}
            markers={markers}
            selectedMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            userLocation={status === 'granted' ? coordinate : null}
          />
```

- [ ] **Step 3: Re-enable the search bar on desktop**

In the `fullScreen` branch's desktop floating `FiltersBar` call (the one inside
`DraggableFloatingBar`, under the `{/* Desktop: draggable floating card, reachable anywhere over
the map. */}` comment), remove the `hideSearch` prop:

```tsx
            <FiltersBar
              filters={filters}
              onChange={updateFilters}
              onRequestLocation={requestNearby}
              resultCount={filtered.length}
              availableDistricts={availableDistricts}
              hideLocationFilters
              hideSearch
              floating
            />
```

becomes:

```tsx
            <FiltersBar
              filters={filters}
              onChange={updateFilters}
              onRequestLocation={requestNearby}
              resultCount={filtered.length}
              availableDistricts={availableDistricts}
              hideLocationFilters
              floating
            />
```

Do **not** touch the mobile `FiltersBar` call further down (under the `{/* Mobile: docked to the
bottom... */}` comment) — it keeps `hideSearch`, unchanged, per this plan's desktop-only scope.

- [ ] **Step 4: Add the right-edge control column (Lista, Mi ubicación, zoom) — desktop only**

Add this block right after the mobile-docked `FiltersBar`'s closing `</div>` and before the
`NearbyPopularPanel` block:

```tsx
        {/* Desktop-only floating controls: list/map toggle, my-location, zoom. */}
        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden flex-col items-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => setViewMode((mode) => (mode === 'map' ? 'list' : 'map'))}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-gray-50"
          >
            {viewMode === 'map' ? 'Lista' : 'Mapa'}
          </button>
          <button
            type="button"
            onClick={requestLocation}
            aria-label="Ir a mi ubicación"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
          <MapZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />
        </div>

        {/* List view — desktop only, replaces the map+pin interaction while active. */}
        {viewMode === 'list' && (
          <div className="absolute inset-y-0 left-0 z-20 hidden w-full max-w-md overflow-y-auto bg-white shadow-2xl md:block">
            <SpaceList
              spaces={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              origin={status === 'granted' ? coordinate : null}
            />
          </div>
        )}
```

- [ ] **Step 5: Replace the slide-over panel with a floating card on desktop; keep it on mobile**

Replace the existing "Selected space's details" block:

```tsx
        {/* Selected space's details — slides in from the right, full height. */}
        <div
          className={`absolute inset-y-0 right-0 z-30 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out ${
            selectedSpace ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedSpace && (
            <SpaceDetailPanel
              space={selectedSpace}
              onClose={() => setSelectedId(null)}
              origin={status === 'granted' ? coordinate : null}
            />
          )}
        </div>
```

with:

```tsx
        {/* Selected space — desktop: lightweight floating card that doesn't
            cover the map, matching the non-fullScreen branch below. Mobile
            keeps the full slide-over panel (unchanged, out of this plan's
            desktop-only scope — limited screen space still needs the
            fuller detail view there). */}
        {selectedSpace && (
          <div className="pointer-events-none absolute inset-0 z-30 hidden items-end justify-end p-4 md:flex">
            <div className="pointer-events-auto w-80">
              <SpaceCard
                space={selectedSpace}
                isSelected
                onSelect={() => {}}
                origin={status === 'granted' ? coordinate : null}
              />
            </div>
          </div>
        )}
        <div
          className={`absolute inset-y-0 right-0 z-30 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            selectedSpace ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedSpace && (
            <SpaceDetailPanel
              space={selectedSpace}
              onClose={() => setSelectedId(null)}
              origin={status === 'granted' ? coordinate : null}
            />
          )}
        </div>
```

`SpaceCard` and `SpaceList` are both already imported at the top of this file (used by the
non-`fullScreen` branch) — no new imports needed for this step. `SpaceDetailPanel` stays imported
and used (mobile still needs it); it is not deleted by this plan.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, log in, visit `/near-me` on desktop. Confirm: the floating filter card now has
a working search input alongside the category chips; a "Lista"/"Mi ubicación"/zoom `+`/`−` column
floats on the right edge; clicking "Lista" slides in the space list from the left (reusing the
same cards as the non-fullScreen list view) and the button now reads "Mapa"; clicking it again
returns to the map; the zoom buttons visibly zoom the map in/out; "Mi ubicación" re-centers on the
user's position (same as the existing "Cerca de mí" chip). Click a pin — confirm a small card
appears bottom-right (not the old full-height slide-over) with the space's info, and the map stays
mostly visible around it. Shrink to mobile width — confirm the search bar is still hidden there
(mobile's `FiltersBar` call is untouched), the new right-edge control column and Lista/list-view
are hidden (`md:` gated), and clicking a pin still opens the full slide-over `SpaceDetailPanel` as
before.

- [ ] **Step 8: Commit**

```bash
git add components/discovery/DiscoveryView.tsx
git commit -m "feat: rework fullScreen map controls and pin-click card for desktop"
```
