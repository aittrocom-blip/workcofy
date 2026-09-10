import { requireUser } from '@/lib/supabase/serverAuth'
import { TriviaGame } from '@/components/trivia/TriviaGame'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trivia | Workcofy' }

export default async function TriviaPage() {
  await requireUser('/trivia')
  return <TriviaGame />
}
