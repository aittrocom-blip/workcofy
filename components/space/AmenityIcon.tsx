interface AmenityIconProps {
  name: string
  className?: string
}

const AMENITY_ICON_SRC: Record<string, string> = {
  wifi: '/icons/amenity-wifi.png',
  wifi_rapido: '/icons/amenity-wifi-rapido.png',
  enchufes: '/icons/amenity-enchufes.png',
  mesas_comodas: '/icons/amenity-mesas-comodas.png',
  iluminacion: '/icons/amenity-iluminacion.png',
  videollamadas: '/icons/amenity-videollamadas.png',
  zona_tranquila: '/icons/amenity-zona-tranquila.png',
  booth: '/icons/amenity-booth.png',
  cafe: '/icons/amenity-cafe.png',
  agua: '/icons/amenity-agua.png',
  banos: '/icons/amenity-banos.png',
  impresiones: '/icons/amenity-impresiones.png',
  pizarra: '/icons/amenity-pizarra.png',
  sala_reuniones: '/icons/amenity-sala-reuniones.png',
  proyector: '/icons/amenity-proyector.png',
  clima: '/icons/amenity-aire-acondicionado.png',
  estacionamiento: '/icons/amenity-estacionamiento.png',
  terraza: '/icons/amenity-terraza.png',
  pet_friendly: '/icons/amenity-pet-friendly.png',
  accesibilidad: '/icons/amenity-accesibilidad.png',
}

// One custom-drawn icon per amenity chip in the Amenities grid. Black
// artwork on a transparent background — pass an `invert` className (via the
// `filter` utility) when placed on a dark/"available" chip background.
export function AmenityIcon({ name, className = 'h-4 w-4' }: AmenityIconProps) {
  const src = AMENITY_ICON_SRC[name]
  if (!src) {
    // Never apply the caller's `invert` filter here: the dot already uses
    // bg-current (white on the black "available" chip), so inverting it
    // would turn it black and make it disappear against that background.
    const fallbackClassName = className.replace(/\binvert\b/g, '').trim()
    return (
      <span className={`${fallbackClassName} inline-block rounded-full bg-current opacity-60`} aria-hidden="true" />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`${className} object-contain`} />
}
