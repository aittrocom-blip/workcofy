import Link from 'next/link'

const BENEFITS = [
  ['/icons/nav-explorar.png', 'Descubre espacios', 'Encuentra cafés, coworkings, hoteles y bibliotecas para trabajar cerca de ti.'],
  ['/icons/logo-partner.png', 'Beneficios Partner', 'Accede a descuentos y promociones especiales mostrando tu Workcofy Pass.'],
  ['/icons/rewards-coin.png', 'Gana W Coins', 'Suma puntos con check-ins, reseñas útiles, trivias y misiones mensuales.'],
  ['/icons/discover-trivia.png', 'Participa y desbloquea', 'Compite en la trivia diaria y canjea tus W Coins por premios limitados.'],
  ['/icons/discover-musica.png', 'Concéntrate mejor', 'Escucha playlists seleccionadas para concentración, lectura y trabajo profundo.'],
  ['/icons/nav-equipos.png', 'Crece profesionalmente', 'Explora trabajos remotos y cursos para desarrollar nuevas habilidades.'],
  ['/icons/parking-map-marker-blue.png', 'Llega con facilidad', 'Consulta estacionamientos cercanos a los espacios que quieres visitar.'],
  ['/icons/fav-outline.png', 'Guarda tus favoritos', 'Crea tu propia lista de lugares, oportunidades, cursos y playlists.'],
] as const

export function UserBenefitsSection() {
  return (
    <section className="wc-section bg-gray-50/70">
      <div className="mx-auto max-w-3xl text-center">
        <p className="wc-eyebrow">Tu ecosistema para trabajar mejor</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">Todo lo que puedes hacer como usuario</h2>
        <p className="mt-3 text-gray-600">Regístrate gratis y reúne en un solo lugar tus espacios, oportunidades, beneficios y herramientas para el día a día.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-workcofy-yellow/20 p-2" aria-hidden="true"><img src={icon} alt="" className="h-full w-full object-contain" /></span>
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center"><Link href="/registro" className="wc-button-primary">Crear mi cuenta gratis</Link></div>
    </section>
  )
}
