// Google Places' price_level: 0 = free, 1 = inexpensive ... 4 = very expensive.
export function formatPriceLevel(level: number | null): string | null {
  if (level == null) return null
  if (level <= 0) return 'Gratis'
  return '$'.repeat(Math.min(level, 4))
}
