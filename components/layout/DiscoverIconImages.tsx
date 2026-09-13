import type { IconProps } from '@/components/layout/DiscoverIcons'

// The DESCUBRIR grid's real icon set (client-supplied artwork), swapped in
// for the hand-drawn DiscoverIcons.tsx placeholders. Same IconProps shape
// so DiscoverGrid's <Icon className=".."/> call doesn't need to change.
function discoverImageIcon(src: string) {
  return function DiscoverImageIcon({ className = 'h-6 w-6' }: IconProps) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${className} object-contain`} />
  }
}

export const BeneficiosIcon = discoverImageIcon('/icons/discover-beneficios.png')
export const DescuentosIcon = discoverImageIcon('/icons/discover-descuentos.png')
export const SuscripcionesIcon = discoverImageIcon('/icons/discover-suscripciones.png')
export const EventosIcon = discoverImageIcon('/icons/discover-eventos.png')
export const TriviaImageIcon = discoverImageIcon('/icons/discover-trivia.png')
export const TankSharkIcon = discoverImageIcon('/icons/discover-tank-shark.png')
export const MusicaIcon = discoverImageIcon('/icons/discover-musica.png')
export const RetosIcon = discoverImageIcon('/icons/discover-retos.png')
export const ReservasIcon = discoverImageIcon('/icons/discover-reservas.png')
