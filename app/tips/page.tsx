import { listPublishedTips, tipOfTheDay, TIP_CATEGORY_LABELS, type TipCategory } from '@/lib/data/tips'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tips de trabajo remoto | Workcofy',
  description: 'Consejos cortos de productividad, foco, ergonomía, IA y bienestar para trabajar mejor desde cualquier lugar.',
}

const CATEGORY_ORDER: TipCategory[] = ['productividad', 'foco', 'ia', 'comunicacion', 'ergonomia', 'bienestar']

export default async function TipsPage() {
  const tips = await listPublishedTips()
  const today = tipOfTheDay(tips)

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 md:px-8 md:pt-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Tips</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Trabajar mejor, desde donde sea</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">Consejos cortos para tu día remoto. Uno nuevo cada día en Explorar.</p>

      {today && (
        <div className="mt-6 rounded-[24px] bg-black p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-workcofy-yellow">Tip del día</p>
          <h2 className="mt-2 text-lg font-extrabold leading-snug tracking-tight">{today.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{today.body}</p>
        </div>
      )}

      {tips.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">Pronto habrá tips aquí.</p>
      ) : (
        CATEGORY_ORDER.map((category) => {
          const group = tips.filter((tip) => tip.category === category)
          if (group.length === 0) return null
          return (
            <section key={category} className="mt-8">
              <h2 className="text-lg font-extrabold tracking-tight">{TIP_CATEGORY_LABELS[category]}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {group.map((tip) => (
                  <li key={tip.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[15px] font-bold leading-snug tracking-tight">{tip.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{tip.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
