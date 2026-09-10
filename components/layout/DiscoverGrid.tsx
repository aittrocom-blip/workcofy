import Link from 'next/link'
import type { DiscoverMenuItem } from '@/lib/discoverMenu'

function DiscoverTile({ item, onNavigate }: { item: DiscoverMenuItem; onNavigate?: () => void }) {
  const { Icon } = item
  const dimmed = item.comingSoon ? 'opacity-60' : ''

  const circle = (
    <span className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-workcofy-yellow/15 ${dimmed}`}>
      <Icon className="h-6 w-6 text-black" />
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
      <Link href={item.href} onClick={onNavigate} className="flex flex-col items-center transition-transform active:scale-95">
        {circle}
        {label}
      </Link>
    )
  }

  return (
    <div aria-disabled="true" className={`flex flex-col items-center ${item.comingSoon ? 'cursor-not-allowed' : ''}`}>
      {circle}
      {label}
    </div>
  )
}

// Nine "micro-apps," 3×3, not a vertical list and not rectangular cards —
// each tile is just an icon-in-circle + label, meant to read like a
// launcher grid rather than a settings menu. Config-driven (DISCOVER_MENU_ITEMS)
// so enabling a microsection later never touches this component.
export function DiscoverGrid({ items, onNavigate }: { items: DiscoverMenuItem[]; onNavigate?: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-y-5 gap-x-1 px-1 pb-2 pt-3">
      {items.map((item) => (
        <DiscoverTile key={item.label} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  )
}
