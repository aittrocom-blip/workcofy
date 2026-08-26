import Link from 'next/link'

export const metadata = {
  title: 'Página no encontrada | Workcofy',
}

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
      <h1 className="text-2xl font-bold md:text-3xl">Página no encontrada</h1>
      <p className="mt-3 text-gray-600">
        No pudimos encontrar lo que buscabas. Puede que el enlace esté roto o que el espacio ya no
        esté disponible.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-black px-5 py-2 text-sm font-medium text-white"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
