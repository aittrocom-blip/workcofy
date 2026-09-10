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

// Six tips, rotating daily (see tipsOfTheDay — deterministic per Lima day,
// not random per page load: reloading mid-day shouldn't show a different
// set, that reads as a glitch rather than "fresh content"). No "Ver todos"
// here on purpose — the point is a rotating glimpse of a growing pool
// (lib/tips/generateTips.ts keeps adding to it), not a static list to browse.
export function DailyTips({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-3 px-4 md:px-0">
        <h2 className="text-lg font-extrabold tracking-tight">Tips de hoy</h2>
        <p className="text-xs text-gray-500">Nuevos cada día — trabajo remoto, foco, IA y más</p>
      </div>
      <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
        {tips.map((tip) => (
          <TipTile key={tip.id} tip={tip} />
        ))}
      </HorizontalScroller>
    </section>
  )
}
