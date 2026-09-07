import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/cron/verifyCronSecret'
import { runGetOnBoardIngestion } from '@/lib/opportunities/sources/runGetOnBoardIngestion'
import { runWeRemotoIngestion } from '@/lib/opportunities/sources/runWeRemotoIngestion'
import { sendDailySignupDigest } from '@/lib/reports/signupDigest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// The one daily cron (see vercel.json) — every daily task shares this single
// entry (Vercel's Hobby plan caps how many cron jobs a project can have)
// rather than one route each. Same ingestion logic scripts/seed-getonboard.ts
// and scripts/seed-weremoto.ts run by hand, so a manual re-run and the
// scheduled one can never drift apart. One task failing doesn't block the
// others — including the signup digest, which is otherwise unrelated to
// opportunity ingestion but piggybacks on this same daily trigger.
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  const results: Record<string, unknown> = {}

  try {
    results.getonboard = await runGetOnBoardIngestion(supabase)
  } catch (error) {
    results.getonboard = { error: error instanceof Error ? error.message : String(error) }
  }

  try {
    results.weremoto = await runWeRemotoIngestion(supabase)
  } catch (error) {
    results.weremoto = { error: error instanceof Error ? error.message : String(error) }
  }

  try {
    results.signupDigest = await sendDailySignupDigest(supabase)
  } catch (error) {
    results.signupDigest = { error: error instanceof Error ? error.message : String(error) }
  }

  return NextResponse.json(results)
}
