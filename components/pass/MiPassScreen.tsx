'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PassHolder } from '@/lib/pass'
import { WorkcofyPass } from '@/components/pass/WorkcofyPass'
import { PassExpanded } from '@/components/pass/PassExpanded'

interface MiPassScreenProps {
  holder: PassHolder
  spotsCount: number
  benefitsCount: number
}

export function MiPassScreen({ holder, spotsCount, benefitsCount }: MiPassScreenProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 md:px-8 md:pt-10">
      <div className="md:grid md:grid-cols-[minmax(0,400px)_1fr] md:items-start md:gap-12">
        <div className="flex flex-col items-center">
          <p className="mb-4 self-start text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 md:hidden">Tu Workcofy Pass</p>
          <WorkcofyPass holder={holder} variant="full" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-5 flex w-full max-w-[400px] items-center justify-center gap-2 rounded-full bg-black py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
            </svg>
            Mostrar mi Pass
          </button>
        </div>

        <section className="mt-10 md:mt-0">
          <p className="hidden text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 md:block">Tu Workcofy Pass</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Tu identidad en la red Workcofy</h1>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Muéstralo al llegar a un Workcofy Spot para identificarte como miembro y acceder a los beneficios de la comunidad.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            <li className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-workcofy-yellow/20 text-base">📍</span>
              <span>
                <span className="block text-sm font-bold">{spotsCount} Workcofy Spots en la red</span>
                <span className="block text-xs text-gray-500">Establecimientos verificados donde tu Pass te identifica.</span>
                <Link href="/spots?verified=1" className="mt-1 inline-block text-xs font-semibold text-black underline">
                  Ver Spots
                </Link>
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-workcofy-yellow/20 text-base">🎁</span>
              <span>
                <span className="block text-sm font-bold">{benefitsCount} beneficios disponibles</span>
                <span className="block text-xs text-gray-500">Descuentos y accesos que se activan mostrando tu Pass.</span>
                <Link href="/beneficios" className="mt-1 inline-block text-xs font-semibold text-black underline">
                  Ver beneficios
                </Link>
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-workcofy-yellow/20 text-base">🪪</span>
              <span>
                <span className="block text-sm font-bold">Tu foto y nombre salen de tu perfil</span>
                <span className="block text-xs text-gray-500">Cámbialos cuando quieras desde Configuración.</span>
                <Link href="/configuracion" className="mt-1 inline-block text-xs font-semibold text-black underline">
                  Editar perfil
                </Link>
              </span>
            </li>
          </ul>
        </section>
      </div>

      {expanded && <PassExpanded holder={holder} onClose={() => setExpanded(false)} />}
    </div>
  )
}
