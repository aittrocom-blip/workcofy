import { listSpaces } from '@/lib/data/spaces'
import { parseCategoryListParam } from '@/lib/categories'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios | Workcofy',
}

interface SpotsPageProps {
  searchParams: {
    q?: string
    country?: string
    district?: string
    category?: string
  }
}

// The app's discovery screen: the same full-screen map, floating filters,
// nearby carousel and slide-in ficha as /espacios — sized under the app
// header and above the tab bar via the shell's CSS variables. The
// "Verificado" filter is what narrows it to Workcofy Spots (?verified=1).
export default async function SpotsPage({ searchParams }: SpotsPageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    country: searchParams.country,
    district: searchParams.district,
    category: parseCategoryListParam(searchParams.category),
  })
  return <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
}
