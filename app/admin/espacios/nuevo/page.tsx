import Link from 'next/link'
import { NewSpaceForm } from './NewSpaceForm'

export default function NewSpacePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin/espacios" className="text-sm text-gray-500 hover:text-black">
        ← Espacios
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Agregar espacio</h1>
      <p className="mt-1 text-sm text-gray-500">
        Solo lo esencial para crearlo — el resto (fotos, horario, teléfono, amenities) se completa
        después en la ficha del espacio.
      </p>

      <NewSpaceForm />
    </div>
  )
}
