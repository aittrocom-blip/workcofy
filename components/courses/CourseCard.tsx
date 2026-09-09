import type { CourseRecord } from '@/lib/data/courseTypes'
import { COURSE_LANGUAGES, COURSE_LEVELS, COURSE_TOOLS, courseCategoryFromValue, coursePriceDisplay } from '@/lib/courses/constants'
import { optionLabel } from '@/lib/optionLabel'
import { professionLabel } from '@/lib/professions'
import { ShareButton } from '@/components/ui/ShareButton'
import { CourseFavoriteButton } from '@/components/courses/CourseFavoriteButton'
import { ProviderLogo } from '@/components/courses/ProviderLogo'

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000

// Redesign brief §10: provider, "Oficial", title, short description, topic
// line, level · duration · language, price + certificate, "Ver curso →".
export function CourseCard({ course, now = new Date() }: { course: CourseRecord; now?: Date }) {
  const category = courseCategoryFromValue(course.category)
  const topic = optionLabel(COURSE_TOOLS, course.tool) ?? professionLabel(course.area)
  const meta = [
    optionLabel(COURSE_LEVELS, course.level),
    course.duration_text,
    optionLabel(COURSE_LANGUAGES, course.language),
  ].filter((part): part is string => Boolean(part))
  const price = coursePriceDisplay(course.price, course.price_text)
  const isNew = now.getTime() - new Date(course.created_at).getTime() < NEW_WINDOW_MS

  return (
    <article className="group flex h-full min-w-0 max-w-full flex-col break-words rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_36px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <ProviderLogo provider={course.provider} courseUrl={course.url} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{course.provider}</span>
        {isNew && <span className="flex-none rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">Nuevo</span>}
        {course.official && (
          <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">Oficial</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-black">
        <a href={`/ir/curso/${course.id}`} target="_blank" rel="noopener" className="rounded-sm hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">{course.title}</a>
      </h3>
      {course.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{course.summary}</p>}

      <p className="mt-3 text-xs font-medium text-gray-500">
        {category?.label}
        {topic && <span> · {topic}</span>}
        {!topic && <span> · IA</span>}
      </p>
      {meta.length > 0 && <p className="mb-5 mt-1 text-xs leading-relaxed text-gray-500">{meta.join(' · ')}</p>}

      <div className="mt-auto border-t border-gray-100 pt-4">
        <div className="flex flex-col gap-4">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <span
              className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                course.price === 'gratis' ? 'bg-workcofy-green/10 text-green-800' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {price.label}
            </span>
            {course.has_certificate && (
              <span className="flex-none rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                Certificado
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <CourseFavoriteButton
              courseId={course.id}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-gray-200 p-3 transition-colors hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            />
            {/* Keep the tracked redirect for shares and provider visits. */}
            <ShareButton
              title={course.title}
              path={`/ir/curso/${course.id}`}
              kind="curso"
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-gray-200 p-3 text-gray-500 transition-colors hover:border-black hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            />
            <a
              href={`/ir/curso/${course.id}`}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-black px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97]"
            >
              Ver curso <span aria-hidden="true">→</span>
            </a>
          </span>
        </div>
        {price.detail && <p className="mt-3 text-xs leading-relaxed text-gray-500">{price.detail}</p>}
      </div>
    </article>
  )
}
