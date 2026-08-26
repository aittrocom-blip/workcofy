import { isOpenNow } from '@/lib/hours/openingHours'
import type { SpaceWithDistance } from '@/lib/data/spaceTypes'
import type { SortOption } from '@/lib/filters/discoveryFilters'

export function sortSpaces(
  spaces: SpaceWithDistance[],
  sort: SortOption,
  now: Date = new Date()
): SpaceWithDistance[] {
  const copy = [...spaces]

  if (sort === 'distance') {
    copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  } else if (sort === 'rating') {
    copy.sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity))
  } else if (sort === 'open_now') {
    copy.sort(
      (a, b) => Number(isOpenNow(b.opening_hours, now)) - Number(isOpenNow(a.opening_hours, now))
    )
  }

  return copy
}
