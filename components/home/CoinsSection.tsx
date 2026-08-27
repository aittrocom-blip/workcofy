import type { CoinRule, CoinRedemption } from '@/lib/data/coins'

interface CoinsSectionProps {
  rules: CoinRule[]
  redemptions: CoinRedemption[]
}

export function CoinsSection({ rules, redemptions }: CoinsSectionProps) {
  if (rules.length === 0 && redemptions.length === 0) return null

  return (
    <section id="coins" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 md:px-8">
      <h2 className="text-2xl font-bold tracking-tight">🪙 Workcofy Coins</h2>
      <p className="mt-1 max-w-xl text-gray-500">
        Ganás Coins por ayudar a construir la información de Workcofy.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {rules.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-500">Cómo funciona</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>{rule.label}</span>
                  <span className="font-semibold">+{rule.coins} Coins</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {redemptions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-500">Usa tus Coins</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>
                    {redemption.icon} {redemption.label}
                  </span>
                  <span className="font-semibold">{redemption.coins_required} Coins</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
