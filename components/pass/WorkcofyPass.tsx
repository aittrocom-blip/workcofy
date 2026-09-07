'use client'

import Image from 'next/image'
import { formatMemberSince, passIdFor, passQrPayload, type PassHolder } from '@/lib/pass'
import { MembershipStatus } from '@/components/pass/MembershipStatus'
import { QRVerification } from '@/components/pass/QRVerification'

interface WorkcofyPassProps {
  holder: PassHolder
  /** summary: compact card for Explorar/Perfil. full: the /mi-pass hero. */
  variant?: 'summary' | 'full'
  onShow?: () => void
}

// The member credential. Deliberately not a bank card: portrait-ish
// proportions, a lanyard-style header strip, the real black wordmark, the
// brand yellow as the only accent, and a faint pin watermark. Every field is
// live data — name/avatar/joined date from profiles, id derived from the
// auth uuid, verification from email confirmation.
export function WorkcofyPass({ holder, variant = 'full', onShow }: WorkcofyPassProps) {
  const passId = passIdFor(holder.userId)
  const qrValue = passQrPayload(holder.userId)
  const compact = variant === 'summary'

  return (
    <article
      aria-label="Workcofy Pass"
      className={`relative w-full overflow-hidden rounded-[28px] border border-black/90 bg-white text-black shadow-[0_18px_44px_rgba(0,0,0,0.12)] ${
        compact ? 'max-w-md' : 'max-w-[400px]'
      }`}
    >
      <div className="flex items-center justify-between bg-black px-5 py-3">
        <Image src="/logo-wordmark.png" alt="Workcofy" width={1251} height={476} className="h-6 w-auto invert" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-workcofy-yellow">Member pass</span>
      </div>

      <Image
        src="/logo-solo-alpha.png"
        alt=""
        width={616}
        height={838}
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-6 h-48 w-auto select-none opacity-[0.045]"
      />

      <div className={`relative ${compact ? 'p-4' : 'px-6 pb-6 pt-6'}`}>
        <div className={`flex ${compact ? 'items-center gap-4' : 'flex-col items-center text-center'}`}>
          <div className={`relative flex-none ${compact ? 'h-16 w-16' : 'h-28 w-28'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={holder.avatarSrc} alt="" className="h-full w-full rounded-full border-[3px] border-workcofy-yellow object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-black">
              <Image src="/logo-solo-alpha.png" alt="" width={616} height={838} className="h-3.5 w-auto invert" />
            </span>
          </div>
          <div className={`min-w-0 ${compact ? 'flex-1' : 'mt-4 w-full'}`}>
            <h3 className={`truncate font-extrabold tracking-tight ${compact ? 'text-lg' : 'text-2xl'}`}>{holder.name}</h3>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Workcofy member</p>
            <div className={`mt-2 ${compact ? '' : 'flex justify-center'}`}>
              <MembershipStatus verified={holder.verified} />
            </div>
          </div>
        </div>

        <dl className={`mt-5 grid gap-x-4 gap-y-3 text-left ${compact ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">ID</dt>
            <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums">{passId}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Member since</dt>
            <dd className="mt-0.5 text-sm font-bold">{formatMemberSince(holder.memberSince)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Status</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
              <span className="h-2 w-2 rounded-full bg-workcofy-green" />
              Active
            </dd>
          </div>
          {!compact && holder.city && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Base</dt>
              <dd className="mt-0.5 truncate text-sm font-bold">{holder.city}</dd>
            </div>
          )}
        </dl>

        {!compact && (
          <div className="mt-6 flex flex-col items-center border-t border-dashed border-gray-200 pt-5">
            <QRVerification value={qrValue} size={132} />
          </div>
        )}

        {compact && onShow && (
          <button
            type="button"
            onClick={onShow}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
          >
            Mostrar mi Pass
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Work anywhere. Work better.</span>
        <span className="h-1.5 w-8 rounded-full bg-workcofy-yellow" />
      </div>
    </article>
  )
}
