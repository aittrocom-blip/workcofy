import Image from 'next/image'

const BULLETS = [
  'Evalúa espacios y comparte tu experiencia',
  'Confirma amenities y ayuda a mantener la información actualizada',
  'Sube fotos útiles de los lugares',
  'Deja reseñas que ayuden a otros',
  'Acumula W Coins y canjéalos por beneficios',
]

export function CoinsSection() {
  return (
    <section id="rewards" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="flex flex-col items-center gap-10 md:flex-row-reverse">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">04 — Rewards</span>
          <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
            Trabaja. Descubre. Gana.
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">
            Cada vez que participas en Workcofy, ayudas a construir una mejor comunidad de
            espacios para trabajar y acumulas W Coins que puedes usar para obtener beneficios.
          </p>

          <ul className="mt-6 flex flex-col gap-2.5">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-gray-300" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-3xl">
          <Image
            src="/section-rewards.png"
            alt="Ganando W Coins al participar en Workcofy"
            width={1536}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
