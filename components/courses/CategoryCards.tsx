import Link from 'next/link'
import { COURSE_CATEGORIES } from '@/lib/courses/constants'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'

interface CategoryCardsProps {
  /** Path of the page being rendered — the matching card is highlighted. */
  activeHref: string
}

const CARDS = [
  { href: '/aprende', label: 'Todos los cursos', description: 'Todo el catálogo curado por Workcofy.' },
  ...COURSE_CATEGORIES.map((category) => ({
    href: `/aprende/${category.slug}`,
    label: category.label,
    description: category.description,
  })),
]

// Redesign brief §7: the four categories as inviting cards, shown before any
// filter. Scrolls horizontally on mobile, lays out as a row on desktop.
export function CategoryCards({ activeHref }: CategoryCardsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <HorizontalScroller className="gap-3 md:grid md:grid-cols-5 md:overflow-visible">
        {CARDS.map((card) => {
          const active = card.href === activeHref
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`flex w-[220px] flex-none flex-col rounded-3xl border p-5 transition-all md:w-auto ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-gray-100 bg-gray-50 text-black hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <span className="text-base font-bold tracking-tight">{card.label}</span>
              <span className={`mt-2 text-xs leading-relaxed ${active ? 'text-gray-300' : 'text-gray-500'}`}>{card.description}</span>
            </Link>
          )
        })}
      </HorizontalScroller>
    </section>
  )
}
