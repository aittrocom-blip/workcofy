import { listSpaces } from '@/lib/data/spaces'
import { Hero } from '@/components/home/Hero'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: { q?: string; district?: string; category?: string; sort?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const spaces = await listSpaces({
    search: searchParams.q,
    district: searchParams.district,
    category: searchParams.category,
  })

  return (
    <div>
      <Hero />
      <DiscoveryView spaces={spaces} />
    </div>
  )
}
