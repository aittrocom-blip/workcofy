import { notFound } from 'next/navigation'
import { getSpaceBySlugForAdmin } from '@/lib/data/spaces'
import { AmenitiesEditorForm } from './AmenitiesEditorForm'
import { DeleteSpaceForm } from './DeleteSpaceForm'
import { TrustProfileForm } from './TrustProfileForm'
import { SpaceQrCode } from './SpaceQrCode'
import { PartnerAccessForm } from './PartnerAccessForm'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

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
  const admin = createAdminSupabaseClient()
  const { data: partnerAccount } = await admin.from('partner_accounts').select('username, active').eq('space_id', space.id).maybeSingle()
  if (partnerAccount?.active && space.partner_status !== 'partner') {
    await admin.from('spaces').update({ partner_status: 'partner' }).eq('id', space.id)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex flex-col items-start gap-1"><h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>{partnerAccount?.active && <img src="/partner-logo.png" alt="Workcofy Partner" className="h-6 w-[4.5rem] object-contain" />}</div>
      <TrustProfileForm spaceId={space.id} slug={space.slug} initialLevel={trustLevel} initialUses={space.recommended_for ?? []} initialMethod={space.verification_method ?? null} />
      <SpaceQrCode slug={space.slug} />
      <PartnerAccessForm spaceId={space.id} slug={space.slug} partner={partnerAccount} />
      <AmenitiesEditorForm
        spaceId={space.id}
        slug={space.slug}
        initialAmenities={space.amenities}
      />
      <DeleteSpaceForm spaceId={space.id} slug={space.slug} initialActive={space.active} />
    </div>
  )
}
