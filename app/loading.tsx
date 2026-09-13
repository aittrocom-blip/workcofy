export default function Loading() {
  return (
    <main className="flex min-h-[45vh] items-center justify-center px-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-black" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-500">Cargando Workcofy…</p>
      </div>
    </main>
  )
}
