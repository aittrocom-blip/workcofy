import { MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL } from '@/lib/rewards/constants'
import type { Mission } from '@/lib/data/missions'
import type { RewardEvent } from '@/lib/data/rewards'

interface RewardsPanelProps {
  balance: number
  events: RewardEvent[]
  missions: Mission[]
  completedMissionKeys: Set<string>
  cartaEspecialCompletedThisMonth: number
}

export function RewardsPanel({
  balance,
  events,
  missions,
  completedMissionKeys,
  cartaEspecialCompletedThisMonth,
}: RewardsPanelProps) {
  const remaining = Math.max(0, MISSIONS_REQUIRED_FOR_CARTA_ESPECIAL - cartaEspecialCompletedThisMonth)

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Tus Rewards</h2>
        <p className="mt-1 flex items-center gap-1.5 text-2xl font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/w-coins.png" alt="" className="h-5 w-5" />
          {balance}
        </p>

        {events.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
              >
                <span>
                  {event.label}
                  {event.spaceName && <span className="text-gray-400"> · {event.spaceName}</span>}
                </span>
                <span className="font-semibold text-workcofy-black">+{event.coins}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {missions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold tracking-tight">Misiones</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {missions.map((mission) => {
              const done = completedMissionKeys.has(mission.key)
              return (
                <li
                  key={mission.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-2.5 text-sm"
                >
                  <span>
                    {mission.label}
                    <span className="ml-2 text-xs text-gray-400">{done ? 'Completada' : 'Pendiente'}</span>
                  </span>
                  <span className="font-semibold text-workcofy-black">+{mission.coins}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold tracking-tight">Carta especial</h2>
        <p className="mt-2 text-sm text-gray-600">
          {remaining === 0
            ? 'Desbloqueada este mes — ya puedes verla en los espacios partner que la ofrecen.'
            : `Completa ${remaining} misión${remaining === 1 ? '' : 'es'} más este mes para desbloquearla.`}
        </p>
      </div>
    </div>
  )
}
