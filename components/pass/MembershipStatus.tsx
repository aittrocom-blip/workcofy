interface MembershipStatusProps {
  /** Email-confirmed account. */
  verified: boolean
  size?: 'sm' | 'md'
}

// The two trust chips a Pass carries. "Active member" is true for any
// signed-in account today (no paid tiers exist); "Verified coworker" maps to
// Supabase's email confirmation — the only real verification in the system.
export function MembershipStatus({ verified, size = 'sm' }: MembershipStatusProps) {
  const base = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-black font-bold uppercase tracking-[0.14em] text-workcofy-yellow ${base}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-workcofy-green" />
        Active member
      </span>
      {verified && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-workcofy-green/20 font-bold uppercase tracking-[0.14em] text-workcofy-black ${base}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-check.png" alt="" className="h-3 w-3" />
          Verified coworker
        </span>
      )}
    </div>
  )
}
