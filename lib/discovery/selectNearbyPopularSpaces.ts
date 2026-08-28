import type { SpaceWithDistance } from '@/lib/data/spaceTypes'

// Powers the floating carousel on the full-screen map (/near-me): the
// nearest spaces to the user, ranked by how many people have actually
// visited their page — "popular near you" rather than a global top list.
// Falls back to plain popularity when no real distance is known yet (before
// geolocation resolves).
export function selectNearbyPopularSpaces(
  spaces: SpaceWithDistance[],
  limit = 9,
  poolSize = 20
): SpaceWithDistance[] {
  const withRealDistance = spaces.filter((space) => space.distanceKm != null)
  const pool = [...(withRealDistance.length > 0 ? withRealDistance : spaces)]
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    .slice(0, poolSize)

  return pool.sort((a, b) => b.view_count - a.view_count).slice(0, limit)
}
