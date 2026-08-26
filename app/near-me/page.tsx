import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

interface NearMePageProps {
  searchParams: { q?: string; district?: string; category?: string; sort?: string }
}

export default async function NearMePage({ searchParams }: NearMePageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    district: searchParams.district,
    category: searchParams.category,
  })

  return (
    <div>
      <section className="px-4 py-8 md:px-8">
        <h1 className="text-2xl font-bold">Espacios cerca de ti</h1>
      </section>
      <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" />
    </div>
  )
}
