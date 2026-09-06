import { describe, expect, it } from 'vitest'
import { classifyAi } from './classifyAi'

const base = { title: 'Analista comercial', tags: [] as string[], description: 'Vender a clientes.' }

describe('classifyAi', () => {
  it('flags AI by category, title, tags, or description', () => {
    expect(classifyAi({ ...base, categoryName: 'Machine Learning & AI' })).toBe(true)
    expect(classifyAi({ ...base, title: 'Especialista en Adopción de IA' })).toBe(true)
    expect(classifyAi({ ...base, tags: ['ai tools'] })).toBe(true)
    expect(classifyAi({ ...base, description: 'Integrarás modelos LLM con RAG.' })).toBe(true)
    expect(classifyAi({ ...base, description: 'Experiencia con ChatGPT y Copilot' })).toBe(true)
    expect(classifyAi({ ...base, title: 'Prompt Engineer' })).toBe(true)
  })
  it('does not flag Spanish words that merely end in -ia or contain "ai"', () => {
    expect(classifyAi({ ...base, title: 'Asistencia comercial', description: 'Experiencia en Illustrator y AIR' })).toBe(false)
    expect(classifyAi({ ...base, title: 'Desarrollador HTML y XML' })).toBe(false)
    expect(classifyAi({ ...base, categoryName: 'Data Science / Analytics' })).toBe(false)
  })
})
