import Link from 'next/link'
import { SearchBox } from '@/components/home/SearchBox'

export function Hero() {
  return (
    <section className="px-4 py-10 text-center md:px-8 md:py-16">
      <h1 className="text-3xl font-bold md:text-5xl">Encuentra dónde trabajar, reunirte y crear.</h1>
      <p className="mt-3 text-gray-600 md:text-lg">Descubre cafés y espacios Work-Friendly cerca de ti.</p>
      <div className="mx-auto mt-6 max-w-xl">
        <SearchBox />
      </div>
      <div className="mt-4 flex justify-center gap-3 text-sm">
        <Link href="/miraflores" className="rounded-full border border-gray-300 px-4 py-1.5">
          Miraflores
        </Link>
        <Link href="/san-isidro" className="rounded-full border border-gray-300 px-4 py-1.5">
          San Isidro
        </Link>
        <Link href="/barranco" className="rounded-full border border-gray-300 px-4 py-1.5">
          Barranco
        </Link>
      </div>
    </section>
  )
}
