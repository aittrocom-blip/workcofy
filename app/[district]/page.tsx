import { notFound } from 'next/navigation'
import { districtValueFromSlug, districtLabel } from '@/lib/districts'
import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

interface DistrictPageProps {
  params: { district: string }
}

export function generateMetadata({ params }: DistrictPageProps) {
  const value = districtValueFromSlug(params.district)
  if (!value) return {}
  const label = districtLabel(value)
  return {
    title: `Cafés Work-Friendly en ${label} | Workcofy`,
    description: `Descubre cafés y espacios donde puedes trabajar, reunirte o pasar unas horas con tu laptop en ${label}.`,
  }
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const districtValue = districtValueFromSlug(params.district)
  if (!districtValue) notFound()

  const spaces = await listSpaces({ district: districtValue })
  const label = districtLabel(districtValue)

  return (
    <div>
      <section className="px-4 py-8 md:px-8">
        <h1 className="text-2xl font-bold">Cafés Work-Friendly en {label}</h1>
        <p className="mt-2 text-gray-600">
          Descubre cafés y espacios donde puedes trabajar, reunirte o pasar unas horas con tu laptop
          en {label}.
        </p>
      </section>
      <DiscoveryView spaces={spaces} />
    </div>
  )
}
