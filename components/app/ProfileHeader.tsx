import Link from 'next/link'
import { formatMemberSince, passIdFor, type PassHolder } from '@/lib/pass'
import { MembershipStatus } from '@/components/pass/MembershipStatus'

interface ProfileHeaderProps {
  holder: PassHolder
  email: string
}

export function ProfileHeader({ holder, email }: ProfileHeaderProps) {
  return (
    <section className="flex flex-col items-center text-center md:flex-row md:items-center md:gap-6 md:text-left">
      <div className="relative h-24 w-24 flex-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={holder.avatarSrc} alt="" className="h-full w-full rounded-full border-4 border-workcofy-yellow object-cover shadow-md" />
        <Link
          href="/configuracion"
          aria-label="Editar perfil"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-sm hover:bg-gray-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.9 3.4 3.7 3.7M4 20l4.2-1 11.5-11.5a2.6 2.6 0 0 0-3.7-3.7L4.5 15.3 4 20Z" />
          </svg>
        </Link>
      </div>
      <div className="mt-4 min-w-0 md:mt-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{holder.name}</h1>
        <p className="truncate text-sm text-gray-500">{email}</p>
        <p className="mt-1 font-mono text-xs font-bold tracking-wider text-gray-700">
          {passIdFor(holder.userId)} · desde {formatMemberSince(holder.memberSince)}
        </p>
        <div className="mt-3 flex justify-center md:justify-start">
          <MembershipStatus verified={holder.verified} />
        </div>
      </div>
    </section>
  )
}
