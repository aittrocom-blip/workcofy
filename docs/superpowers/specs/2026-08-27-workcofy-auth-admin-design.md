# Workcofy — Auth (email/password) + Admin Verification Panel

**Date:** 2026-08-27
**Status:** Approved by user, pending written-spec review

## Goal

Give Workcofy real user accounts for the first time, and give the site owner
a working way to mark spaces Workcofy Verified — the one piece of the trust
layer that has had database columns since `0003_trust_layer.sql` but no way
to actually set them.

## Non-goals (explicitly deferred)

- Google / Facebook OAuth — blocked on the user registering apps in those
  consoles; can be added later as extra sign-in buttons without touching
  this design's core auth plumbing.
- Anything a *regular* logged-in user can do beyond having an account and a
  profile: favoriting spaces, a real Rewards ledger, writing reviews,
  Equipos, Eventos. All of these stay exactly as the existing
  "Próximamente" placeholders until a later phase that specifically scopes
  them.
- Admin editing of space fields beyond verification (name, category, phone,
  etc.) — future admin-panel phase.
- Admin management of other users, roles beyond a single hardcoded admin,
  or any self-service "become an admin" flow.
- Rate limiting / bot mitigation for the new auth endpoints — a real
  concern for any public signup form, but out of scope for this pass; flag
  as a fast follow.

## Data model

New migration `0006_profiles.sql`:

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up, so there's no
-- client-side "create my profile" step to get wrong or skip.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

No `insert`/`update` policy is granted to the `authenticated` role in this
pass — nothing in the client needs to write to `profiles` yet. Promoting the
user's own account to `is_admin = true` is a manual one-time SQL statement
run in the Supabase SQL editor after they've registered, exactly like every
other migration this session.

`spaces.verified` / `verified_at` / `verified_amenities` already exist
(migration `0003`) — no schema change needed there.

## Package addition

`@supabase/ssr` — the current standard package for cookie-based Supabase
auth sessions in the Next.js App Router. The project's existing
`lib/supabase/server.ts` and `lib/supabase/admin.ts` both construct a
plain `@supabase/supabase-js` client per request and don't handle session
cookies at all (they don't need to — they're anon-read and service-role
respectively). Auth needs a third client variant that reads/writes the
session cookie, which is what `@supabase/ssr` provides.

## New files

- `lib/supabase/middleware.ts` — the `@supabase/ssr` cookie-refresh helper,
  called from `middleware.ts`.
- `middleware.ts` (project root) — refreshes the session on every request;
  additionally redirects `/admin/*` requests to `/login` when there's no
  session, and to `/` when there is a session but `profiles.is_admin` is
  false.
- `lib/supabase/browserClient.ts` — a browser-side Supabase client (uses
  the anon key, same as today's server client, but via `@supabase/ssr`'s
  browser factory so it shares cookies with the server). This is the
  **first** client-side use of the anon key in the codebase; RLS already
  restricts it to what's already public (spaces read, own-profile read),
  so this doesn't expose anything that wasn't already effectively public.
- `app/registro/page.tsx` — email + password signup form. On submit, calls
  Supabase Auth's `signUp`. Supabase sends the verification email itself;
  the page just shows a "revisa tu correo" confirmation state.
- `app/login/page.tsx` — email + password sign-in form.
- `app/auth/callback/route.ts` — exchanges the email-confirmation code for
  a session (`exchangeCodeForSession`), then redirects home.
- `app/admin/espacios/page.tsx` — server component, lists all spaces
  (name, district, verified status) with a link into each one.
- `app/admin/espacios/[slug]/page.tsx` — the verification form: a checkbox
  per amenity (reusing `AMENITY_LABELS`) plus a "Verificado" toggle.
- `app/admin/espacios/[slug]/actions.ts` — a Server Action,
  `updateVerification(spaceId, verified, verifiedAmenities)`. Re-checks
  `profiles.is_admin` for the current session server-side (never trusts the
  middleware redirect alone — defense in depth) before writing via the
  existing `createAdminSupabaseClient()`. Sets `verified_at = now()` when
  transitioning to verified.

## Changed files

- `components/layout/Header.tsx` — "Ingresa" / "Regístrate" stop being
  disabled Próximamente placeholders and become real links to `/login` and
  `/registro`. When a session exists, both are replaced by the user's email
  and a "Cerrar sesión" action (a small client component reading the
  session).

## Error handling

- Signup: Supabase's own validation (weak password, duplicate email) is
  surfaced inline on the form; no custom validation layer.
- Admin write: if the Server Action's admin check fails, it throws — the
  form shows a generic "No autorizado" error rather than exposing why.
- Middleware redirect loop is prevented by excluding `/login`, `/registro`,
  and `/auth/callback` from the `/admin` gate.

## Testing

- Unit-testable pieces: none of the new surface is pure-function logic in
  the way the rest of this codebase's `lib/` is — it's forms, a Server
  Action, and middleware, which this project doesn't currently have test
  coverage patterns for (no existing route/middleware tests to follow).
  Verification will be manual: sign up, confirm the email link works,
  confirm `/admin/espacios` redirects correctly for a non-admin and a
  logged-out visitor, confirm the verify toggle persists.
- Existing `vitest` suite (83 tests) should remain unaffected — nothing in
  `lib/` changes.
