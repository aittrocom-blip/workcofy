import { createServiceRoleClient } from './lib/serviceRoleClient'
import { generateContentSlug } from '@/lib/slug'
import { COURSE_SEED_CATALOG } from '@/lib/courses/seedCatalog'
import type { CourseInsert } from '@/lib/data/courseTypes'

async function main() {
  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()
  const rows: (CourseInsert & { updated_at: string })[] = COURSE_SEED_CATALOG.map((course) => ({
    slug: generateContentSlug(course.title, course.provider),
    title: course.title,
    provider: course.provider,
    category: course.category,
    area: course.area ?? null,
    tool: course.tool ?? null,
    level: course.level,
    duration_text: course.duration_text ?? null,
    price: course.price,
    price_text: course.price_text ?? null,
    has_certificate: course.has_certificate,
    language: course.language,
    official: true,
    url: course.url,
    image_url: null,
    summary: course.summary,
    description: null,
    tags: course.tags,
    featured: course.featured ?? false,
    last_verified_at: course.last_verified_at,
    status: 'published',
    updated_at: now,
  }))

  const { error } = await supabase.from('courses').upsert(rows, { onConflict: 'slug' })
  if (error) {
    console.error(`Failed to seed courses: ${error.message}`)
    process.exit(1)
  }
  console.log(`Seeded ${rows.length} courses (${rows.filter((row) => row.featured).length} featured).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
