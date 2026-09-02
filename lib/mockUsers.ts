import { AVATAR_OPTIONS } from '@/lib/avatars'

// Illustrative-only user set for previewing what the future Comunidad
// features will look like once real accounts exist. Never presented as real
// activity — always paired with a visible "vista previa / ejemplo" label
// wherever it's rendered. Uses the same avatar artwork as real user profiles
// (see lib/avatars.ts) so example people look consistent with the rest of
// the app instead of falling back to colored initials.
export interface MockUser {
  initials: string
  name: string
  avatarId: string
}

const NAMES = [
  'José Ortiz', 'Rosa Paredes', 'Juan Jara', 'María Lucía Soto', 'Andrés Castillo',
  'Camila Vega', 'Diego Torres', 'Valentina Ríos', 'Sebastián Cruz', 'Lucía Fernández',
  'Mateo Gómez', 'Antonella Reyes', 'Nicolás Salazar', 'Fernanda Vargas', 'Emilio Aguirre',
  'Renata Ibáñez', 'Tomás Herrera', 'Alejandra Nuñez', 'Gabriel Espinoza', 'Isabela Moreno',
]

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export const MOCK_USERS: MockUser[] = NAMES.map((name, index) => ({
  initials: initialsFrom(name),
  name,
  avatarId: AVATAR_OPTIONS[index % AVATAR_OPTIONS.length].id,
}))

// Deterministic per-space seed so the same space always shows the same
// example visitors across page loads instead of reshuffling on every
// request — a cheap string hash is enough since this is illustrative only.
function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

export interface ExampleVisitor extends MockUser {
  daysAgo: number
}

export function pickExampleVisitors(seed: string, count = 3): ExampleVisitor[] {
  const base = hashSeed(seed)
  const visitors: ExampleVisitor[] = []
  for (let i = 0; i < count; i++) {
    const userIndex = (base + i * 7) % MOCK_USERS.length
    // Unsigned shift — `base` treated as signed 32-bit here would go
    // negative for large hashes, making `% 6` produce a negative daysAgo.
    const daysAgo = ((base >>> (i + 2)) % 6) + 1
    visitors.push({ ...MOCK_USERS[userIndex], daysAgo })
  }
  return visitors
}
