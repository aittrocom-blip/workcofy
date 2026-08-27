export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-workcofy-yellow/20 px-2.5 py-1 text-xs font-semibold text-workcofy-black">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Workcofy Verified
    </span>
  )
}
