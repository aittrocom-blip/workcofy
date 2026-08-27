import Link from 'next/link'
import { SearchBox } from '@/components/home/SearchBox'

export function Hero() {
  return (
    <section className="px-4 py-16 text-center md:px-8 md:py-24">
      <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
        Encuentra dónde trabajar, reunirte y crear.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 md:text-lg">
        Descubre cafés y espacios Work-Friendly cerca de ti.
      </p>
      <div className="mx-auto mt-8 max-w-xl">
        <SearchBox />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
        <Link
          href="/miraflores"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          Miraflores
        </Link>
        <Link
          href="/san-isidro"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          San Isidro
        </Link>
        <Link
          href="/barranco"
          className="rounded-full border border-gray-200 px-4 py-1.5 font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          Barranco
        </Link>
      </div>
    </section>
  )
}
