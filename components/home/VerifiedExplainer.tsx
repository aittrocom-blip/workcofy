import Image from 'next/image'

const COMMUNITY_ACTIONS = [
  { emoji: '⭐', label: 'Calificar espacios' },
  { emoji: '📸', label: 'Compartir experiencias' },
  { emoji: '💬', label: 'Dejar reseñas' },
  { emoji: '👍', label: 'Recomendar lugares' },
  { emoji: '📍', label: 'Descubrir nuevos espacios' },
]

export function VerifiedExplainer() {
  return (
    <section id="comunidad" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">04 — Comunidad</span>
          <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
            Los mejores lugares también los descubre la comunidad.
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">
            Workcofy no solamente te dice dónde está un espacio — te dice cómo es realmente
            trabajar ahí.
          </p>

          <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-workcofy-green/20 px-3 py-1 text-xs font-semibold text-workcofy-black">
              ✓ Workcofy Verified
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-tight">
              Workcofy comprobó que estos espacios cumplen nuestros estándares mínimos para
              trabajar.
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              No todos los lugares del mapa están verificados — seguimos mostrando los espacios
              descubiertos y evaluados por la comunidad. El sello Verified indica, además, que
              Workcofy visitó el lugar y confirmó puntos concretos como wifi, enchufes o zona
              tranquila.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Próximamente: aportes de la comunidad</h3>
              <span className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                Próximamente
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              La información mejora a medida que la comunidad crece. Muy pronto vas a poder:
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {COMMUNITY_ACTIONS.map((action) => (
                <span
                  key={action.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-500"
                >
                  <span aria-hidden="true">{action.emoji}</span>
                  {action.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-3xl">
          <Image
            src="/section-comunidad.png"
            alt="La comunidad Workcofy compartiendo reseñas y recomendaciones"
            width={1536}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
