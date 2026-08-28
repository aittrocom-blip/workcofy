import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

interface NearMePageProps {
  searchParams: { q?: string; country?: string; district?: string; category?: string; sort?: string }
}

export default async function NearMePage({ searchParams }: NearMePageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    country: searchParams.country,
    district: searchParams.district,
    category: searchParams.category,
  })

  return (
    <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
  )
}
