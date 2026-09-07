import Link from 'next/link'
import { countPublishedCourses, listFeaturedCourses } from '@/lib/data/courses'
import { CourseCard } from '@/components/courses/CourseCard'

// Master spec §35: featured courses picked in the courses table.
export async function CoursesHomeSection() {
  // Same degradation rule as OpportunitiesHomeSection: a failed query hides
  // the block instead of erroring the whole Home.
  const [courses, total] = await Promise.all([
    listFeaturedCourses(3).catch((error: unknown) => {
      console.warn('CoursesHomeSection: could not load courses', error)
      return []
    }),
    countPublishedCourses().catch(() => 0),
  ])
  if (courses.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Aprende</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Aprende algo nuevo hoy</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <Link
        href="/aprende"
        className="mt-8 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
      >
        Explorar cursos{total > 0 && ` (${total})`}
      </Link>
    </section>
  )
}
