import { NextResponse } from 'next/server'
import { getSpaceBySlug } from '@/lib/data/spaces'

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(space)
}
