'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { parseAmenities, type AmenitiesData } from '@/lib/amenities/types'

function makePartnerUsername(slug: string) {
  return `partner-${slug.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 35)}`
}

// Math.random() isn't a CSPRNG — not safe for anything that guards access,
// including a one-time password. crypto.randomBytes is.
function makeTemporaryPassword() {
  return `Wc-${randomBytes(6).toString('base64url')}-${randomBytes(4).toString('base64url')}`
}

export async function createPartnerAccess(spaceId: string, slug: string) {
  await requireAdmin()
  const admin = createAdminSupabaseClient()
  const username = makePartnerUsername(slug)
  const email = `${username}@partners.workcofy.local`
  const { data: existing } = await admin.from('partner_accounts').select('id, user_id, active, username').eq('space_id', spaceId).maybeSingle()
  if (existing?.active) throw new Error('Este espacio ya tiene un acceso Partner activo.')
  if (existing && !existing.active) {
    const password = makeTemporaryPassword()
    const { error: restoreError } = await admin.auth.admin.updateUserById(existing.user_id, { password, ban_duration: 'none', user_metadata: { role: 'partner', space_id: spaceId, force_password_change: true } })
    if (restoreError) throw new Error(`No se pudo reactivar el usuario: ${restoreError.message}`)
    const { error: reactivateError } = await admin.from('partner_accounts').update({ active: true, force_password_change: true }).eq('id', existing.id)
    if (reactivateError) throw new Error(`No se pudo reactivar el acceso: ${reactivateError.message}`)
    await admin.from('spaces').update({ partner_status: 'partner' }).eq('id', spaceId)
    return { username: existing.username, password }
  }
  const password = makeTemporaryPassword()
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: 'partner', space_id: spaceId } })
  if (error || !data.user) throw new Error(error?.message ?? 'No se pudo crear el usuario Partner')
  const { error: insertError } = await admin.from('partner_accounts').insert({ user_id: data.user.id, space_id: spaceId, username })
  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error(`No se pudo guardar el acceso: ${insertError.message}`)
  }
  await admin.from('spaces').update({ partner_status: 'partner' }).eq('id', spaceId)
  return { username, password }
}

export async function disablePartnerAccess(spaceId: string, slug: string) {
  await requireAdmin()
  const admin = createAdminSupabaseClient()
  const { data: account, error: findError } = await admin
    .from('partner_accounts')
    .select('id, user_id')
    .eq('space_id', spaceId)
    .maybeSingle()
  if (findError) throw new Error(`No se pudo consultar el acceso: ${findError.message}`)
  if (!account) throw new Error('Este espacio no tiene un acceso Partner creado.')
  const { error } = await admin.from('partner_accounts').update({ active: false }).eq('id', account.id)
  if (error) throw new Error(`No se pudo deshabilitar: ${error.message}`)
  await admin.auth.admin.updateUserById(account.user_id, { ban_duration: '876000h' })
  await admin.from('spaces').update({ partner_status: 'none' }).eq('id', spaceId)
  revalidatePath(`/admin/espacios/${slug}`)
}

export async function resetPartnerPassword(spaceId: string, slug: string) {
  await requireAdmin()
  const admin = createAdminSupabaseClient()
  const { data: account } = await admin.from('partner_accounts').select('user_id, active').eq('space_id', spaceId).maybeSingle()
  if (!account) throw new Error('Este espacio no tiene un acceso Partner creado.')
  if (!account.active) throw new Error('Primero debes habilitar el acceso Partner.')
  const password = makeTemporaryPassword()
  const { error } = await admin.auth.admin.updateUserById(account.user_id, { password, user_metadata: { force_password_change: true } })
  if (error) throw new Error(`No se pudo generar la nueva clave: ${error.message}`)
  await admin.from('partner_accounts').update({ force_password_change: true }).eq('space_id', spaceId)
  // Do not revalidate here: the client needs to keep the one-time password
  // visible so the administrator can copy or share it.
  return { password }
}

export async function updateVerification(spaceId: string, slug: string, verified: boolean) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('spaces')
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
      trust_level: verified ? 'workcofy_verified' : 'listed',
      last_verified_at: verified ? new Date().toISOString() : null,
      verification_method: verified ? 'manual' : null,
    })
    .eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
}

export async function updateTrustProfile(
  spaceId: string,
  slug: string,
  trustLevel: 'listed' | 'community_recommended' | 'workcofy_verified' | 'workcofy_point',
  recommendedFor: string[],
  verificationMethod: string | null,
) {
  await requireAdmin()
  const admin = createAdminSupabaseClient()
  const isVerified = trustLevel === 'workcofy_verified' || trustLevel === 'workcofy_point'
  const now = new Date().toISOString()
  const { error } = await admin.from('spaces').update({
    trust_level: trustLevel,
    recommended_for: recommendedFor,
    verification_method: verificationMethod || null,
    verified: isVerified,
    verified_at: isVerified ? now : null,
    last_verified_at: isVerified ? now : null,
  }).eq('id', spaceId)
  if (error) throw new Error(`No se pudo guardar: ${error.message}`)
  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
  revalidatePath('/espacios')
}

// The "Workcofy comprobó este espacio" badge on the public ficha lists
// verified_amenities — rather than maintain that list by hand in a second
// form, it's derived here from whatever the admin just marked "Sí" below,
// so there's exactly one place to confirm an amenity instead of two that
// can drift out of sync.
function deriveVerifiedAmenities(amenities: AmenitiesData): string[] {
  return [
    ...Object.entries(amenities.para_trabajar),
    ...Object.entries(amenities.para_llamadas),
    ...Object.entries(amenities.servicios),
  ]
    .filter(([, value]) => value === true)
    .map(([key]) => key)
}

export async function updateAmenities(spaceId: string, slug: string, amenities: AmenitiesData) {
  await requireAdmin()

  const parsed = parseAmenities(amenities)
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('spaces')
    .update({ amenities: parsed, verified_amenities: deriveVerifiedAmenities(parsed) })
    .eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
}

// "Delete" is a soft delete — active=false just drops the space out of the
// public RLS read filter (every public listing/ficha), reviews/favorites/
// likes pointing at it are untouched, and it's reversible from the same
// button (setSpaceActive(..., true) reactivates).
export async function setSpaceActive(spaceId: string, slug: string, active: boolean) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('spaces').update({ active }).eq('id', spaceId)
  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath('/admin/espacios')
  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
}
