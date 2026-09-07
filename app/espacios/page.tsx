import { listSpaces } from '@/lib/data/spaces'
import { parseCategoryListParam } from '@/lib/categories'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Spots para trabajar: cafeterías, coworkings y más | Workcofy',
  description:
    'Encuentra cafés, work cafés, coworkings, hoteles y bibliotecas donde trabajar cerca de ti, con WiFi, enchufes y ambiente verificados.',
}

interface EspaciosPageProps {
  searchParams: {
    q?: string
    country?: string
    district?: string
    category?: string
  }
}

// The full-screen map (formerly the ?view=map toggle) is the only Espacios
// experience now — the list-first dashboard it used to default to had no
// value of its own and is gone.
export default async function EspaciosPage({ searchParams }: EspaciosPageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    country: searchParams.country,
    district: searchParams.district,
    category: parseCategoryListParam(searchParams.category),
  })
  return <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
}
