import Image from 'next/image'

const EVENT_TYPES = [
  { icon: '/icons/event-mic.png', label: 'Workshops' },
  { icon: '/icons/event-handshake.png', label: 'Networking' },
  { icon: '/icons/event-chatbubble.png', label: 'Charlas' },
  { icon: '/icons/event-laptop.png', label: 'Tecnología & IA' },
  { icon: '/icons/amenity-cafe.png', label: 'Meetups' },
  { icon: '/icons/event-presentation.png', label: 'Emprendimiento' },
]

export function EventosSection() {
  return (
    <section id="eventos" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="flex flex-col items-center gap-10 md:flex-row">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">03 — Eventos</span>
            <span className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              Próximamente
            </span>
          </div>
          <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
            Hay lugares donde se trabaja. Y lugares donde pasan cosas.
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">Descubre eventos cerca de ti.</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {EVENT_TYPES.map((type) => (
              <span
                key={type.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-600"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={type.icon} alt="" className="h-4 w-4" />
                {type.label}
              </span>
            ))}
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Y eventualmente: organiza tu propio evento en un espacio Workcofy.
          </p>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-3xl">
          <Image
            src="/section-eventos.png"
            alt="Un evento en un espacio Workcofy"
            width={1536}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
