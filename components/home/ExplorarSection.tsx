import Link from 'next/link'
import Image from 'next/image'
import { CategoryIcon } from '@/components/discovery/CategoryIcon'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

const SCENARIOS = [
  { category: 'cafe', text: 'Un café tranquilo para concentrarte.' },
  { category: 'work_cafe', text: 'Un work café con todo lo que necesitas.' },
  { category: 'meeting_room', text: 'Una sala para una reunión.' },
  { category: 'hotel', text: 'Un lobby para trabajar entre reuniones.' },
  { category: 'coworking', text: 'Un coworking para concentrarte.' },
]

export function ExplorarSection() {
  return (
    <section id="explorar" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 md:px-8">
      <div className="flex flex-col items-center gap-10 md:flex-row">
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">01 — Explorar</span>
          <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight md:text-4xl">
            Encuentra el lugar adecuado para lo que necesitas.
          </h2>
          <p className="mt-3 max-w-xl text-gray-500">No siempre necesitas una oficina.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((scenario) => (
              <div
                key={scenario.category}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5"
              >
                <CategoryIcon name={scenario.category} className="h-5 w-5 flex-none" />
                <span className="text-sm font-medium">{scenario.text}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm font-semibold">Workcofy te ayuda a encontrarlo.</p>
          {LAUNCH_LOCKED ? (
            <span
              title="Próximamente"
              className="mt-4 inline-block cursor-not-allowed rounded-full bg-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-400"
            >
              Explorar espacios
            </span>
          ) : (
            <Link
              href="/near-me"
              className="mt-4 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
            >
              Explorar espacios
            </Link>
          )}
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-3xl">
          <Image
            src="/section-explorar.png"
            alt="Trabajando desde un café con Workcofy"
            width={1536}
            height={1024}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
