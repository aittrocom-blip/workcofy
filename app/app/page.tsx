import { requireUser } from '@/lib/supabase/serverAuth'
import { listSpaces } from '@/lib/data/spaces'
import { listAllSpaceBenefits } from '@/lib/data/benefits'
import { listRewardEvents, rewardsBalanceFrom } from '@/lib/data/rewards'
import { countPublishedOpportunities, listRecentOpportunities } from '@/lib/data/opportunities'
import { countPublishedCourses, listFeaturedCourses } from '@/lib/data/courses'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { passHolderFrom } from '@/lib/pass'
import { ExplorarHome } from '@/components/app/ExplorarHome'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Explorar | Workcofy',
}

export default async function ExplorarPage() {
  const { user, supabase } = await requireUser('/app')

  // Streak and check-ins are queried on their own (not folded into the
  // profile select) so a not-yet-applied 0020/0021 migration degrades to a
  // 0 instead of taking the whole profile row down with it.
  const [{ data: profile }, spaces, benefits, events, { count: favoritesCount }, { count: checkinsCount }, { data: streakRow }, opportunities, courses, opportunityCount, courseCount, { count: certificateCount }] =
    await Promise.all([
      supabase.from('profiles').select('name, avatar_id, created_at, city').eq('id', user.id).single(),
      listSpaces(),
      listAllSpaceBenefits(),
      listRewardEvents(supabase, user.id),
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('space_checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('profiles').select('streak_count').eq('id', user.id).maybeSingle(),
      listRecentOpportunities(6),
      listFeaturedCourses(6),
      countPublishedOpportunities(),
      countPublishedCourses(),
      createServerSupabaseClient().from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published').eq('has_certificate', true),
    ])

  return (
    <ExplorarHome
      holder={passHolderFrom(user, profile)}
      spaces={spaces}
      benefits={benefits.slice(0, 8)}
      opportunities={opportunities}
      courses={courses}
      counts={{ opportunities: opportunityCount, courses: courseCount, certificates: certificateCount ?? 0 }}
      stats={{
        coins: rewardsBalanceFrom(events),
        streak: streakRow?.streak_count ?? 0,
        favorites: favoritesCount ?? 0,
        checkins: checkinsCount ?? 0,
      }}
    />
  )
}
