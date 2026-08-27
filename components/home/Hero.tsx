import Link from 'next/link'
import { SearchBox } from '@/components/home/SearchBox'

export function Hero() {
  return (
    <section className="px-4 py-16 text-center md:px-8 md:py-24">
      <h1 className="mx-auto max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
        Encuentra tu mejor lugar para <span className="text-workcofy-yellow">trabajar</span>.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 md:text-lg">
        Espacios descubiertos, evaluados y verificados por nuestra comunidad.
      </p>
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
