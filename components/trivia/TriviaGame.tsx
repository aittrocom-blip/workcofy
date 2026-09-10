'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { TriviaIcon } from '@/components/layout/DiscoverIcons'

type Question = { topic: string; text: string; options: string[] }
type Game = {
  day: string
  attempt: null | { id: string; position: number; correct: number; elapsedMs: number; finished: boolean; question?: Question; remainingMs?: number; review?: (Question & { answer: number; explanation: string; selected: number | null; wasCorrect: boolean })[] }
  ranking: { rank: number; name: string; correct: number; elapsedMs: number; mine: boolean }[]
}
const PRIMARY = 'min-h-11 rounded-full bg-workcofy-yellow px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-workcofy-yellow/80 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

export function TriviaGame() {
  const [game, setGame] = useState<Game | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(15)
  const [chosen, setChosen] = useState<number | null>(null)
  const deadline = useRef(0)
  const busy = useRef(false)
  const expired = useRef('')

  const sync = useCallback(async (body?: object) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    const started = Date.now()
    try {
      const response = await fetch('/api/trivia', { method: body ? 'POST' : 'GET', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No pudimos cargar la trivia.')
      const remaining = Math.max(0, (data.attempt?.remainingMs ?? 15000) - (Date.now() - started))
      deadline.current = Date.now() + remaining
      setSeconds(Math.ceil(remaining / 1000))
      setGame(data)
      setChosen(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Revisa tu conexión e inténtalo otra vez.')
    } finally {
      setPending(false)
      busy.current = false
    }
  }, [])

  useEffect(() => { void sync() }, [sync])
  const attempt = game?.attempt
  useEffect(() => {
    if (!attempt || attempt.finished) return
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)))
    tick()
    const timer = window.setInterval(tick, 150)
    return () => window.clearInterval(timer)
  }, [attempt])
  useEffect(() => {
    if (!attempt || attempt.finished || seconds > 0 || pending || error) return
    const key = `${attempt.id}:${attempt.position}`
    if (expired.current === key) return
    expired.current = key
    void sync({ action: 'answer', id: attempt.id, position: attempt.position, selected: null })
  }, [attempt, seconds, pending, error, sync])

  function answer(selected: number) {
    if (!attempt || pending || seconds <= 0) return
    setChosen(selected)
    void sync({ action: 'answer', id: attempt.id, position: attempt.position, selected })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <Link href="/app" className="inline-flex min-h-11 items-center text-xs font-semibold text-gray-500 hover:text-black">← Volver a Explorar</Link>
      <header className="mb-6 mt-2">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-workcofy-yellow/15"><TriviaIcon className="h-6 w-6" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Un reto para tu curiosidad</p><h1 className="text-[28px] font-extrabold tracking-tight md:text-4xl">Trivia Workcofy</h1></div>
        </div>
        <p className="mt-3 text-sm text-gray-600 md:text-base">Piensa rápido. Aprende algo. Sube en el ranking.</p>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label="Partida de trivia" className="min-w-0">
          {!attempt ? (
            <div className="relative overflow-hidden rounded-[24px] bg-black p-6 text-white md:p-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-workcofy-yellow">La trivia del día</span>
              <h2 className="mt-3 max-w-sm text-3xl font-extrabold leading-tight tracking-tight">Tu próxima gran idea empieza con una pregunta.</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">Vibe coding, IA, trabajo remoto y vida nómada. Pon a prueba lo que sabes junto a la comunidad.</p>
              <div className="my-6 flex flex-wrap gap-2 text-xs font-semibold">
                {['5 preguntas', '15 s por pregunta', '1 intento al día'].map(label => <span key={label} className="rounded-full bg-white/10 px-3 py-2">{label}</span>)}
              </div>
              <button type="button" disabled={pending} onClick={() => void sync({ action: 'start' })} className={PRIMARY}>{pending ? 'Cargando…' : 'Jugar la trivia de hoy'} <span aria-hidden="true">↗</span></button>
              <p className="mt-3 text-xs text-white/60">Al jugar, tu nombre de pila y resultado aparecerán en el ranking.</p>
            </div>
          ) : attempt.finished ? (
            <div className="rounded-[24px] border border-workcofy-yellow/50 bg-[#FFFCF5] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-widest">Reto completado</p>
              <h2 className="mt-3 text-5xl font-extrabold">{attempt.correct}<span className="text-2xl text-gray-400"> / 5</span></h2>
              <p className="mt-3 text-sm text-gray-600">{attempt.correct >= 4 ? '¡Tu curiosidad está en forma!' : 'Cada pregunta te deja algo nuevo.'} Tiempo: {(attempt.elapsedMs / 1000).toFixed(1)} s.</p>
              <p className="mt-2 text-sm font-semibold">Vuelve mañana para una nueva ronda.</p>
              <div className="mt-6 space-y-3">
                {attempt.review?.map((q, i) => <details key={q.text} className="rounded-2xl border border-black/10 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">{q.wasCorrect ? '✓' : '✕'} {i + 1}. {q.text}</summary><p className="mt-3 text-xs text-gray-500">Tu respuesta: {q.selected === null ? 'Sin respuesta' : q.options[q.selected]}</p><p className="mt-2 text-sm font-semibold">Respuesta: {q.options[q.answer]}</p><p className="mt-2 text-sm leading-relaxed text-gray-600">{q.explanation}</p></details>)}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-gray-200 bg-[#FFFCF5] p-5 md:p-8">
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest">Pregunta {attempt.position + 1} de 5</span><span role="timer" aria-label={`${seconds} segundos restantes`} className={`rounded-full px-3 py-2 text-lg font-extrabold tabular-nums ${seconds <= 5 ? 'bg-red-50 text-red-700' : 'bg-workcofy-yellow text-black'}`}>{seconds} s</span></div>
              <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-workcofy-yellow transition-[width] duration-150" style={{ width: `${seconds / 15 * 100}%` }} /></div>
              <div aria-live="polite" aria-atomic="true"><p className="mt-6 text-xs font-semibold text-gray-500">{attempt.question?.topic}</p><h2 className="mt-2 text-xl font-extrabold leading-snug md:text-2xl">{attempt.question?.text}</h2></div>
              <div className="mt-6 grid gap-3">{attempt.question?.options.map((option, i) => <button key={`${attempt.position}-${i}`} type="button" disabled={pending || seconds === 0 || Boolean(error)} onClick={() => answer(i)} className={`flex min-h-14 items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-default ${chosen === i ? 'border-black bg-workcofy-yellow/30' : 'border-gray-200 bg-white enabled:hover:border-black enabled:hover:bg-workcofy-yellow/10'}`}><span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-black/5 text-xs">{'ABCD'[i]}</span>{option}</button>)}</div>
              <p className="mt-4 text-xs text-gray-500">{pending ? 'Guardando respuesta…' : 'Elige una respuesta para avanzar. El reloj sigue al salir de la página.'}</p>
            </div>
          )}
          {error && <div role="alert" className="mt-3 rounded-2xl border border-gray-200 p-4 text-sm"><p>{error}</p><button type="button" disabled={pending} onClick={() => { expired.current = ''; void sync() }} className="mt-2 min-h-11 font-semibold underline">Volver a conectar</button></div>}
          <p className="mt-4 text-xs leading-relaxed text-gray-500">Mismas preguntas para todos. Gana quien tenga más aciertos; a igual resultado, cuenta el menor tiempo total. Si se agota el reloj, esa pregunta suma 15 segundos y ningún acierto. Nueva ronda a medianoche de Lima.</p>
        </section>

        <aside className="min-w-0 self-start rounded-[24px] border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-extrabold tracking-tight">Ranking de hoy</h2><span className="rounded-full bg-workcofy-yellow/20 px-2 py-1 text-[10px] font-bold">TOP 50</span></div>
          <p className="mt-1 text-xs text-gray-500">La comunidad que aprende jugando.</p>
          {game && !game.ranking.length ? <div className="py-10 text-center"><p className="text-sm font-semibold">El primer puesto está esperando.</p><p className="mt-2 text-xs text-gray-500">Completa la trivia para inaugurar el ranking.</p></div> : !game ? <p className="py-8 text-sm text-gray-500">{error ? 'El ranking estará disponible al conectar.' : 'Cargando ranking…'}</p> : <table className="mt-5 w-full text-left text-xs"><caption className="sr-only">Resultados de la trivia de hoy, ordenados por aciertos y tiempo</caption><thead className="border-b border-gray-100 text-gray-500"><tr><th scope="col" className="py-3 pr-2">#</th><th scope="col" className="py-3">Jugador</th><th scope="col" className="py-3 text-right">Aciertos</th><th scope="col" className="py-3 text-right">Tiempo</th></tr></thead><tbody>{game.ranking.map(row => <tr key={row.rank} className={`border-b border-gray-50 ${row.mine ? 'bg-workcofy-yellow/15' : ''}`}><td className="py-3 pr-2 font-bold">{row.rank}</td><td className="max-w-[120px] break-words py-3 font-semibold">{row.name}{row.mine && <span className="ml-1 text-[10px] text-gray-500">(tú)</span>}</td><td className="py-3 text-right tabular-nums">{row.correct}/5</td><td className="py-3 text-right tabular-nums">{(row.elapsedMs / 1000).toFixed(1)} s</td></tr>)}</tbody></table>}
          <button type="button" disabled={pending || Boolean(attempt && !attempt.finished)} onClick={() => void sync()} className="mt-4 min-h-11 text-xs font-semibold underline underline-offset-4 disabled:opacity-40">Actualizar ranking</button>
        </aside>
      </div>
    </div>
  )
}
