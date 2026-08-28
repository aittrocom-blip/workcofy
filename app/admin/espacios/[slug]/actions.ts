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
