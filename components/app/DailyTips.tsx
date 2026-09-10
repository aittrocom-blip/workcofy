import Link from 'next/link'
import { TIP_CATEGORY_LABELS, type Tip } from '@/lib/data/tips'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'

function TipTile({ tip }: { tip: Tip }) {
  return (
    <div className="flex w-[240px] flex-none flex-col rounded-[20px] bg-black p-4 text-white">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-workcofy-yellow">{TIP_CATEGORY_LABELS[tip.category]}</span>
      <p className="mt-2 text-sm font-bold leading-snug">{tip.title}</p>
      <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-white/70">{tip.body}</p>
    </div>
  )
}

// Three tips, rotating daily (see tipsOfTheDay) — a strip like the other
// Explorar sections instead of one big block, since there are now several
// per day and the pool keeps growing (lib/tips/generateTips.ts).
export function DailyTips({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between px-4 md:px-0">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Tips de hoy</h2>
          <p className="text-xs text-gray-500">Nuevos cada día — trabajo remoto, foco, IA y más</p>
        </div>
        <Link href="/tips" className="text-xs font-semibold text-black underline underline-offset-2">
          Ver todos
        </Link>
      </div>
      <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
        {tips.map((tip) => (
          <TipTile key={tip.id} tip={tip} />
        ))}
      </HorizontalScroller>
    </section>
  )
}
