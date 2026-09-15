import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const required = ['businessName', 'contactName', 'email', 'country', 'city', 'address', 'spaceType']
  if (required.some((key) => typeof body[key] !== 'string' || !body[key].trim())) {
    return NextResponse.json({ error: 'Completa los campos obligatorios.' }, { status: 400 })
  }
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('partner_applications').insert({
    business_name: body.businessName.trim(), contact_name: body.contactName.trim(), email: body.email.trim(),
    phone: typeof body.phone === 'string' ? body.phone.trim() || null : null, country: body.country.trim(),
    city: body.city.trim(), address: body.address.trim(), space_type: body.spaceType.trim(),
    message: typeof body.message === 'string' ? body.message.trim() || null : null,
  })
  if (error) return NextResponse.json({ error: 'No pudimos guardar la postulación.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
