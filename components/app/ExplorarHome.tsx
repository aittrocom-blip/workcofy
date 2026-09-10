'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { SpaceRecord, SpaceWithDistance } from '@/lib/data/spaceTypes'
import type { SpaceBenefitWithSpace } from '@/lib/data/benefits'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import type { CourseRecord } from '@/lib/data/courseTypes'
import type { PassHolder } from '@/lib/pass'
import type { Tip } from '@/lib/data/tips'
import { DiscoverGrid } from '@/components/layout/DiscoverGrid'
import { HOME_QUICK_ACTIONS } from '@/lib/discoverMenu'
import { DailyTips } from '@/components/app/DailyTips'
import { OpportunityTile, CourseTile } from '@/components/app/DiscoverTiles'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { getLimaNow } from '@/lib/geo/limaTime'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { SpotCard } from '@/components/app/SpotCard'
import { BenefitCard } from '@/components/app/BenefitCard'
import { WorkcofyPass } from '@/components/pass/WorkcofyPass'
import { PassExpanded } from '@/components/pass/PassExpanded'

interface ExplorarHomeProps {
  holder: PassHolder
  spaces: SpaceRecord[]
  benefits: SpaceBenefitWithSpace[]
  opportunities: OpportunityRecord[]
  courses: CourseRecord[]
  tips: Tip[]
  counts: { opportunities: number; courses: number; certificates: number }
  stats: { coins: number; streak: number; favorites: number; checkins: number }
}

function Section({ title, subtitle, href, badge, children }: { title: string; subtitle?: string; href?: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-0">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-extrabold tracking-tight">
            {title}
            {badge && <span className="rounded-full bg-workcofy-yellow/20 px-2 py-0.5 text-[11px] font-bold tabular-nums text-black">{badge}</span>}
          </h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} aria-label={`Ver todo: ${title}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-semibold text-black underline underline-offset-4 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
            Ver todo
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Strip({ spaces }: { spaces: SpaceWithDistance[] }) {
  return (
    <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
      {spaces.map((space) => (
        <SpotCard key={space.id} space={space} />
      ))}
    </HorizontalScroller>
  )
}

function EmptyShelf({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 flex min-h-24 items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-[#FFFCF5] px-4 py-3 md:mx-0">
      <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-workcofy-yellow/20 text-lg">{icon}</span>
      <p className="text-sm leading-relaxed text-gray-600"><span className="font-semibold text-black">{title}</span> {children}</p>
    </div>
  )
}

function byScore(a: SpaceWithDistance, b: SpaceWithDistance): number {
  return (computeWorkcofyScore(b) ?? 0) - (computeWorkcofyScore(a) ?? 0)
}

function byDistance(a: SpaceWithDistance, b: SpaceWithDistance): number {
  return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
}

// The signed-in home. Location is requested once on mount (same hook the
// map uses); until it's granted "Cerca de ti" falls back to the best-scored
// spaces rather than pretending a fallback centre is the user's position.
export function ExplorarHome({ holder, spaces, benefits, opportunities, courses, tips, counts, stats }: ExplorarHomeProps) {
  const [passOpen, setPassOpen] = useState(false)
  const { coordinate, status, requestLocation } = useUserLocation()

  useEffect(() => {
    if (status === 'idle') requestLocation()
  }, [status, requestLocation])

  const withDistance = useSpacesWithDistance(spaces, coordinate, status)
  const located = status === 'granted'
  const now = getLimaNow()

  const nearby = useMemo(
    () => (located ? [...withDistance].sort(byDistance) : [...withDistance].sort(byScore)).slice(0, 10),
    [withDistance, located]
  )
  const firstName = holder.name.split(' ')[0]

  return (
    <main className="mx-auto max-w-6xl pb-8 pt-6 md:px-8 md:pt-10">
      <header className="px-4 md:px-0">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-4xl">
          Hola, {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-base text-gray-600 md:text-lg">¿Qué quieres hacer hoy?</p>
      </header>

      <section className="mt-6" aria-labelledby="home-primary-actions">
        <p id="home-primary-actions" className="px-4 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 md:px-0">Empieza por aquí</p>
        <nav aria-label="Acciones principales de Workcofy" className="mt-2 grid grid-cols-1 gap-2 px-4 md:grid-cols-3 md:gap-3 md:px-0">
          {[
            { href: '/spots', title: 'Encuentra tu espacio', description: 'Un lugar para trabajar', image: '/banners/encuentra-tu-espacio.png' },
            { href: '/oportunidades', title: 'Trabaja en remoto', description: 'Explora oportunidades', image: '/banners/trabaja-en-remoto.png' },
            { href: '/aprende', title: 'Aprende algo nuevo', description: 'Habilidades para tu día', image: '/banners/aprende-algo-nuevo.png' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group relative isolate flex min-h-[96px] min-w-0 flex-col justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-[38%] transition-all hover:border-workcofy-yellow hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:min-h-[110px] md:pl-4">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-1 right-1 -z-20 w-[43%] bg-contain bg-right bg-no-repeat transition-transform duration-300 motion-safe:group-hover:scale-105" style={{ backgroundImage: `url(${item.image})` }} />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[52%] -z-10 w-[16%] bg-gradient-to-r from-white to-transparent" />
              <span className="block text-sm font-bold leading-snug tracking-tight md:text-base">{item.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-600">{item.description}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className="mt-5 border-y border-gray-100 px-4 py-1 md:px-0" aria-labelledby="home-quick-actions">
        <p id="home-quick-actions" className="pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Más para ti</p>
        <DiscoverGrid items={HOME_QUICK_ACTIONS} home />
      </section>

      <Section title="Cerca de ti" subtitle={located ? 'Ordenado por distancia' : 'Activa tu ubicación para ordenar por cercanía'} href="/spots">
        {!located && status !== 'requesting' && (
          <div className="mb-3 px-4 md:px-0">
            <button type="button" onClick={requestLocation} className="min-h-11 rounded-full bg-workcofy-yellow/20 px-3.5 py-2 text-xs font-semibold hover:bg-workcofy-yellow/30">
              Usar mi ubicación
            </button>
          </div>
        )}
        <Strip spaces={nearby} />
      </Section>

      <DailyTips tips={tips} />

      <Section title="Trabajos remotos" badge={`${counts.opportunities}`} subtitle="Lo más reciente, 100% remoto" href="/oportunidades">
        {opportunities.length === 0 ? (
          <EmptyShelf icon="↗" title="Aún no hay oportunidades nuevas.">Vuelve pronto: aquí aparecerán empleos remotos seleccionados para la comunidad.</EmptyShelf>
        ) : (
          <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
            {opportunities.map((opportunity) => (
              <OpportunityTile key={opportunity.id} opportunity={opportunity} now={now} />
            ))}
          </HorizontalScroller>
        )}
      </Section>

      <Section title="Aprende" badge={`${counts.courses}`} subtitle={`${counts.certificates} con certificado · cursos destacados para trabajar con IA`} href="/aprende">
        {courses.length === 0 ? (
          <EmptyShelf icon="✦" title="Estamos preparando nuevos cursos.">Pronto tendrás más recursos para aprender y trabajar mejor con IA.</EmptyShelf>
        ) : (
          <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
            {courses.map((course) => (
              <CourseTile key={course.id} course={course} />
            ))}
          </HorizontalScroller>
        )}
      </Section>

      <section className="mt-10 px-4 md:px-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Tu Workcofy Pass</p>
        <div className="mt-3 md:grid md:grid-cols-[minmax(0,440px)_1fr] md:items-center md:gap-10">
          <WorkcofyPass holder={holder} variant="summary" onShow={() => setPassOpen(true)} />
          <div className="mt-5 grid grid-cols-4 gap-2 md:mt-0 md:grid-cols-2">
            <Stat label="W Coins" value={stats.coins} icon="/icons/rewards-coin.png" />
            <Stat label="Racha" value={stats.streak} emoji="🔥" />
            <Stat label="Favoritos" value={stats.favorites} emoji="♥" />
            <Stat label="Check-ins" value={stats.checkins} emoji="📍" />
          </div>
        </div>
      </section>

      <Section title="Beneficios" subtitle="Se activan mostrando tu Pass" href="/beneficios">
        {benefits.length === 0 ? (
          <EmptyShelf icon="✦" title="Los beneficios están en camino.">Aparecerán aquí cuando haya ventajas activas para tu Workcofy Pass.</EmptyShelf>
        ) : (
          <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} compact />
            ))}
          </HorizontalScroller>
        )}
      </Section>

      {passOpen && <PassExpanded holder={holder} onClose={() => setPassOpen(false)} />}
    </main>
  )
}

function Stat({ label, value, icon, emoji }: { label: string; value: number; icon?: string; emoji?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3 text-center">
      <p className="flex items-center justify-center gap-1 text-xl font-extrabold tabular-nums">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-4 w-4" />
        ) : (
          <span className="text-sm">{emoji}</span>
        )}
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
    </div>
  )
}
