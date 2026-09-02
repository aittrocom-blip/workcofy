// Flips on only in the online/production environment via env var — local
// dev never sets this, so the map, login and registro stay fully usable
// while we keep iterating. Toggle by setting NEXT_PUBLIC_LAUNCH_LOCKED=true
// in the deployed environment's config, not in .env.local.
export const LAUNCH_LOCKED = process.env.NEXT_PUBLIC_LAUNCH_LOCKED === 'true'
