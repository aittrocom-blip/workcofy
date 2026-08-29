import { listCoinRules, listCoinRedemptions } from '@/lib/data/coins'
import { listMissions } from '@/lib/data/missions'
import { anySpaceHasBenefits } from '@/lib/data/benefits'
import { Hero } from '@/components/home/Hero'
import { ExplorarSection } from '@/components/home/ExplorarSection'
import { EquiposSection } from '@/components/home/EquiposSection'
import { EventosSection } from '@/components/home/EventosSection'
import { VerifiedExplainer } from '@/components/home/VerifiedExplainer'
import { CoinsSection } from '@/components/home/CoinsSection'
import { BenefitsTeaser } from '@/components/home/BenefitsTeaser'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [coinRules, coinRedemptions, missions, hasBenefits] = await Promise.all([
    listCoinRules(),
    listCoinRedemptions(),
    listMissions(),
    anySpaceHasBenefits(),
  ])

  return (
    <div>
      <Hero />
      <ExplorarSection />
      <EquiposSection />
      <EventosSection />
      <VerifiedExplainer />
      <CoinsSection rules={coinRules} redemptions={coinRedemptions} missions={missions} />
      {hasBenefits && <BenefitsTeaser />}
    </div>
  )
}
