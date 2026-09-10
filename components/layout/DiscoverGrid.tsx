import Link from 'next/link'
import type { DiscoverMenuItem } from '@/lib/discoverMenu'

function DiscoverTile({ item, onNavigate, home = false }: { item: DiscoverMenuItem; onNavigate?: () => void; home?: boolean }) {
  const { Icon } = item
  const dimmed = item.comingSoon && !home ? 'opacity-60' : ''

  const circle = (
    <span className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-workcofy-yellow/15 ${dimmed}`}>
      <span aria-hidden="true"><Icon className="h-6 w-6 text-black" /></span>
      {item.comingSoon && (
        <span className="absolute -top-1 right-0 rounded-full bg-workcofy-yellow px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wide text-black shadow-sm">
          Pronto
        </span>
      )}
    </span>
  )
  const label = <span className={`mt-2 max-w-[80px] text-center text-[11px] font-semibold leading-tight text-black ${dimmed}`}>{item.label}</span>

  if (item.enabled && item.href) {
    return (
      <Link href={item.href} onClick={onNavigate} className={`flex min-w-0 flex-col items-center transition-transform active:scale-95 ${home ? 'w-20 flex-none rounded-2xl p-2 hover:bg-workcofy-yellow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black' : ''}`}>
        {circle}
        {label}
      </Link>
    )
  }

  return (
    <div aria-disabled="true" title={home ? `${item.label}: ${item.comingSoon ? 'Pronto' : 'Aún no disponible'}` : undefined} className={`flex min-w-0 flex-col items-center ${home ? 'w-20 flex-none rounded-2xl p-2' : ''} ${item.comingSoon ? 'cursor-not-allowed' : ''}`}>
      {circle}
      {label}
    </div>
  )
}

// Nine "micro-apps," 3×3, not a vertical list and not rectangular cards —
// each tile is just an icon-in-circle + label, meant to read like a
// launcher grid rather than a settings menu. Config-driven (DISCOVER_MENU_ITEMS)
// so enabling a microsection later never touches this component.
export function DiscoverGrid({ items, onNavigate, home = false }: { items: DiscoverMenuItem[]; onNavigate?: () => void; home?: boolean }) {
  return (
    <div className={home ? 'no-scrollbar mt-4 flex w-full min-w-0 gap-1 overflow-x-auto overscroll-x-contain scroll-smooth py-2 md:justify-between md:gap-3' : 'grid grid-cols-3 gap-y-5 gap-x-1 px-1 pb-2 pt-3'}>
      {items.map((item) => (
        <DiscoverTile key={item.label} item={item} onNavigate={onNavigate} home={home} />
      ))}
    </div>
  )
}
