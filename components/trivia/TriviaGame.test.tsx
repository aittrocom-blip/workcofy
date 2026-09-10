import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TriviaGame } from './TriviaGame'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('TriviaGame', () => {
  it('shows an honest empty leaderboard and starts a server-backed round', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ day: '2026-09-10', attempt: null, ranking: [] }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ day: '2026-09-10', ranking: [], attempt: { id: 'a', position: 0, finished: false, correct: 0, elapsedMs: 0, remainingMs: 15000, question: { topic: 'IA', text: 'Una pregunta', options: ['Uno', 'Dos', 'Tres', 'Cuatro'] } } }) })
    vi.stubGlobal('fetch', fetcher)
    render(<TriviaGame />)
    expect(await screen.findByText('El primer puesto está esperando.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Jugar la trivia/ }))
    expect(await screen.findByText('Una pregunta')).toBeInTheDocument()
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'start' })
  })
  it('shows the connection problem and allows the player to retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Servicio no disponible' }) }))
    render(<TriviaGame />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
    expect(screen.getByRole('button', { name: /Jugar la trivia/ })).toBeEnabled()
  })
})
