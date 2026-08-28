# Workcofy — Registration Expansion (Phase 1: Basic Info + Consents)

**Date:** 2026-08-28
**Status:** Approved by user, pending written-spec review

## Goal

Turn account creation from a bare email/password form into a source of
real business data from day one: who's signing up, where they're from,
and how they found Workcofy — while keeping the first screen short
enough that it doesn't hurt signup conversion.

This is Phase 1 of a 3-phase plan the user proposed:
1. **This phase** — expand `/registro` with name, country, city,
   acquisition source, and terms/marketing consent.
2. A separate "Personaliza Workcofy" onboarding wizard shown after
   signup (work style, profession, purposes, amenity preferences,
   pricing intent, travel behavior) — not scoped here.
3. Passive behavioral tracking (searches, favorites, check-ins,
   reviews, bookings) — blocked on features that don't exist yet
   (favoriting, reviews, check-ins, bookings, rewards are all still
   "Próximamente" placeholders) — not scoped here.

## Non-goals (explicitly deferred)

- The "Personaliza Workcofy" wizard and any of its questions (work
  style, profession, purposes, preferred amenities, pricing intent,
  travel frequency) — Phase 2, its own spec.
- Any behavioral/analytics tracking — Phase 3, blocked on unbuilt
  features.
- Real legal text for Terms & Conditions / Privacy Policy — the user
  chose a clearly-labeled placeholder page for now; the real text
  arrives later without a code change (see "Legal pages" below).
- A city selector tied to real geographic data — city stays free text,
  since maintaining a city list for 190+ countries isn't practical.
- Any change to the login page, Google/Facebook OAuth (still blocked
  on the user's own OAuth app credentials), or the admin panel.
- Editing the `profiles` schema's `is_admin`/`verified`-style
  RLS/admin patterns — untouched.

## How new fields reach the database

`/registro`'s `signUp()` call already requires email confirmation
before a session exists, so a client-side write to `profiles`
right after signup would fail (no `auth.uid()` yet — see the three
options weighed with the user, recorded here for the record):

- **Chosen:** pass the new fields as `signUp()`'s `options.data`
  (Supabase's user metadata, which Postgres exposes on the new
  `auth.users` row as `raw_user_meta_data`, available at row-creation
  time regardless of confirmation state). The existing
  `handle_new_user()` trigger (added in `0006_profiles.sql`) is
  extended to read them and populate `profiles` in the same insert.
  No new RLS write policy needed — preserves the existing "no client
  write path to `profiles`" posture.
- Rejected: a second client-side `.update()` call after `signUp()` —
  breaks because no session exists until email confirmation.
- Rejected: capture these fields after first login instead (a
  "complete your profile" step) — technically workable but not what
  was asked for; the user wants this captured on the same registration
  screen, not deferred past email confirmation.

## Data model

New migration `supabase/migrations/0007_profile_registration_fields.sql`:

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

`name`/`country`/`city`/`acquisition_source` stay nullable at the
database level (form-level `required` enforces them for this flow) —
a future social-login flow wouldn't pass this metadata at all, and a
`not null` constraint here would break account creation for it.
`terms_accepted` stays `not null default false` since it's a boolean
with a safe default regardless of signup path.

`country` stores the 2-letter lowercase ISO code (matching the
existing `pe`/`cl` convention in `lib/countries.ts`), not the display
label — consistent with how `lib/districts.ts`/`lib/countries.ts`
already store values.

## New files

- `lib/allCountries.ts` — `ALL_COUNTRIES: { value: string; label: string }[]`,
  the full ~195-country list in Spanish, sorted alphabetically by
  label. Deliberately separate from `lib/countries.ts`'s
  `COUNTRY_OPTIONS` (Perú/Chile only) — that file is scoped to "where
  Workcofy currently operates" for the discovery filters; this one is
  "where a signing-up user might be from," a different concern with a
  different (much longer) value set.
- `app/terminos/page.tsx` — static page, placeholder legal text
  visibly marked as a draft ("Este es un texto provisional..."), a
  "last updated" date, a link back home.
- `app/privacidad/page.tsx` — same pattern, for Privacy Policy.

## Changed files

- `supabase/migrations/0007_profile_registration_fields.sql` — see
  Data model above.
- `app/registro/page.tsx` — adds the new fields to the form:
  - `name` — required text input.
  - `country` — required `<select>` sourced from `ALL_COUNTRIES`.
  - `city` — required text input.
  - `acquisition_source` — required `<select>` with options: Google /
    buscador, Instagram, TikTok, LinkedIn, Recomendación de un amigo,
    Un café / hotel / coworking, Publicidad, Otro (stored as a short
    slug: `google`, `instagram`, `tiktok`, `linkedin`, `referral`,
    `venue`, `ads`, `other`).
  - Terms checkbox — required, unchecked blocks submission via the
    native `required` attribute; label links to `/terminos` (opens in
    a new tab so the draft isn't lost).
  - Marketing checkbox — optional, unchecked by default.
  - `signUp()`'s `options` gains `data: { name, country, city,
    acquisition_source, marketing_consent, terms_accepted, terms_version:
    'v1' }` alongside the existing `emailRedirectTo`.
- `components/layout/Footer.tsx` — adds "Términos" and "Privacidad"
  links (no such links exist today — without them the new pages would
  be orphaned, unreachable from any nav).

## Error handling

Same level as the existing `/registro` form — no new validation layer.
All new fields are native browser-validated (`required` on inputs,
selects, and the terms checkbox), matching how email/password
already work. No server-side validation of "is this a real city" or
similar — out of scope, consistent with the rest of this feature's
minimal-validation approach.

## Testing

Same approach as the rest of this session's auth work: no automated
tests (this is a form + a migration + two static pages, no extractable
pure logic). Manual verification: register a real account with all
fields filled, then check in the Supabase SQL Editor that the new
`profiles` row has `name`/`country`/`city`/`acquisition_source`/
`terms_accepted`/`terms_version` correctly populated and
`terms_accepted_at`/`marketing_consent_at` set appropriately. Confirm
`/terminos` and `/privacidad` render and are linked from the footer.
Existing `vitest` suite (83 tests) should remain unaffected — nothing
in `lib/` that's covered by tests changes (the new `lib/allCountries.ts`
is a static data file with no logic to test).
