import Link from 'next/link'
import { OPPORTUNITY_CATEGORY_SLUGS } from '@/lib/opportunities/constants'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'

interface QuickCategoriesProps {
  /** Path of the page being rendered — the matching pill is highlighted. */
  activeHref: string
}

const ITEMS = [{ href: '/oportunidades', label: 'Todas' }, ...OPPORTUNITY_CATEGORY_SLUGS.map((c) => ({ href: `/oportunidades/${c.slug}`, label: c.label, ai: c.slug === 'ia' }))]

// Redesign brief §6: quick categories below the hero — "Todas" plus the five
// pillars. IA gets a visibly distinct treatment (brief §13) since it's a
// strategic axis, not just another value in the list.
export function QuickCategories({ activeHref }: QuickCategoriesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
      <HorizontalScroller className="gap-2">
        {ITEMS.map((item) => {
          const active = item.href === activeHref
          const isAi = 'ai' in item && item.ai
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? isAi
                    ? 'border-black bg-black text-workcofy-yellow'
                    : 'border-black bg-black text-white'
                  : isAi
                    ? 'border-workcofy-yellow bg-workcofy-yellow/10 text-black hover:bg-workcofy-yellow/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-black'
              }`}
            >
              {isAi ? `${item.label} ✦` : item.label}
            </Link>
          )
        })}
      </HorizontalScroller>
    </section>
  )
}
