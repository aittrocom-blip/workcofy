import type { SpaceRecord } from '@/lib/data/spaceTypes'

type TrustLevel = NonNullable<SpaceRecord['trust_level']>

const TRUST_LABELS: Record<TrustLevel, string> = {
  listed: 'Listado',
  community_recommended: 'Recomendado por la comunidad',
  workcofy_verified: 'Verificado por Workcofy',
  workcofy_point: 'Workcofy Point',
}

const TRUST_STYLES: Record<TrustLevel, string> = {
  listed: 'bg-gray-100 text-gray-600',
  community_recommended: 'bg-workcofy-yellow/20 text-workcofy-black',
  workcofy_verified: 'bg-workcofy-green/20 text-workcofy-black',
  workcofy_point: 'bg-black text-white',
}

export function TrustBadge({ level }: { level: NonNullable<SpaceRecord['trust_level']> }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TRUST_STYLES[level]}`}>
      {level === 'workcofy_verified' || level === 'workcofy_point' ? '✓ ' : ''}
      {TRUST_LABELS[level]}
    </span>
  )
}

export function trustLabel(level: NonNullable<SpaceRecord['trust_level']>): string {
  return TRUST_LABELS[level]
}
