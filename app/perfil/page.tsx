import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ProfileForm } from '@/components/account/ProfileForm'
import { listMissions, listMissionProgress } from '@/lib/data/missions'
import { listRewardEvents, rewardsBalanceFrom } from '@/lib/data/rewards'
import { RewardsPanel } from '@/components/account/RewardsPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi perfil | Workcofy',
}

export default async function PerfilPage() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Nothing here needs to write cookies — middleware.ts owns session refresh on navigation.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/perfil')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, country, city, marketing_consent, avatar_id, created_at')
    .eq('id', user.id)
    .single()

  const events = await listRewardEvents(supabase, user.id)
  const balance = rewardsBalanceFrom(events)

  const missions = await listMissions()
  const progress = await listMissionProgress(supabase, user.id)
  const completedMissionKeys = new Set(progress.map((entry) => entry.missionKey))
  const [{ count: favoritesCount }, { count: reviewsCount }] = await Promise.all([
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.name ?? ''}
        initialCountry={profile?.country ?? ''}
        initialCity={profile?.city ?? ''}
        initialMarketingConsent={profile?.marketing_consent ?? false}
        initialAvatarId={profile?.avatar_id ?? null}
        joinedAt={profile?.created_at ?? null}
      />
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-2xl font-bold">{balance}</p><p className="mt-1 text-xs font-semibold text-gray-500">W Coins</p></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-2xl font-bold">{favoritesCount ?? 0}</p><p className="mt-1 text-xs font-semibold text-gray-500">Favoritos</p></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-2xl font-bold">{reviewsCount ?? 0}</p><p className="mt-1 text-xs font-semibold text-gray-500">Reseñas</p></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-2xl font-bold">{completedMissionKeys.size}</p><p className="mt-1 text-xs font-semibold text-gray-500">Misiones logradas</p></div>
      </section>
      <div className="mt-10 max-w-2xl">
        <RewardsPanel balance={balance} events={events} missions={missions} completedMissionKeys={completedMissionKeys} />
      </div>
    </div>
  )
}
