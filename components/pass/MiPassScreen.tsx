'use client'

import { useState } from 'react'
import type { PassHolder } from '@/lib/pass'
import { WorkcofyPass } from '@/components/pass/WorkcofyPass'
import { PassExpanded } from '@/components/pass/PassExpanded'

interface MiPassScreenProps {
  holder: PassHolder
}

export function MiPassScreen({ holder }: MiPassScreenProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--app-header-height,4rem))] max-w-5xl flex-col items-center px-4 pb-12 pt-8 md:px-8 md:pt-12">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Tu Workcofy Pass</p>
      <div className="mt-5 flex w-full flex-col items-center">
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

      {expanded && <PassExpanded holder={holder} onClose={() => setExpanded(false)} />}
    </div>
  )
}
