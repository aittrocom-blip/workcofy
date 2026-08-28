// Illustrative-only user set for previewing what the future Comunidad
// features will look like once real accounts exist. Never presented as real
// activity — always paired with a visible "vista previa / ejemplo" label
// wherever it's rendered (see components/space/CommunityPreview.tsx).
export interface MockUser {
  initials: string
  name: string
  colorClass: string
}

const COLOR_CLASSES = [
  'bg-workcofy-yellow/25 text-workcofy-black',
  'bg-workcofy-green/25 text-workcofy-black',
  'bg-purple-100 text-purple-900',
  'bg-blue-100 text-blue-900',
  'bg-rose-100 text-rose-900',
  'bg-orange-100 text-orange-900',
]

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
  colorClass: COLOR_CLASSES[index % COLOR_CLASSES.length],
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
    const daysAgo = ((base >> (i + 2)) % 6) + 1
    visitors.push({ ...MOCK_USERS[userIndex], daysAgo })
  }
  return visitors
}
