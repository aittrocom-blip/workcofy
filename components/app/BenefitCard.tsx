import Link from 'next/link'
import { districtLabel } from '@/lib/districts'
import type { SpaceBenefitWithSpace } from '@/lib/data/benefits'
import type { CoinRedemption } from '@/lib/data/coins'

// A partner perk at a specific venue. "Muestra tu Pass" is the redemption
// mechanic these are being prepared for — today it just deep-links to the
// Pass; the pass-scan validation that would confirm it is the pending
// backend piece.
export function BenefitCard({ benefit, compact = false }: { benefit: SpaceBenefitWithSpace; compact?: boolean }) {
  return (
    <div className={`flex flex-col justify-between rounded-[22px] border border-gray-100 bg-white p-4 ${compact ? 'w-[220px] flex-none' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-workcofy-yellow/20 text-lg">{benefit.icon || '🎁'}</span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{benefit.label}</p>
          <Link href={`/spaces/${benefit.space.slug}`} className="mt-1 block truncate text-xs text-gray-500 hover:text-black">
            {benefit.space.name} · {districtLabel(benefit.space.district)}
          </Link>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {benefit.space.verified ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
            <span className="h-1.5 w-1.5 rounded-full bg-workcofy-yellow" />
            Workcofy Spot
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Work-friendly</span>
        )}
        <Link href="/mi-pass" className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-semibold transition-colors hover:border-black">
          Muestra tu Pass
        </Link>
      </div>
    </div>
  )
}

// A W Coins redemption tier — progress is the member's live ledger balance
// against coins_required.
export function RedemptionCard({ redemption, balance }: { redemption: CoinRedemption; balance: number }) {
  const progress = Math.min(1, balance / Math.max(1, redemption.coins_required))
  const unlocked = balance >= redemption.coins_required
  return (
    <div className="rounded-[22px] border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-gray-50 text-lg">{redemption.icon || '⭐'}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight">{redemption.label}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/rewards-coin.png" alt="" className="h-3.5 w-3.5" />
            {redemption.coins_required} W Coins
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${unlocked ? 'bg-workcofy-green/20 text-black' : 'bg-gray-100 text-gray-500'}`}>
          {unlocked ? 'Disponible' : `Faltan ${redemption.coins_required - balance}`}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-workcofy-yellow transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
