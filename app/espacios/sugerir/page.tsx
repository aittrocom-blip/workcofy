import type { Metadata } from 'next'
import Link from 'next/link'
import { SuggestSpaceForm } from '@/components/space/SuggestSpaceForm'

export const metadata: Metadata = {
  title: 'Sugerir un local | Workcofy',
  description: '¿No encuentras un espacio para trabajar? Sugiérelo y lo revisamos.',
}

export default function SugerirEspacioPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <Link href="/espacios" className="text-sm text-gray-500 hover:text-black">
        ← Spots
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
        ¿No encuentras un espacio?
      </h1>
      <p className="mt-2 text-gray-600">Cuéntanos cuál y lo revisamos para sumarlo a Workcofy.</p>

      <div className="mt-8">
        <SuggestSpaceForm />
      </div>
    </div>
  )
}
