'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { parseAmenities, type AmenitiesData } from '@/lib/amenities/types'

export async function updateVerification(spaceId: string, slug: string, verified: boolean) {
  await requireAdmin()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('spaces')
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq('id', spaceId)

  if (error) throw new Error(`No se pudo guardar: ${error.message}`)

  revalidatePath(`/admin/espacios/${slug}`)
  revalidatePath(`/spaces/${slug}`)
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
