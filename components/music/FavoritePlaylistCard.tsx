'use client'

import { PlaylistFavoriteButton } from '@/components/music/PlaylistFavoriteButton'

interface FavoritePlaylist {
  id: string
  name: string
  image: string | null
  owner: string | null
  url: string
  categoryKey: string
  categoryTitle: string
}

// The /favoritos "mural" version of a playlist card — same visual language
// as MusicGrid's card, minus the like button (that count only matters on
// /musica; here it's just "here's what you saved, unsave it if you want").
export function FavoritePlaylistCard({ playlist }: { playlist: FavoritePlaylist }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
      {playlist.image ? <img src={playlist.image} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 bg-gray-100" />}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{playlist.categoryTitle}</p>
          <PlaylistFavoriteButton playlist={playlist} className="h-5 w-5 shrink-0" />
        </div>
        <h3 className="mt-2 text-base font-extrabold tracking-tight">{playlist.name}</h3>
        <p className="mt-1 text-xs text-gray-500">Spotify{playlist.owner ? ` · ${playlist.owner}` : ''}</p>
        <a href={playlist.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-black px-4 py-2 text-sm font-bold text-white">Escuchar en Spotify</a>
      </div>
    </section>
  )
}
