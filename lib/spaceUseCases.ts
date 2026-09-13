import type { SpaceRecord } from '@/lib/data/spaceTypes'

export type SpaceUseCase = 'focus' | 'meetings' | 'social'

export const SPACE_USE_CASES: { value: SpaceUseCase; label: string; shortLabel: string; description: string }[] = [
  { value: 'focus', label: 'Concentrarme', shortLabel: 'Concentrarte', description: 'Tranquilo, cómodo y con lo básico para avanzar.' },
  { value: 'meetings', label: 'Tener una reunión', shortLabel: 'Reuniones', description: 'Mesas y condiciones para conversar o hacer llamadas.' },
  { value: 'social', label: 'Trabajar y socializar', shortLabel: 'Trabajo + social', description: 'Un ambiente activo para trabajar y conectar.' },
]

export function getSpaceUseCases(space: SpaceRecord): SpaceUseCase[] {
  const amenities = space.amenities
  const recommended = (space.recommended_for ?? []).join(' ').toLowerCase()
  const cases: SpaceUseCase[] = []
  if (
    recommended.includes('concentr') || recommended.includes('focus') ||
    amenities.ambiente === 'tranquilo' || amenities.ambiente === 'muy_silencioso' ||
    amenities.para_trabajar.enchufes === true || amenities.para_trabajar.wifi_rapido === true ||
    amenities.para_llamadas.zona_tranquila === true
  ) cases.push('focus')
  if (
    recommended.includes('reuni') || recommended.includes('meeting') ||
    amenities.para_llamadas.videollamadas === true || amenities.para_llamadas.booth === true ||
    amenities.para_llamadas.sala_reuniones === true || amenities.servicios.pizarra === true ||
    amenities.servicios.pantalla_tv === true || amenities.servicios.proyector === true ||
    amenities.tipo_espacio.includes('mesa_grupal') || amenities.tipo_espacio.includes('sala_privada')
  ) cases.push('meetings')
  if (
    recommended.includes('social') || recommended.includes('conocer') ||
    amenities.ambiente === 'animado' || amenities.servicios.terraza === true ||
    amenities.servicios.pet_friendly === true || amenities.tipo_espacio.includes('terraza_exterior')
  ) cases.push('social')
  return cases
}

export function spaceMatchesUseCase(space: SpaceRecord, useCase: SpaceUseCase): boolean {
  return getSpaceUseCases(space).includes(useCase)
}
