'use client'

import { useRef, useState } from 'react'
import { PlaylistLikeButton } from '@/components/music/PlaylistLikeButton'
import { PlaylistFavoriteButton } from '@/components/music/PlaylistFavoriteButton'
import { logPlaylistClick } from './actions'

type Category = {
  key: string
  title: string
  playlists: { id: string; name: string; url: string; image: string | null; owner: string | null }[]
}

export default function MusicGrid({ categories, likeCounts }: { categories: Category[]; likeCounts: Record<string, number> }) {
  const [active, setActive] = useState('all')
  const [page, setPage] = useState(0)
  const filterRef = useRef<HTMLDivElement>(null)
  const visible = active === 'all' ? categories : categories.filter((category) => category.key === active)
  const allPlaylists = visible.flatMap(({ key, title, playlists = [] }) => playlists.map((playlist) => ({ key, title, playlist })))
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(allPlaylists.length / pageSize))
  const pagePlaylists = allPlaylists.slice(page * pageSize, (page + 1) * pageSize)
  const moveFilters = (direction: number) => filterRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' })

  return <>
    <div className="relative mt-6 overflow-hidden">
      <button aria-label="Categorías anteriores" onClick={() => moveFilters(-1)} className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold shadow-sm">‹</button>
      <div ref={filterRef} className="flex gap-2 overflow-x-auto px-11 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button onClick={() => { setActive('all'); setPage(0) }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active === 'all' ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-700'}`}>Todas</button>
        {categories.map((category) => <button key={category.key} onClick={() => { setActive(category.key); setPage(0) }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${active === category.key ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-700'}`}>{category.title}</button>)}
      </div>
      <button aria-label="Siguientes categorías" onClick={() => moveFilters(1)} className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold shadow-sm">›</button>
    </div>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      {pagePlaylists.map(({ key, title, playlist }) => <section key={`${key}-${playlist.id}`} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {playlist.image ? <img src={playlist.image} alt="" className="h-44 w-full object-cover" /> : <div className="h-44 bg-gray-100" />}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{title}</p>
            <div className="flex shrink-0 items-center gap-3">
              <PlaylistLikeButton playlistId={playlist.id} likeCount={likeCounts[playlist.id] ?? 0} className="flex items-center gap-1" />
              <PlaylistFavoriteButton
                playlist={{ id: playlist.id, name: playlist.name, image: playlist.image, owner: playlist.owner, url: playlist.url, categoryKey: key, categoryTitle: title }}
                className="h-5 w-5"
              />
            </div>
          </div>
          <h2 className="mt-2 text-lg font-extrabold tracking-tight">{playlist.name}</h2>
          <p className="mt-1 text-xs text-gray-500">Spotify{playlist.owner ? ` · ${playlist.owner}` : ''}</p>
          <a href={playlist.url} target="_blank" rel="noreferrer" onClick={() => logPlaylistClick(playlist.id)} className="mt-4 inline-flex rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white">Escuchar en Spotify</a>
        </div>
      </section>)}
    </div>
    {allPlaylists.length > pageSize && <div className="mt-7 flex items-center justify-center gap-3"><button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-40">Anterior</button><span className="text-xs font-semibold text-gray-500">Página {page + 1} de {pageCount}</span><button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Siguiente</button></div>}
  </>
}
