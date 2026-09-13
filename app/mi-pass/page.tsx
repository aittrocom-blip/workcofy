import { requireUser } from '@/lib/supabase/serverAuth'
import { passHolderFrom } from '@/lib/pass'
import { MiPassScreen } from '@/components/pass/MiPassScreen'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi Pass | Workcofy',
}

export default async function MiPassPage() {
  const { user, supabase } = await requireUser('/mi-pass')
  const { data: profile } = await supabase.from('profiles').select('name, avatar_id, created_at, city').eq('id', user.id).single()

  return <MiPassScreen holder={passHolderFrom(user, profile)} />
}
