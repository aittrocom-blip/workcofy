import Link from 'next/link'
import { listSpaces } from '@/lib/data/spaces'
import { districtLabel } from '@/lib/districts'

export const dynamic = 'force-dynamic'

interface ViralsPageProps {
  searchParams: { district?: string }
}

export default async function ViralsPage({ searchParams }: ViralsPageProps) {
  const spaces = await listSpaces({
    district: searchParams.district,
    category: ['cafe', 'work_cafe'],
  })
  const withTikTok = spaces.filter((space) => space.tiktok_url)

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-2xl">
        <span className="wc-eyebrow">Workcofy Virals</span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
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

      {withTikTok.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withTikTok.map((space) => (
            <article key={space.id} className="wc-card overflow-hidden p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{space.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{districtLabel(space.district)}</p>
                </div>
                <span className="rounded-full bg-[var(--wc-accent)] px-2.5 py-1 text-xs font-bold">TikTok</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Mira cómo se vive este espacio para trabajar, reunirse o hacer eventos.
              </p>
              <div className="mt-5 flex gap-2">
                <a href={space.tiktok_url!} target="_blank" rel="noreferrer" className="wc-button-primary">
                  Ver contenido
                </a>
                <Link href={`/spaces/${space.slug}`} className="wc-button-secondary">
                  Ver ficha
                </Link>
              </div>
            </article>
          ))}
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
