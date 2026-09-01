import Image from 'next/image'

const COMMUNITY_ACTIONS = [
  { emoji: '⭐', label: 'Valora tu experiencia' },
  { emoji: '💬', label: 'Comparte una reseña' },
  { emoji: '📍', label: 'Recomienda un lugar' },
  { emoji: '🔎', label: 'Descubre lugares que otros recomiendan' },
  { emoji: '❤️', label: 'Guarda tus favoritos' },
  { emoji: '💡', label: 'Comparte tips sobre espacios' },
  { emoji: '🏆', label: 'Ayuda a destacar los mejores lugares' },
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
            Workcofy combina información de los espacios con la experiencia de las personas que
            los utilizan.
          </p>
          <p className="mt-3 max-w-xl text-gray-500">
            Puedes explorar opiniones, compartir experiencias, recomendar lugares y descubrir
            nuevos espacios a través de la comunidad Workcofy.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {COMMUNITY_ACTIONS.map((action) => (
              <span
                key={action.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700"
              >
                <span aria-hidden="true">{action.emoji}</span>
                {action.label}
              </span>
            ))}
          </div>

          <p className="mt-6 text-sm font-semibold">Tu experiencia ayuda a otros a trabajar mejor.</p>
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
