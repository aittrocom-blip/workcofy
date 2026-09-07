import Link from 'next/link'
import { TIP_CATEGORY_LABELS, type Tip } from '@/lib/data/tips'

export function TipOfTheDay({ tip }: { tip: Tip }) {
  return (
    <section className="mt-8 px-4 md:px-0">
      <div className="rounded-[24px] bg-black p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-workcofy-yellow">Tip del día</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
            {TIP_CATEGORY_LABELS[tip.category]}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-extrabold leading-snug tracking-tight">{tip.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{tip.body}</p>
        <Link href="/tips" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-workcofy-yellow underline-offset-2 hover:underline">
          Más tips de trabajo remoto <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
