import Link from 'next/link'
import { NewSpaceForm } from './NewSpaceForm'

// createSpaceAction (this page's Server Action) downloads up to 10 Google
// photos and re-hosts them in Supabase Storage before redirecting — even
// parallelized (see downloadAndUploadPlacePhotos) that can outrun a
// serverless function's default time limit on a slow connection, which
// killed the request mid-flight with a generic 500 even though the space
// row had already been created. 60s matches the cron routes' own
// maxDuration and comfortably covers it. A route segment's maxDuration
// applies to Server Actions defined in files it imports, which is why this
// lives here rather than in actions.ts itself — a 'use server' file may
// only export async functions.
export const maxDuration = 60

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
