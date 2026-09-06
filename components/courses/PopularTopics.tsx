import Link from 'next/link'
import { POPULAR_TOPICS } from '@/lib/courses/discovery'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'

// Redesign brief §8: chips that are real filters over the catalog.
export function PopularTopics() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 md:px-8">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">Explora temas populares</h2>
      <div className="mt-3">
        <HorizontalScroller className="gap-2 md:flex-wrap">
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic.label}
              href={topic.href}
              className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-black hover:bg-black hover:text-white"
            >
              {topic.label}
            </Link>
          ))}
        </HorizontalScroller>
      </div>
    </section>
  )
}
