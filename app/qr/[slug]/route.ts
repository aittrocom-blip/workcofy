import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const admin = createAdminSupabaseClient()
  const { data: space } = await admin.from('spaces').select('id, slug').eq('slug', params.slug).eq('active', true).maybeSingle()
  if (!space) return NextResponse.redirect(new URL('/spots', request.url))
  await admin.from('partner_scan_events').insert({ space_id: space.id, event_type: 'qr_scan', metadata: { source: 'space_qr' } })
  // Workcofy Store is the demo venue — scanning its real QR should show the
  // benefits flow without requiring anyone to physically stand there.
  const demoSuffix = space.slug === 'workcofy-store' ? '?demo=1' : ''
  return NextResponse.redirect(new URL(`/check-in/${space.slug}${demoSuffix}`, request.url))
}
