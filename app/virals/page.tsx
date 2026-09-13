import Link from 'next/link'
import { listSpaces } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

const instagramPosts: Record<string, { url: string; type: 'video' | 'photo'; views?: string; likes?: string }> = {
  'caleta.dolsacoffee': { url: 'https://www.instagram.com/p/DACHETjvtIK/', type: 'photo', likes: '2.9k' },
  '601espressocafe': { url: 'https://www.instagram.com/p/CopkaESOJ1M/', type: 'photo', likes: '673' },
  'ombu.cafeperu': { url: 'https://www.instagram.com/p/DXhdO8Gkau8/', type: 'video', views: '552' },
  'mossespresso.pe': { url: 'https://www.instagram.com/p/DdExIgvuBlT/', type: 'photo', likes: '17' },
  lapastoracoffee: { url: 'https://www.instagram.com/p/DcoolQ2T9A0/', type: 'video', views: '7.1k', likes: '604' },
  cofichile: { url: 'https://www.instagram.com/p/DdE63kHFkAb/', type: 'photo', likes: '34' },
  cafeblackmamba: { url: 'https://www.instagram.com/p/DdAFMXLGwjs/', type: 'photo', likes: '412' },
  'malamia.rest': { url: 'https://www.instagram.com/p/DHs3-W2uwn7/', type: 'video', views: '4.3k', likes: '425' },
  'blu.ilgelato': { url: 'https://www.instagram.com/p/DUUwBaaDWDA/', type: 'photo', likes: '286' },
  spacecafeperu: { url: 'https://www.instagram.com/p/DdElzk_DoxU/', type: 'photo', likes: '35' },
  'hibrido.coffeebar': { url: 'https://www.instagram.com/p/C-vKB2qxfRU/', type: 'photo', likes: '527' },
  piafcafe: { url: 'https://www.instagram.com/p/Dbstnm8udBK/', type: 'photo', likes: '96' },
}

interface ViralsPageProps {
  searchParams: { district?: string }
}

export default async function ViralsPage({ searchParams }: ViralsPageProps) {
  const spaces = await listSpaces({
    district: searchParams.district,
    category: ['cafe', 'work_cafe'],
  }).catch((error: unknown) => {
    console.warn('ViralsPage: could not load spaces', error)
    return []
  })
  const withSocial = spaces.filter((space) => space.tiktok_url || space.instagram_url)

  return (
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 md:px-8 md:py-14">
      <div className="max-w-2xl">
        <span className="wc-eyebrow">Workcofy Virals</span>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Espacios que están dando de qué hablar.
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600 md:text-lg">
          Videos de cafés y espacios para trabajar, reunirse, hacer networking y organizar eventos.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {['miraflores', 'san_isidro', 'barranco'].map((district) => (
          <Link
            key={district}
            href={`/virals?district=${district}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              searchParams.district === district ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'
            }`}
          >
            {districtLabel(district)}
          </Link>
        ))}
      </div>

      {withSocial.length > 0 ? (
        <div className="mt-10 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withSocial.map((space) => {
            const socialUrl = space.tiktok_url ?? space.instagram_url
            const socialLabel = space.tiktok_url ? 'TikTok' : 'Instagram'
            const username = space.instagram_url?.split('/').filter(Boolean).pop()?.replace(/^@/, '').toLowerCase()
            const post = username ? instagramPosts[username] : undefined
            const embedUrl = post ? `${post.url.replace(/\/$/, '')}/embed` : undefined
            return (
            <article key={space.id} className="wc-card min-w-0 overflow-hidden">
              <div className="relative isolate aspect-[4/3] min-w-0 overflow-hidden bg-[#f2efe9]">
                {embedUrl ? (
                  <iframe
                    title={`Preview de ${space.name} en Instagram`}
                    src={embedUrl}
                    className="wc-social-embed absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-gray-500">
                    <span className="text-4xl">{socialLabel === 'TikTok' ? '♪' : '◎'}</span>
                    <span className="px-6 text-sm font-semibold">Preview próximamente</span>
                  </div>
                )}
              </div>
              <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{space.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{districtLabel(space.district)}</p>
                </div>
                <span className="rounded-full bg-[var(--wc-accent)] px-2.5 py-1 text-xs font-bold">{socialLabel}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Mira cómo se vive este espacio para trabajar, reunirse o hacer eventos.
              </p>
              {post && (
                <p className="mt-3 text-xs font-medium text-gray-500">
                  {post.type === 'video' ? 'Video' : 'Publicación'}{post.views ? ` · ${post.views} reproducciones` : ''}{post.likes ? ` · ${post.likes} me gusta` : ''}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={socialUrl!} target="_blank" rel="noreferrer" className="wc-button-primary">
                  Ver contenido
                </a>
                <Link href={`/spaces/${space.slug}`} className="wc-button-secondary">
                  Ver ficha
                </Link>
              </div>
              </div>
            </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-[1.75rem] border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <h2 className="text-xl font-bold tracking-tight">Estamos preparando los primeros Virals</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            Primero verificaremos las cuentas de TikTok de los espacios de esta zona y después seleccionaremos los videos más útiles para la comunidad Workcofy.
          </p>
        </div>
      )}
    </main>
  )
}
