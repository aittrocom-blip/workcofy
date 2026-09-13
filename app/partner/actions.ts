'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/supabase/serverAuth'
import { isSafeExternalUrl } from '@/lib/url/safeExternalUrl'

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
  // Rendered straight into <a href> on the public ficha and /virals — only
  // http(s) links are safe there (a javascript: URL would run in every
  // visitor's session the moment they clicked it).
  const clean = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (!isSafeExternalUrl(trimmed)) throw new Error('El link debe ser una URL http(s) válida.')
    return trimmed
  }
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

const VALIDATION_MESSAGES: Record<string, string> = {
  not_a_partner: 'Esta cuenta no tiene acceso Partner activo.',
  not_found: 'No encontramos ese código para este local.',
  already_used: 'Este código ya fue validado antes.',
  expired: 'Este código venció (vale 1 hora desde el check-in).',
}

// validate_benefit_code (0035_benefit_redemptions.sql) is security definer
// and reads auth.uid() itself to find the caller's own partner_accounts row
// — it must be called with the partner's own session (requireUser's cookie
// client), never the admin client, or auth.uid() would be null inside it.
export async function validateBenefitCode(code: string) {
  const { supabase } = await requireUser('/partner')
  const { data, error } = await supabase.rpc('validate_benefit_code', { p_code: code })
  const result = (data as { success: boolean; message: string; benefit_label: string | null }[] | null)?.[0]
  if (error || !result) throw new Error('No se pudo validar el código. Inténtalo de nuevo.')
  if (!result.success) throw new Error(VALIDATION_MESSAGES[result.message] ?? 'No se pudo validar el código.')
  return { benefitLabel: result.benefit_label ?? 'Beneficio' }
}
