import { avatarFor } from '@/lib/avatars'

// Workcofy Pass identity helpers. Everything here derives from data that
// already exists (auth user id, profiles.created_at) — no separate pass
// table yet. If a real pass registry lands later, passIdFor() is the one
// place to swap the derivation.

// Stable, human-readable member id: "WKF-" + the first six hex characters of
// the auth uuid, uppercased. Readable on a card, unique enough for a lookup
// that always resolves against the full uuid behind it.
export function passIdFor(userId: string): string {
  return `WKF-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

// What the QR encodes. A URL, so any phone camera opens it; the /pass/verify
// route it points at is the pending server-side validation endpoint — until
// it exists the QR still carries the member reference a validator will need.
export function passQrPayload(userId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://workcofy.com'
  return `${base}/pass/verify?member=${encodeURIComponent(userId)}&id=${passIdFor(userId)}`
}

export function formatMemberSince(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric' }).format(new Date(iso)).replace('.', '').toUpperCase()
}

export interface PassHolder {
  userId: string
  name: string
  avatarSrc: string
  memberSince: string | null
  /** Email-confirmed account — the only "verification" that exists today. */
  verified: boolean
  city?: string | null
}

export interface PassProfileRow {
  name: string | null
  avatar_id: string | null
  created_at: string | null
  city?: string | null
}

// Builds the card's data from the auth user + their profiles row — the
// same two sources /perfil already reads, nothing invented.
export function passHolderFrom(
  user: { id: string; email?: string; email_confirmed_at?: string | null },
  profile: PassProfileRow | null
): PassHolder {
  return {
    userId: user.id,
    name: profile?.name?.trim() || user.email?.split('@')[0] || 'Miembro Workcofy',
    avatarSrc: avatarFor(profile?.avatar_id ?? null).src,
    memberSince: profile?.created_at ?? null,
    verified: Boolean(user.email_confirmed_at),
    city: profile?.city ?? null,
  }
}
