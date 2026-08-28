import { notFound } from 'next/navigation'
import { getSpaceBySlug } from '@/lib/data/spaces'
import { VerificationForm } from './VerificationForm'

export const dynamic = 'force-dynamic'

interface AdminSpacePageProps {
  params: { slug: string }
}

export default async function AdminSpacePage({ params }: AdminSpacePageProps) {
  const space = await getSpaceBySlug(params.slug)
  if (!space) notFound()

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
      <VerificationForm
        spaceId={space.id}
        slug={space.slug}
        initialVerified={space.verified}
        initialVerifiedAmenities={space.verified_amenities}
      />
    </div>
  )
}
