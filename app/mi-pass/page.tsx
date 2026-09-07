import { requireUser } from '@/lib/supabase/serverAuth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { passHolderFrom } from '@/lib/pass'
import { MiPassScreen } from '@/components/pass/MiPassScreen'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi Pass | Workcofy',
}

export default async function MiPassPage() {
  const { user, supabase } = await requireUser('/mi-pass')
  const publicClient = createServerSupabaseClient()

  const [{ data: profile }, { count: spotsCount }, { count: benefitsCount }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_id, created_at, city').eq('id', user.id).single(),
    publicClient.from('spaces').select('id', { count: 'exact', head: true }).eq('active', true).eq('verified', true),
    publicClient.from('space_benefits').select('id', { count: 'exact', head: true }),
  ])

  return <MiPassScreen holder={passHolderFrom(user, profile)} spotsCount={spotsCount ?? 0} benefitsCount={benefitsCount ?? 0} />
}
