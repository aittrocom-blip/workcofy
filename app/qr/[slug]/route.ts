import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const admin = createAdminSupabaseClient()
  const { data: space } = await admin.from('spaces').select('id, slug').eq('slug', params.slug).eq('active', true).maybeSingle()
  if (!space) return NextResponse.redirect(new URL('/spots', request.url))
  await admin.from('partner_scan_events').insert({ space_id: space.id, event_type: 'qr_scan', metadata: { source: 'space_qr' } })
  return NextResponse.redirect(new URL(`/check-in/${space.slug}`, request.url))
}
