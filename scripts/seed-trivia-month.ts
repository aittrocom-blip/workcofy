import { createServiceRoleClient } from './lib/serviceRoleClient'
import { QUESTIONS } from '@/lib/trivia/questions'

async function main() {
  const month = process.argv[2]
  if (!/^\d{4}-\d{2}-01$/.test(month ?? '')) throw new Error('Uso: tsx scripts/seed-trivia-month.ts AAAA-MM-01')

  const rows = QUESTIONS.map((question, sort_order) => ({
    month, topic: question.topic, question: question.text, options: question.options,
    correct_option: question.answer, explanation: question.explanation, sort_order,
  }))
  const { error } = await createServiceRoleClient().from('trivia_questions').upsert(rows, { onConflict: 'month,sort_order' })
  if (error) throw error
  console.log(`${rows.length} preguntas cargadas para ${month}.`)
}

main()
