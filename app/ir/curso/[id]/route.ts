import { NextResponse } from 'next/server'
import { getCourseById, incrementCourseClicks } from '@/lib/data/courses'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const course = await getCourseById(params.id)
  if (!course) return new NextResponse('Curso no encontrado', { status: 404 })
  await incrementCourseClicks(course.id, course.click_count)
  return NextResponse.redirect(course.url, 302)
}
