import { Hero } from '@/components/home/Hero'
import { PillarsSection } from '@/components/home/PillarsSection'
import { OpportunitiesHomeSection } from '@/components/home/OpportunitiesHomeSection'
import { AiSection } from '@/components/home/AiSection'
import { ExplorarSection } from '@/components/home/ExplorarSection'
import { CoursesHomeSection } from '@/components/home/CoursesHomeSection'
import { UserBenefitsSection } from '@/components/home/UserBenefitsSection'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div>
      <Hero />
      <PillarsSection />
      <UserBenefitsSection />
      <OpportunitiesHomeSection />
      <AiSection />
      <ExplorarSection />
      <CoursesHomeSection />
    </div>
  )
}
