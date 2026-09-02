import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'
import { EspaciosDashboard } from '@/components/discovery/EspaciosDashboard'
import { isCurrentUserAdmin } from '@/lib/admin/isCurrentUserAdmin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios cerca de ti | Workcofy',
  description: 'Encuentra los cafés y espacios Work-Friendly más cercanos a tu ubicación.',
}

interface NearMePageProps {
  searchParams: {
    view?: string
    q?: string
    country?: string
    district?: string
    category?: string
    sort?: string
  }
}

export default async function NearMePage({ searchParams }: NearMePageProps) {
  if (searchParams.view === 'map') {
    const spaces = await listSpaces({
      search: searchParams.q,
      country: searchParams.country,
      district: searchParams.district,
      category: searchParams.category,
    })
    return <DiscoveryView spaces={spaces} autoRequestLocation initialSort="distance" fullScreen />
  }

  const [spaces, isAdmin] = await Promise.all([listSpaces(), isCurrentUserAdmin()])
  return <EspaciosDashboard spaces={spaces} isAdmin={isAdmin} />
}
