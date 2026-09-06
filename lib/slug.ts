export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSpaceSlug(name: string, districtSlug: string): string {
  return `${slugify(name)}-${slugify(districtSlug)}`
}

export function generateContentSlug(...parts: string[]): string {
  return parts.map(slugify).filter(Boolean).join('-')
}
