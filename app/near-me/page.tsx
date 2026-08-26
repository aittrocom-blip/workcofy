import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

export default async function NearMePage() {
  const spaces = await listSpaces()

  return (
    <div>
      <section className="px-4 py-8 md:px-8">
        <h1 className="text-2xl font-bold">Espacios cerca de ti</h1>
      </section>
      <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" />
    </div>
  )
}
