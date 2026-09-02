import Link from 'next/link'
import Image from 'next/image'
import { LAUNCH_LOCKED } from '@/lib/launchLock'

// The hero image is purely illustrative — it shows what Workcofy looks like
// without repeating the app's own headline/copy. The CTA below is the real
// entry point into the full-screen map experience at /near-me.
export function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center md:px-8 md:pt-14">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">&nbsp;</span>
      <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold tracking-tight md:text-6xl">
        Tu ecosistema para trabajar remoto.
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-base text-gray-500 md:text-lg">
        Encuentra espacios para trabajar, colaborar y aprender.
      </p>

      <div className="relative mt-8">
        <Image
          src="/hero-bg.png"
          alt="Workcofy — encuentra espacios work-friendly cerca de ti"
          width={1672}
          height={847}
          priority
          className="h-auto w-full"
        />
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400 md:text-sm">
        Mapa · Filtros · Amenities · Experiencias reales
      </p>
      {LAUNCH_LOCKED ? (
        <span
          title="Próximamente"
          className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-gray-200 px-8 py-3.5 text-base font-semibold text-gray-400"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-search.png" alt="" className="h-4 w-auto opacity-40" />
          Explora
        </span>
      ) : (
        <Link
          href="/near-me"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/nav-search.png" alt="" className="h-4 w-auto invert" />
          Explora
        </Link>
      )}
    </div>
  )
}
