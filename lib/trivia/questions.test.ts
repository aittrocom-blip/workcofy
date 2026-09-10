import { describe, expect, it } from 'vitest'
import { dailyQuestionIds, QUESTIONS, scoreAnswer, triviaDay } from './questions'

describe('daily trivia rules', () => {
  it('uses the Lima calendar day across UTC midnight', () => {
    expect(triviaDay(new Date('2026-09-11T04:59:59Z'))).toBe('2026-09-10')
    expect(triviaDay(new Date('2026-09-11T05:00:00Z'))).toBe('2026-09-11')
  })
  it('assigns five unique valid questions consistently to all players', () => {
    const pool = QUESTIONS.map((_, id) => id)
    const ids = dailyQuestionIds('2026-09-10', pool)
    expect(ids).toEqual(dailyQuestionIds('2026-09-10', pool))
    expect(new Set(ids).size).toBe(5)
    expect(ids.every(id => Boolean(QUESTIONS[id]))).toBe(true)
    expect(ids).not.toEqual(dailyQuestionIds('2026-09-11', pool))
  })
  it('rejects correct answers arriving at or after the deadline', () => {
    expect(scoreAnswer(2, 2, 14999)).toEqual({ correct: true, time: 14999 })
    expect(scoreAnswer(2, 2, 15000)).toEqual({ correct: false, time: 15000 })
    expect(scoreAnswer(2, 2, 90000)).toEqual({ correct: false, time: 15000 })
  })
  it('does not reward skips or wrong answers', () => {
    expect(scoreAnswer(null, 2, 0)).toEqual({ correct: false, time: 15000 })
    expect(scoreAnswer(1, 2, 2000)).toEqual({ correct: false, time: 2000 })
  })
})
