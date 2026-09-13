const SEARCHES = [
  { key: 'focus', title: 'Concentración profunda', query: 'deep focus instrumental' },
  { key: 'lofi', title: 'Lo-fi para trabajar', query: 'lofi beats work study' },
  { key: 'coffee', title: 'Café & trabajo', query: 'coffee shop jazz work' },
  { key: 'reading', title: 'Lectura y estudio', query: 'piano study reading' },
  { key: 'energy', title: 'Energía productiva', query: 'productivity electronic work' },
  { key: 'nature', title: 'Ruido y naturaleza', query: 'nature sounds white noise focus' },
  { key: 'creative', title: 'Creatividad', query: 'creative work indie folk focus' },
]

export type SpotifyPlaylist = { id: string; name: string; url: string; image: string | null; owner: string | null }

// Hand-picked playlists that must always appear first in their category,
// regardless of what Spotify's search ranking returns that day.
const FEATURED_PLAYLISTS: Record<string, SpotifyPlaylist> = {
  focus: { id: '37i9dQZF1DX0wMD4IoQ5aJ', name: 'Electronic Focus', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0wMD4IoQ5aJ', image: 'https://i.scdn.co/image/ab67706f0000000251a837a657686b08f7359f4e', owner: 'Spotify' },
  energy: { id: '5IZ8B5Io6dSJ5h11QgKZ7k', name: 'Home Office 2026 💻 Working From Home', url: 'https://open.spotify.com/playlist/5IZ8B5Io6dSJ5h11QgKZ7k', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c2d335e9859e6e866471c445f', owner: 'sense.' },
  coffee: { id: '1vmPeUv7I9SbldjHpfuXWu', name: 'WORK CAFÉ', url: 'https://open.spotify.com/playlist/1vmPeUv7I9SbldjHpfuXWu', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72c22c6f68b70ac02c2f84979aa', owner: 'Santander España' },
}

function withFeatured(key: string, playlists: SpotifyPlaylist[]): SpotifyPlaylist[] {
  const featured = FEATURED_PLAYLISTS[key]
  if (!featured) return playlists
  return [featured, ...playlists.filter((p) => p.id !== featured.id)].slice(0, 10)
}

// The hand-picked set, with each one's category label attached — for
// Explorar's "Música" teaser, which shows a taste of /musica without a live
// Spotify call on the home page.
export function getFeaturedPlaylists(): Array<SpotifyPlaylist & { categoryKey: string; categoryTitle: string }> {
  return SEARCHES.flatMap((category) => {
    const featured = FEATURED_PLAYLISTS[category.key]
    return featured ? [{ ...featured, categoryKey: category.key, categoryTitle: category.title }] : []
  })
}

export const FALLBACK_PLAYLISTS: Array<{ key: string; title: string; query: string; playlists: SpotifyPlaylist[] }> = [
  { key: 'focus', title: 'Concentración profunda', query: '', playlists: withFeatured('focus', [{ id: '70P9TRjdmwxUQyH03yNlUZ', name: 'Anxiety Focus Music', url: 'https://open.spotify.com/playlist/70P9TRjdmwxUQyH03yNlUZ', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000d72cebc102d60931ef98e985b3fa', owner: 'Beat Tree Records' }]) },
  { key: 'lofi', title: 'Lo-fi para trabajar', query: '', playlists: withFeatured('lofi', [{ id: '2Al9G2jrWkwDlRFMZaw1GX', name: 'lofi Jazz cafe 🎷 Study Beats & Chill Vibes', url: 'https://open.spotify.com/playlist/2Al9G2jrWkwDlRFMZaw1GX', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cba237b11ebbe59a425db3033', owner: 'Chill Select' }]) },
  { key: 'coffee', title: 'Café & trabajo', query: '', playlists: withFeatured('coffee', [{ id: '0W1OHOYxgiJJKYHrY2dsL1', name: 'Cozy Coffee Shop ☕️ Jazz in the Background', url: 'https://open.spotify.com/playlist/0W1OHOYxgiJJKYHrY2dsL1', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da844a8cdc091f267ce1d8554e9b', owner: 'Calypto' }]) },
  { key: 'reading', title: 'Lectura y estudio', query: '', playlists: withFeatured('reading', [{ id: '4uAjKH707f6tvAp9NqPe5w', name: 'Piano for studying/reading', url: 'https://open.spotify.com/playlist/4uAjKH707f6tvAp9NqPe5w', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72c6f54d139c556f68c21f0333c', owner: 'Alda' }]) },
  { key: 'energy', title: 'Energía productiva', query: '', playlists: withFeatured('energy', [{ id: '5YQG6dDa41za17EyGsttuW', name: 'Music for Focused Work 💻 productivity mode', url: 'https://open.spotify.com/playlist/5YQG6dDa41za17EyGsttuW', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8468fa7641523c2089a62996b3', owner: 'TOP PLAYLIST METAL' }]) },
  { key: 'nature', title: 'Ruido y naturaleza', query: '', playlists: withFeatured('nature', [{ id: '3hlnFDbfaIVdFVIiei8u6x', name: 'White Noise Nature Sounds to Sleep / Focus - Loopable', url: 'https://open.spotify.com/playlist/3hlnFDbfaIVdFVIiei8u6x', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84e196198212f7fe9b20a300af', owner: '. Sleep Music Garden .' }]) },
  { key: 'creative', title: 'Creatividad', query: '', playlists: withFeatured('creative', [{ id: '7wClo60XqvtsOrJZV9coKP', name: 'Indie Folk For Working', url: 'https://open.spotify.com/playlist/7wClo60XqvtsOrJZV9coKP', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da8470d8dc15cb0ae42d85350deb', owner: 'BlueShip' }]) },
]

async function token() {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) throw new Error('Spotify no está configurado')
  const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', next: { revalidate: 3500 } })
  if (!response.ok) throw new Error('No se pudo conectar con Spotify')
  return (await response.json()).access_token as string
}

export type MusicCategory = { key: string; title: string; query: string; playlists: SpotifyPlaylist[] }

export async function getSpotifyPlaylists(): Promise<MusicCategory[]> {
  const accessToken = await token()
  return Promise.all(SEARCHES.map(async (category) => {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(category.query)}&type=playlist&limit=10&market=PE`, { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 21_600 } })
    if (!response.ok) return { ...category, playlists: withFeatured(category.key, []) }
    const data = await response.json()
    const playlists = (data.playlists?.items ?? []).filter((item: any) => item != null).map((item: any) => ({ id: item.id, name: item.name, url: item.external_urls?.spotify, image: item.images?.[0]?.url ?? null, owner: item.owner?.display_name ?? null } as SpotifyPlaylist))
    return { ...category, playlists: withFeatured(category.key, playlists) }
  }))
}
