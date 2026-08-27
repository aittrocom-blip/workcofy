export function VerifiedExplainer() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 md:p-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-workcofy-yellow/20 px-3 py-1 text-xs font-semibold text-workcofy-black">
          ✓ Workcofy Verified
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
          Workcofy comprobó que estos espacios cumplen nuestros estándares mínimos para trabajar.
        </h2>
        <p className="mt-2 max-w-2xl text-gray-500">
          No todos los lugares del mapa están verificados — seguimos mostrando los espacios
          descubiertos y evaluados por la comunidad. El sello Verified indica, además, que
          Workcofy visitó el lugar y confirmó puntos concretos como wifi, enchufes o zona
          tranquila.
        </p>
      </div>
    </section>
  )
}
