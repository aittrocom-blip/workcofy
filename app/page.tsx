import { anySpaceHasBenefits } from '@/lib/data/benefits'
import { Hero } from '@/components/home/Hero'
import { ExplorarSection } from '@/components/home/ExplorarSection'
import { EquiposSection } from '@/components/home/EquiposSection'
import { EventosSection } from '@/components/home/EventosSection'
import { CoinsSection } from '@/components/home/CoinsSection'
import { BenefitsTeaser } from '@/components/home/BenefitsTeaser'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const hasBenefits = await anySpaceHasBenefits()

  return (
    <div>
      <Hero />
      <ExplorarSection />
      <EquiposSection />
      <EventosSection />
      <CoinsSection />
      {hasBenefits && <BenefitsTeaser />}
    </div>
  )
}
