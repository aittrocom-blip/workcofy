'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SpaceRecord, SpaceWithDistance } from '@/lib/data/spaceTypes'
import type { SpaceBenefitWithSpace } from '@/lib/data/benefits'
import type { OpportunityRecord } from '@/lib/data/opportunityTypes'
import type { CourseRecord } from '@/lib/data/courseTypes'
import type { PassHolder } from '@/lib/pass'
import { OpportunityTile, CourseTile } from '@/components/app/DiscoverTiles'
import { useUserLocation } from '@/lib/geo/useUserLocation'
import { useSpacesWithDistance } from '@/lib/hooks/useSpacesWithDistance'
import { computeWorkcofyScore } from '@/lib/score/workcofyScore'
import { isOpenNow } from '@/lib/hours/openingHours'
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
  stats: { coins: number; streak: number; favorites: number; checkins: number }
}

function Section({ title, subtitle, href, children }: { title: string; subtitle?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between px-4 md:px-0">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="text-xs font-semibold text-black underline underline-offset-2">
            Ver todo
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Strip({ spaces }: { spaces: SpaceWithDistance[] }) {
  if (spaces.length === 0) return <p className="px-4 text-sm text-gray-400 md:px-0">Nada por aquí todavía.</p>
  return (
    <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
      {spaces.map((space) => (
        <SpotCard key={space.id} space={space} />
      ))}
    </HorizontalScroller>
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
export function ExplorarHome({ holder, spaces, benefits, opportunities, courses, stats }: ExplorarHomeProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
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
  const spots = useMemo(
    () => withDistance.filter((s) => s.verified).sort(located ? byDistance : byScore).slice(0, 10),
    [withDistance, located]
  )
  const recommended = useMemo(
    () => withDistance.filter((s) => !s.verified && (computeWorkcofyScore(s) ?? 0) > 0).sort(byScore).slice(0, 10),
    [withDistance]
  )
  const workFriendly = useMemo(
    () =>
      withDistance
        .filter((s) => (s.category === 'cafe' || s.category === 'work_cafe') && isOpenNow(s.opening_hours, now))
        .sort(located ? byDistance : byScore)
        .slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [withDistance, located]
  )

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/spots?q=${encodeURIComponent(q)}` : '/spots')
  }

  const firstName = holder.name.split(' ')[0]

  return (
    <div className="mx-auto max-w-6xl pb-6 pt-6 md:px-8 md:pt-10">
      <header className="px-4 md:px-0">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight md:text-4xl">
          Hola, {firstName} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-base text-gray-600 md:text-lg">¿Dónde quieres trabajar hoy?</p>

        <form onSubmit={submitSearch} role="search" className="mt-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.05)] focus-within:border-black">
          <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar Spots…"
            enterKeyHint="search"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400"
          />
          <button type="submit" className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white active:scale-95">
            Buscar
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/spots" className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold hover:border-black">
            🗺️ Ver mapa
          </Link>
          <Link href="/spots?verified=1" className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold hover:border-black">
            Solo Workcofy Spots
          </Link>
          {!located && status !== 'requesting' && (
            <button type="button" onClick={requestLocation} className="rounded-full bg-workcofy-yellow/20 px-3.5 py-2 text-xs font-semibold hover:bg-workcofy-yellow/30">
              📍 Usar mi ubicación
            </button>
          )}
        </div>
      </header>

      <Section title="Cerca de ti" subtitle={located ? 'Ordenado por distancia' : 'Activa tu ubicación para ordenar por cercanía'} href="/spots">
        <Strip spaces={nearby} />
      </Section>

      <Section title="Workcofy Spots" subtitle="Establecimientos verificados de la red" href="/spots?verified=1">
        <Strip spaces={spots} />
      </Section>

      <Section title="Trabajos remotos" subtitle="Lo más reciente, 100% remoto" href="/oportunidades">
        {opportunities.length === 0 ? (
          <p className="px-4 text-sm text-gray-400 md:px-0">No hay oportunidades nuevas por ahora.</p>
        ) : (
          <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
            {opportunities.map((opportunity) => (
              <OpportunityTile key={opportunity.id} opportunity={opportunity} now={now} />
            ))}
          </HorizontalScroller>
        )}
      </Section>

      <Section title="Aprende" subtitle="Cursos destacados para trabajar con IA" href="/aprende">
        {courses.length === 0 ? (
          <p className="px-4 text-sm text-gray-400 md:px-0">Pronto habrá cursos destacados aquí.</p>
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

      <Section title="Recomendados para ti" subtitle="Los mejores Workcofy Score" href="/spots?sort=workcofy_score">
        <Strip spaces={recommended} />
      </Section>

      <Section title="Work-friendly ahora" subtitle="Cafés abiertos en este momento" href="/spots?category=cafe,work_cafe">
        <Strip spaces={workFriendly} />
      </Section>

      <Section title="Beneficios" subtitle="Se activan mostrando tu Pass" href="/beneficios">
        {benefits.length === 0 ? (
          <p className="px-4 text-sm text-gray-400 md:px-0">Pronto verás aquí los beneficios de los Workcofy Spots.</p>
        ) : (
          <HorizontalScroller className="gap-3 px-4 pb-1 md:px-0">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} compact />
            ))}
          </HorizontalScroller>
        )}
      </Section>

      {passOpen && <PassExpanded holder={holder} onClose={() => setPassOpen(false)} />}
    </div>
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
