import Image from 'next/image'
import type { CoinRule, CoinRedemption } from '@/lib/data/coins'
import type { Mission } from '@/lib/data/missions'

interface CoinsSectionProps {
  rules: CoinRule[]
  redemptions: CoinRedemption[]
  missions: Mission[]
}

// Maps the emoji stored in coin_redemptions.icon to our own icon set, so the
// list reads consistently with the rest of the app instead of raw emoji.
const REDEMPTION_ICON_SRC: Record<string, string> = {
  '☕': '/icons/amenity-cafe.png',
  '💻': '/icons/event-laptop.png',
  '🧑‍💻': '/icons/nav-equipos.png',
}

export function CoinsSection({ rules, redemptions, missions }: CoinsSectionProps) {
  if (rules.length === 0 && redemptions.length === 0 && missions.length === 0) return null

  return (
    <section id="rewards" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">05 — Rewards</span>
      <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
        Trabaja. Descubre. Gana.
      </h2>
      <p className="mt-3 max-w-xl text-gray-500">
        Cada vez que participas en Workcofy puedes obtener beneficios.
      </p>

      <div className="mt-8 flex flex-col items-center gap-10 md:flex-row">
        <div className="flex-1 overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 p-5 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-workcofy-yellow/20 px-3 py-1 text-xs font-semibold text-workcofy-black">
            <Image src="/w-coins.png" alt="" width={16} height={16} className="h-4 w-4" />
            Rewards
          </span>
          <h3 className="mt-4 text-xl font-bold tracking-tight">
            Ganás Rewards por ayudar a construir la información de Workcofy.
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Evaluá espacios, confirmá amenities y subí fotos — cada aporte suma Rewards que
            después podés cambiar por beneficios reales.
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {rules.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Cómo funciona
                </h4>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm"
                    >
                      <span>{rule.label}</span>
                      <span className="font-semibold text-workcofy-black">
                        +{rule.coins} <span className="text-workcofy-yellow">Rewards</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {redemptions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Usa tus Rewards
                </h4>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {redemptions.map((redemption) => (
                    <li
                      key={redemption.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {redemption.icon && REDEMPTION_ICON_SRC[redemption.icon] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={REDEMPTION_ICON_SRC[redemption.icon]}
                            alt=""
                            className="h-4 w-4 flex-none"
                          />
                        ) : (
                          redemption.icon
                        )}
                        {redemption.label}
                      </span>
                      <span className="font-semibold">{redemption.coins_required} Rewards</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {missions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Misiones
                </h4>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {missions.map((mission) => (
                    <li
                      key={mission.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm"
                    >
                      <span>{mission.label}</span>
                      <span className="font-semibold text-workcofy-black">
                        +{mission.coins} <span className="text-workcofy-yellow">Rewards</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-3xl">
          <Image
            src="/section-rewards.png"
            alt="Ganando Rewards al participar en Workcofy"
            width={1536}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
