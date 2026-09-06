import Link from 'next/link'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { CHIP_ACTIVE, CHIP_INACTIVE } from './FilterChips'

interface CategoryTabsProps {
  items: { href: string; label: string }[]
  activeHref: string
}

export function CategoryTabs({ items, activeHref }: CategoryTabsProps) {
  return (
    <HorizontalScroller className="gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={item.href === activeHref ? CHIP_ACTIVE : CHIP_INACTIVE}>
          {item.label}
        </Link>
      ))}
    </HorizontalScroller>
  )
}
