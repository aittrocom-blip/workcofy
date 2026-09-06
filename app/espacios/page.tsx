import { listSpaces } from '@/lib/data/spaces'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'
import { EspaciosDashboard } from '@/components/discovery/EspaciosDashboard'
import { isCurrentUserAdmin } from '@/lib/admin/isCurrentUserAdmin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Espacios para trabajar: cafeterías, coworkings y más | Workcofy',
  description:
    'Encuentra cafés, work cafés, coworkings, hoteles y bibliotecas donde trabajar cerca de ti, con WiFi, enchufes y ambiente verificados.',
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
