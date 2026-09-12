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
    <section className="wc-section">
      <span className="wc-eyebrow">Aprende</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Aprende algo nuevo hoy</h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <Link
        href="/aprende"
        className="wc-button-primary mt-8 w-fit"
      >
        Explorar cursos{total > 0 && ` (${total})`}
      </Link>
    </section>
  )
}
