'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { parseAmenities, type AmenitiesData } from '@/lib/amenities/types'

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
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
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
