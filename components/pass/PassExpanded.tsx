'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { formatMemberSince, passIdFor, passQrPayload, type PassHolder } from '@/lib/pass'
import { MembershipStatus } from '@/components/pass/MembershipStatus'
import { QRVerification } from '@/components/pass/QRVerification'

interface PassExpandedProps {
  holder: PassHolder
  onClose: () => void
}

// "Mostrar mi Pass": the hand-the-phone-over view. Full-screen, white, no
// chrome — name, photo, status, id and a QR big enough to scan from across
// a counter. Escape/backdrop-free: only the explicit close button leaves,
// so a stray tap while showing it doesn't dismiss the credential.
export function PassExpanded({ holder, onClose }: PassExpandedProps) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tu Workcofy Pass"
      className="fixed inset-0 z-[60] flex flex-col bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] animate-fade-in"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Image src="/logo-wordmark.png" alt="Workcofy" width={1251} height={476} className="h-7 w-auto" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-black"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">Workcofy member pass</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={holder.avatarSrc} alt="" className="mt-6 h-32 w-32 rounded-full border-4 border-workcofy-yellow object-cover shadow-md" />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{holder.name}</h1>
        <div className="mt-3">
          <MembershipStatus verified={holder.verified} size="md" />
        </div>
        <p className="mt-5 font-mono text-lg font-bold tabular-nums tracking-wider">{passIdFor(holder.userId)}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Member since {formatMemberSince(holder.memberSince)}</p>

        <div className="mt-8">
          <QRVerification value={passQrPayload(holder.userId)} size={220} caption="Scan to verify" />
        </div>
      </div>

      <p className="px-6 text-center text-xs text-gray-400">Sube el brillo de tu pantalla para que el código se lea mejor.</p>
    </div>
  )
}
