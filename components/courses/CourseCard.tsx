import type { CourseRecord } from '@/lib/data/courseTypes'
import { COURSE_LANGUAGES, COURSE_LEVELS, courseCategoryFromValue } from '@/lib/courses/constants'
import { optionLabel } from '@/lib/optionLabel'

const CHIP = 'rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700'

export function CourseCard({ course }: { course: CourseRecord }) {
  const category = courseCategoryFromValue(course.category)
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-gray-400">{course.provider}</span>
        {course.official && (
          <span className="flex-none rounded-full bg-workcofy-yellow px-2 py-0.5 text-[11px] font-bold text-black">Oficial</span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold leading-snug tracking-tight">{course.title}</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {category && <span className={CHIP}>{category.label}</span>}
        <span className={CHIP}>{optionLabel(COURSE_LEVELS, course.level)}</span>
        {course.duration_text && <span className={CHIP}>{course.duration_text}</span>}
        <span className={CHIP}>{optionLabel(COURSE_LANGUAGES, course.language)}</span>
      </div>

      {course.summary && <p className="mt-3 line-clamp-3 text-sm text-gray-600">{course.summary}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="flex items-center gap-2 text-xs">
          <span className={course.price === 'gratis' ? 'font-semibold text-workcofy-green' : 'font-semibold text-gray-700'}>
            {course.price === 'gratis' ? 'Gratis' : course.price_text ?? 'Pago'}
          </span>
          {course.has_certificate && <span className="text-gray-400">· Certificado</span>}
        </span>
        <a
          href={`/ir/curso/${course.id}`}
          target="_blank"
          rel="noopener"
          className="whitespace-nowrap rounded-full border border-black bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white active:scale-[0.97]"
        >
          Ver curso
        </a>
      </div>
    </article>
  )
}
