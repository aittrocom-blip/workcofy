import { NextResponse } from 'next/server'
import { createCookieSupabaseClient } from '@/lib/supabase/serverAuth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { QUESTION_SECONDS, ROUND_SIZE, triviaDay, triviaMonth, dailyQuestionIds, scoreAnswer } from '@/lib/trivia/questions'

export const dynamic = 'force-dynamic'
type Attempt = {
  id: string; user_id: string; day: string; display_name: string; question_ids: number[];
  position: number; answers: { selected: number | null; correct: boolean }[];
  correct: number; elapsed_ms: number; question_started_at: string; finished_at: string | null;
}
type Question = { id: number; topic: string; question: string; options: string[]; correct_option: number; explanation: string }
function present(row: Attempt | null, questions: Map<number, Question>) {
  if (!row) return null
  const base = { id: row.id, position: row.position, correct: row.correct, elapsedMs: row.elapsed_ms, finished: Boolean(row.finished_at) }
  const byId = (id: number) => {
    const question = questions.get(id)
    if (!question) throw new Error('No encontramos las preguntas de esta trivia.')
    return question
  }
  if (row.finished_at) return { ...base, review: row.question_ids.map((id, i) => {
    const question = byId(id)
    return { topic: question.topic, text: question.question, options: question.options, answer: question.correct_option, explanation: question.explanation, selected: row.answers[i]?.selected ?? null, wasCorrect: row.answers[i]?.correct ?? false }
  }) }
  const question = byId(row.question_ids[row.position])
  return { ...base, question: { topic: question.topic, text: question.question, options: question.options }, remainingMs: Math.max(0, QUESTION_SECONDS * 1000 - (Date.now() - Date.parse(row.question_started_at))) }
}
async function handle(request: Request) {
  const { data: { user } } = await createCookieSupabaseClient().auth.getUser()
  if (!user) return NextResponse.json({ error: 'Inicia sesión para jugar.' }, { status: 401 })
  const db = createAdminSupabaseClient()
  const day = triviaDay()
  const month = triviaMonth(day)
  const { data: monthRows, error: questionsError } = await db.from('trivia_questions').select('id, topic, question, options, correct_option, explanation').eq('month', month).order('sort_order')
  if (questionsError || (monthRows ?? []).length < ROUND_SIZE) return NextResponse.json({ error: 'Estamos cargando las preguntas de este mes. Vuelve en un momento.' }, { status: 503 })
  const questions = new Map((monthRows as Question[]).map((question) => [question.id, question]))
  const { data, error } = await db.from('trivia_attempts').select('*').eq('user_id', user.id).eq('day', day).maybeSingle()
  if (error) return NextResponse.json({ error: 'La trivia todavía se está activando. Vuelve en un momento.' }, { status: 503 })
  let attempt = data as Attempt | null
  if (request.method === 'POST') {
    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }
    if (body?.action === 'start') {
      if (!attempt) {
        const { data: profile } = await db.from('profiles').select('name').eq('id', user.id).maybeSingle()
        const displayName = (profile?.name?.trim().split(/\s+/)[0] || 'Workcofer').slice(0, 40)
        const { error: insertError } = await db.from('trivia_attempts').upsert({ user_id: user.id, day, display_name: displayName, question_ids: dailyQuestionIds(day, [...questions.keys()]) }, { onConflict: 'user_id,day', ignoreDuplicates: true })
        if (insertError) throw insertError
        const result = await db.from('trivia_attempts').select('*').eq('user_id', user.id).eq('day', day).single()
        if (result.error) throw result.error
        attempt = result.data as Attempt
      }
    } else if (body?.action === 'answer') {
      if (!attempt || body.id !== attempt.id) return NextResponse.json({ error: 'Vuelve a cargar tu partida.' }, { status: 409 })
      if (body.selected !== null && (!Number.isInteger(body.selected) || body.selected < 0 || body.selected > 3)) return NextResponse.json({ error: 'Respuesta inválida.' }, { status: 400 })
      // Compare-and-swap prevents duplicate requests/tabs from scoring twice.
      if (!attempt.finished_at && body.position === attempt.position) {
        const now = new Date()
        const elapsed = now.getTime() - Date.parse(attempt.question_started_at)
        const currentQuestion = questions.get(attempt.question_ids[attempt.position])
        if (!currentQuestion) throw new Error('No encontramos la pregunta actual.')
        const scored = scoreAnswer(body.selected, currentQuestion.correct_option, elapsed)
        const position = attempt.position + 1
        const result = await db.from('trivia_attempts').update({ position, answers: [...attempt.answers, { selected: body.selected, correct: scored.correct }], correct: attempt.correct + Number(scored.correct), elapsed_ms: attempt.elapsed_ms + scored.time, question_started_at: now.toISOString(), finished_at: position === ROUND_SIZE ? now.toISOString() : null }).eq('id', attempt.id).eq('position', attempt.position).select('*').maybeSingle()
        if (result.error) throw result.error
        if (result.data) attempt = result.data as Attempt
        else {
          const latest = await db.from('trivia_attempts').select('*').eq('id', attempt.id).single()
          if (latest.error) throw latest.error
          attempt = latest.data as Attempt
        }
      }
    } else return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
  }
  const ranking = await db.from('trivia_attempts').select('id, user_id, display_name, correct, elapsed_ms').eq('day', day).not('finished_at', 'is', null).order('correct', { ascending: false }).order('elapsed_ms').order('finished_at').order('id').limit(50)
  if (ranking.error) throw ranking.error
  return NextResponse.json({ day, attempt: present(attempt, questions), ranking: (ranking.data ?? []).map((row, i) => ({ rank: i + 1, name: row.display_name, correct: row.correct, elapsedMs: row.elapsed_ms, mine: row.user_id === user.id })) }, { headers: { 'Cache-Control': 'no-store' } })
}
async function safeHandle(request: Request) {
  try { return await handle(request) } catch { return NextResponse.json({ error: 'No pudimos conectar. Inténtalo otra vez.' }, { status: 503 }) }
}
export const GET = safeHandle
export const POST = safeHandle
