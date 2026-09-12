import { notFound } from 'next/navigation'
import { getSpaceBySlugForAdmin } from '@/lib/data/spaces'
import { VerificationForm } from './VerificationForm'
import { AmenitiesEditorForm } from './AmenitiesEditorForm'
import { DeleteSpaceForm } from './DeleteSpaceForm'
import { TrustProfileForm } from './TrustProfileForm'
import { SpaceQrCode } from './SpaceQrCode'

export const dynamic = 'force-dynamic'

interface AdminSpacePageProps {
  params: { slug: string }
}

export default async function AdminSpacePage({ params }: AdminSpacePageProps) {
  // Admin-only fetch (not the public getSpaceBySlug) — a deactivated space
  // must still open here, otherwise "Reactivar" would be unreachable.
  const space = await getSpaceBySlugForAdmin(params.slug)
  if (!space) notFound()
  const trustLevel = space.trust_level ?? (space.verified ? 'workcofy_verified' : 'listed')

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
      <VerificationForm spaceId={space.id} slug={space.slug} initialVerified={space.verified} />
      <TrustProfileForm spaceId={space.id} slug={space.slug} initialLevel={trustLevel} initialUses={space.recommended_for ?? []} initialMethod={space.verification_method ?? null} />
      <SpaceQrCode slug={space.slug} />
      <AmenitiesEditorForm
        spaceId={space.id}
        slug={space.slug}
        initialAmenities={space.amenities}
      />
      <DeleteSpaceForm spaceId={space.id} slug={space.slug} initialActive={space.active} />
    </div>
  )
}
