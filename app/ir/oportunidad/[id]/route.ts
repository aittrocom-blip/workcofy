import { NextResponse } from 'next/server'
import { getOpportunityById, incrementOpportunityClicks } from '@/lib/data/opportunities'

export const dynamic = 'force-dynamic'

// Outbound redirect that counts the click (master spec §44). Awaited on
// purpose: on serverless a dangling promise may be dropped after the response.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const opportunity = await getOpportunityById(params.id)
  if (!opportunity) return new NextResponse('Oportunidad no encontrada', { status: 404 })
  await incrementOpportunityClicks(opportunity.id, opportunity.click_count)
  return NextResponse.redirect(opportunity.source_url, 302)
}
