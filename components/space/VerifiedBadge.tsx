export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-workcofy-green/20 px-2.5 py-1 text-xs font-semibold text-workcofy-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/nav-check.png" alt="" className="h-3.5 w-3.5" />
      Workcofy Verified
    </span>
  )
}
