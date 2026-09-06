// Keyword classifier for opportunities.is_ai. Deliberately simple for the
// validation MVP (design spec §3); a model-based pass is a later phase.
// `\bIA\b` / `\bAI\b` are case-sensitive on purpose: "asistencia" and "AIR"
// must not match, while "IA", "AI Tools" and "Adopción de IA" must. Tags are
// also checked upper-cased because sources lowercase them.
const AI_PATTERNS: RegExp[] = [
  /\bIA\b/,
  /\bAI\b/,
  /\bML\b/,
  /\bRAG\b/,
  /\bNLP\b/,
  /\bLLMs?\b/i,
  /\bGPT/i,
  /inteligencia artificial/i,
  /machine learning/i,
  /deep learning/i,
  /computer vision/i,
  /chatgpt/i,
  /\bclaude\b/i,
  /copilot/i,
  /\bgemini\b/i,
  /generativ/i,
  /\bprompt/i,
  /agentes? (de )?ia\b/i,
]

const AI_CATEGORY = /machine learning|\bai\b/i

export interface ClassifyAiInput {
  title: string
  tags: string[]
  description: string
  categoryName?: string | null
}

export function classifyAi({ title, tags, description, categoryName }: ClassifyAiInput): boolean {
  if (categoryName && AI_CATEGORY.test(categoryName)) return true
  const haystacks = [title, description, ...tags, ...tags.map((tag) => tag.toUpperCase())]
  return haystacks.some((text) => AI_PATTERNS.some((pattern) => pattern.test(text)))
}
