'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/supabase/serverAuth'

async function ownPartner() {
  const { user } = await requireUser('/partner')
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('partner_accounts').select('id, space_id, active').eq('user_id', user.id).eq('active', true).single()
  if (error || !data) throw new Error('Esta cuenta no tiene acceso Partner activo.')
  return { admin, account: data }
}

export async function updatePartnerSocials(spaceId: string, instagramUrl: string, tiktokUrl: string) {
  const { admin, account } = await ownPartner()
  if (account.space_id !== spaceId) throw new Error('No autorizado')
  const clean = (value: string) => value.trim() || null
  const { error } = await admin.from('spaces').update({ instagram_url: clean(instagramUrl), tiktok_url: clean(tiktokUrl) }).eq('id', spaceId)
  if (error) throw new Error(`No se pudieron guardar las redes: ${error.message}`)
  revalidatePath('/partner')
}

export async function createPartnerPromotion(spaceId: string, title: string, description: string) {
  const { admin, account } = await ownPartner()
  if (account.space_id !== spaceId) throw new Error('No autorizado')
  if (!title.trim()) throw new Error('Escribe un título para la promoción.')
  const { error } = await admin.from('partner_promotions').insert({ space_id: spaceId, title: title.trim(), description: description.trim() })
  if (error) throw new Error(`No se pudo publicar: ${error.message}`)
  revalidatePath('/partner')
}

export async function completePartnerPasswordChange() {
  const { admin, account } = await ownPartner()
  const { error } = await admin.from('partner_accounts').update({ force_password_change: false, last_login_at: new Date().toISOString() }).eq('id', account.id)
  if (error) throw new Error(`No se pudo completar el cambio: ${error.message}`)
}
