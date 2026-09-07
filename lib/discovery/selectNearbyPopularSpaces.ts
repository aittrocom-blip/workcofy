import type { SpaceWithDistance } from '@/lib/data/spaceTypes'
import { isOpenNow } from '@/lib/hours/openingHours'

// Powers the floating carousel on the full-screen map (/espacios): the
// nearest spaces to the user, ranked by how many people have actually
// visited their page — "popular near you" rather than a global top list.
// Falls back to plain popularity when no real distance is known yet (before
// geolocation resolves).
export function selectNearbyPopularSpaces(
  spaces: SpaceWithDistance[],
  now: Date,
  limit = 9,
  poolSize = 20
): SpaceWithDistance[] {
  const withRealDistance = spaces.filter((space) => space.distanceKm != null)
  const pool = [...(withRealDistance.length > 0 ? withRealDistance : spaces)]
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, poolSize)

  const ranked = pool.sort((a, b) => b.view_count - a.view_count)
  // Open-now spaces come first — only fall back to closed ones to fill
  // remaining slots so the strip isn't sparse/empty late at night.
  const open = ranked.filter((space) => isOpenNow(space.opening_hours, now))
  const closed = ranked.filter((space) => !isOpenNow(space.opening_hours, now))
  return [...open, ...closed].slice(0, limit)
}
