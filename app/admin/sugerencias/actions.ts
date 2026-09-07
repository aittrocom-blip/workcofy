'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/requireAdmin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createSpace } from '@/lib/data/spaces'

async function loadPendingSuggestion(suggestionId: string) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('space_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single()
  if (error || !data) throw new Error('No se encontró la sugerencia.')
  if (data.status !== 'pending') throw new Error('Esta sugerencia ya fue revisada.')
  return data
}

export async function approveSuggestion(suggestionId: string) {
  await requireAdmin()

  const suggestion = await loadPendingSuggestion(suggestionId)
  const space = await createSpace({
    name: suggestion.name,
    category: suggestion.category,
    district: suggestion.district,
    country: suggestion.country,
    address: suggestion.address,
  })

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('space_suggestions')
    .update({ status: 'approved', created_space_id: space.id, reviewed_at: new Date().toISOString() })
    .eq('id', suggestionId)
  if (error) throw new Error(`No se pudo actualizar la sugerencia: ${error.message}`)

  revalidatePath('/admin/sugerencias')
  revalidatePath('/admin/espacios')
  redirect(`/admin/espacios/${space.slug}`)
}

export async function rejectSuggestion(suggestionId: string) {
  await requireAdmin()
  await loadPendingSuggestion(suggestionId)

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('space_suggestions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', suggestionId)
  if (error) throw new Error(`No se pudo descartar la sugerencia: ${error.message}`)

  revalidatePath('/admin/sugerencias')
}
