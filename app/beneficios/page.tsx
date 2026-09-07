import Link from 'next/link'
import { requireUser } from '@/lib/supabase/serverAuth'
import { listAllSpaceBenefits } from '@/lib/data/benefits'
import { listCoinRedemptions } from '@/lib/data/coins'
import { listRewardEvents, rewardsBalanceFrom } from '@/lib/data/rewards'
import { listSpaces } from '@/lib/data/spaces'
import { BenefitCard, RedemptionCard } from '@/components/app/BenefitCard'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Beneficios | Workcofy',
}

// Three real sources, no placeholders: partner perks (space_benefits),
// W Coins redemption tiers (coin_redemptions) against the member's live
// balance, and venues with a Carta especial (spaces.special_menu_enabled).
export default async function BeneficiosPage() {
  const { user, supabase } = await requireUser('/beneficios')

  const [benefits, redemptions, events, spaces] = await Promise.all([
    listAllSpaceBenefits(),
    listCoinRedemptions(),
    listRewardEvents(supabase, user.id),
    listSpaces(),
  ])
  const balance = rewardsBalanceFrom(events)
  const specialMenuSpaces = spaces.filter((space) => space.special_menu_enabled)
  const spotBenefits = benefits.filter((b) => b.space.verified)
  const otherBenefits = benefits.filter((b) => !b.space.verified)

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-6 md:px-8 md:pt-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Beneficios</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Lo que tu Pass desbloquea</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">Descuentos, accesos y experiencias en la red Workcofy. Muestra tu Pass en el local para activarlos.</p>

      <div className="mt-5 flex items-center justify-between rounded-[22px] bg-black px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-workcofy-yellow">Tu saldo</p>
          <p className="mt-0.5 flex items-center gap-2 text-2xl font-extrabold tabular-nums">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/rewards-coin.png" alt="" className="h-6 w-6" />
            {balance} <span className="text-sm font-semibold text-white/70">W Coins</span>
          </p>
        </div>
        <Link href="/mi-pass" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black active:scale-95">
          Mi Pass
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">En Workcofy Spots</h2>
        <p className="text-xs text-gray-500">Beneficios de los establecimientos verificados de la red</p>
        {spotBenefits.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">Aún no hay beneficios cargados en Spots. Pronto.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {spotBenefits.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </div>
        )}
      </section>

      {otherBenefits.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold tracking-tight">En lugares work-friendly</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {otherBenefits.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight">Canjea tus W Coins</h2>
        <p className="text-xs text-gray-500">Ganas coins evaluando espacios, dejando reseñas y haciendo check-in</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {redemptions.map((redemption) => (
            <RedemptionCard key={redemption.id} redemption={redemption} balance={balance} />
          ))}
        </div>
      </section>

      {specialMenuSpaces.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold tracking-tight">Carta especial</h2>
          <p className="text-xs text-gray-500">Espacios con una carta exclusiva para miembros que completan misiones</p>
          <ul className="mt-3 flex flex-col gap-2">
            {specialMenuSpaces.map((space) => (
              <li key={space.id}>
                <Link href={`/spaces/${space.slug}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-sm font-semibold hover:border-black">
                  <span className="truncate">
                    {space.name} <span className="font-normal text-gray-500">· {districtLabel(space.district)}</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
