import { listSpaces } from '@/lib/data/spaces'
import { listCoinRules, listCoinRedemptions } from '@/lib/data/coins'
import { anySpaceHasBenefits } from '@/lib/data/benefits'
import { Hero } from '@/components/home/Hero'
import { DiscoveryView } from '@/components/discovery/DiscoveryView'
import { FeaturedSpaces } from '@/components/home/FeaturedSpaces'
import { VerifiedExplainer } from '@/components/home/VerifiedExplainer'
import { CoinsSection } from '@/components/home/CoinsSection'
import { BenefitsTeaser } from '@/components/home/BenefitsTeaser'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: { q?: string; district?: string; category?: string; sort?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [spaces, coinRules, coinRedemptions, hasBenefits] = await Promise.all([
    listSpaces({
      search: searchParams.q,
      district: searchParams.district,
      category: searchParams.category,
    }),
    listCoinRules(),
    listCoinRedemptions(),
    anySpaceHasBenefits(),
  ])

  return (
    <div>
      <Hero />
      <DiscoveryView spaces={spaces} />
      <FeaturedSpaces spaces={spaces} />
      <VerifiedExplainer />
      <CoinsSection rules={coinRules} redemptions={coinRedemptions} />
      {hasBenefits && <BenefitsTeaser />}
    </div>
  )
}
