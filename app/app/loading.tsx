function Placeholder({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
}

// Route-level loading UI: Next renders this immediately while the server
// fetches spaces, rewards, courses and the member profile for Explorar.
export default function ExplorarLoading() {
  return (
    <main aria-busy="true" aria-label="Cargando Explorar" className="mx-auto max-w-6xl px-4 pb-8 pt-6 md:px-8 md:pt-10">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-workcofy-yellow/20">
          <span className="h-5 w-5 rounded-full bg-workcofy-yellow animate-pulse" />
        </span>
        <div className="space-y-2"><Placeholder className="h-7 w-44" /><Placeholder className="h-4 w-56" /></div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Preparando tu día</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3 md:gap-3">
          <Placeholder className="h-24 md:h-28" />
          <Placeholder className="h-24 md:h-28" />
          <Placeholder className="h-24 md:h-28" />
        </div>
      </div>

      <section className="mt-7 border-y border-gray-100 py-4">
        <Placeholder className="h-3 w-24" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((item) => <Placeholder key={item} className="h-20 w-20 flex-none rounded-2xl" />)}
        </div>
      </section>

      <section className="mt-10">
        <Placeholder className="h-6 w-28" />
        <Placeholder className="mt-2 h-4 w-48" />
        <div className="mt-4 flex gap-3 overflow-hidden">
          {[1, 2, 3].map((item) => <div key={item} className="w-[168px] flex-none"><Placeholder className="h-32 w-full" /><Placeholder className="mt-3 h-4 w-3/4" /><Placeholder className="mt-2 h-3 w-1/2" /></div>)}
        </div>
      </section>
    </main>
  )
}
