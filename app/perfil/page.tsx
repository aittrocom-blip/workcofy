import Link from 'next/link'
import { requireUser } from '@/lib/supabase/serverAuth'
import { getSpacesByIds } from '@/lib/data/spaces'
import { listAllSpaceBenefits } from '@/lib/data/benefits'
import { listMissions, listMissionProgress } from '@/lib/data/missions'
import { listRewardEvents, rewardsBalanceFrom } from '@/lib/data/rewards'
import { passHolderFrom } from '@/lib/pass'
import { ProfileHeader } from '@/components/app/ProfileHeader'
import { SpotCard } from '@/components/app/SpotCard'
import { BenefitCard } from '@/components/app/BenefitCard'
import { RewardsPanel } from '@/components/account/RewardsPanel'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { ALL_COUNTRIES } from '@/lib/allCountries'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi perfil | Workcofy',
}

// Identity view: who you are in Workcofy (photo, name, id, membership),
// your spots and perks, your rewards. Editing lives in /configuracion.
export default async function PerfilPage() {
  const { user, supabase } = await requireUser('/perfil')

  // Streak columns are read separately so an unapplied 0021 migration
  // degrades to 0 rather than failing the whole profile row.
  const [{ data: profile }, events, missions, progress, { data: favoriteRows }, { count: reviewsCount }, { count: checkinsCount }, benefits, { data: streakRow }] =
    await Promise.all([
      supabase.from('profiles').select('name, country, city, marketing_consent, avatar_id, created_at').eq('id', user.id).single(),
      listRewardEvents(supabase, user.id),
      listMissions(),
      listMissionProgress(supabase, user.id),
      supabase.from('favorites').select('space_id').eq('user_id', user.id),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('space_checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      listAllSpaceBenefits(),
      supabase.from('profiles').select('streak_count, streak_longest').eq('id', user.id).maybeSingle(),
    ])

  const holder = passHolderFrom(user, profile)
  const balance = rewardsBalanceFrom(events)
  const completedMissionKeys = new Set(progress.map((entry) => entry.missionKey))
  const favoriteIds = (favoriteRows ?? []).map((row) => row.space_id as string)
  const favoriteSpaces = await getSpacesByIds(favoriteIds)
  const favoriteSpots = favoriteSpaces.filter((space) => space.verified)
  const countryLabel = ALL_COUNTRIES.find((option) => option.value === profile?.country)?.label ?? profile?.country

  const stats = [
    { label: 'W Coins', value: balance },
    { label: 'Racha', value: `🔥 ${streakRow?.streak_count ?? 0}` },
    { label: 'Favoritos', value: favoriteIds.length },
    { label: 'Check-ins', value: checkinsCount ?? 0 },
    { label: 'Reseñas', value: reviewsCount ?? 0 },
    { label: 'Misiones', value: completedMissionKeys.size },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-8 md:px-8 md:pt-12">
      <ProfileHeader holder={holder} email={user.email ?? ''} />

      <div className="mt-6 flex flex-wrap gap-2 md:mt-8">
        <Link href="/mi-pass" className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white active:scale-95">
          Ver mi Pass
        </Link>
        <Link href="/configuracion" className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold hover:border-black">
          Configuración
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-3 text-center">
            <p className="text-lg font-extrabold tabular-nums">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Tus Spots favoritos</h2>
            <p className="text-xs text-gray-500">{favoriteSpots.length > 0 ? 'Workcofy Spots que guardaste' : 'Todos tus espacios guardados'}</p>
          </div>
          <Link href="/favoritos" className="text-xs font-semibold underline underline-offset-2">
            Ver todos
          </Link>
        </div>
        {favoriteSpaces.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
            Todavía no guardaste ningún espacio — toca el corazón en cualquier ficha.
          </p>
        ) : (
          <HorizontalScroller className="gap-3 pb-1">
            {(favoriteSpots.length > 0 ? favoriteSpots : favoriteSpaces).map((space) => (
              <SpotCard key={space.id} space={{ ...space, distanceKm: null }} />
            ))}
          </HorizontalScroller>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Beneficios</h2>
          <Link href="/beneficios" className="text-xs font-semibold underline underline-offset-2">
            Ver todos
          </Link>
        </div>
        {benefits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">Pronto verás aquí los beneficios de la red.</p>
        ) : (
          <HorizontalScroller className="gap-3 pb-1">
            {benefits.slice(0, 6).map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} compact />
            ))}
          </HorizontalScroller>
        )}
      </section>

      <section className="mt-8 rounded-[22px] border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Preferencias</h2>
          <Link href="/configuracion" className="text-xs font-semibold underline underline-offset-2">
            Editar
          </Link>
        </div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Ubicación</dt>
            <dd className="mt-0.5 font-medium">{[profile?.city, countryLabel].filter(Boolean).join(', ') || 'Aún no registrada'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Novedades</dt>
            <dd className="mt-0.5 font-medium">{profile?.marketing_consent ? 'Recibes novedades y promociones' : 'No recibes comunicaciones'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Racha más larga</dt>
            <dd className="mt-0.5 font-medium">🔥 {streakRow?.streak_longest ?? 0} días</dd>
          </div>
        </dl>
      </section>

      <div className="max-w-2xl">
        <RewardsPanel balance={balance} events={events} missions={missions} completedMissionKeys={completedMissionKeys} />
      </div>
    </div>
  )
}
