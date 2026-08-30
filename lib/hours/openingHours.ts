export interface OpeningPeriod {
  open: { day: number; time: string } // day: 0=Sunday..6=Saturday, time: "HHMM"
  close: { day: number; time: string } | null // null = open 24h that day
}

export interface OpeningHours {
  periods: OpeningPeriod[]
}

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function timeToMinutes(time: string): number {
  return parseInt(time.slice(0, 2), 10) * 60 + parseInt(time.slice(2), 10)
}

export function isOpenNow(hours: OpeningHours | null | undefined, now: Date): boolean {
  if (!hours || hours.periods.length === 0) return false
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()

  return hours.periods.some((period) => {
    if (!period.close) return period.open.day === day
    const openDay = period.open.day
    const closeDay = period.close.day
    const openMinutes = timeToMinutes(period.open.time)
    const closeMinutes = timeToMinutes(period.close.time)

    if (openDay === closeDay) {
      return day === openDay && minutes >= openMinutes && minutes < closeMinutes
    }
    if (day === openDay && minutes >= openMinutes) return true
    if (day === closeDay && minutes < closeMinutes) return true
    return false
  })
}

// Whether a space is open continuously across the given [startTime, endTime)
// window on today's day of week — used by the "horario específico" filter.
// "Continuously" (not just "open at some point in the range") matches what
// someone filtering by a work window actually wants: don't show a space
// that closes partway through.
export function isOpenDuring(
  hours: OpeningHours | null | undefined,
  now: Date,
  startTime: string,
  endTime: string
): boolean {
  if (!hours || hours.periods.length === 0) return false
  const day = now.getDay()
  const startMinutes = timeToMinutes(startTime.replace(':', ''))
  const endMinutes = timeToMinutes(endTime.replace(':', ''))

  return hours.periods.some((period) => {
    if (period.open.day !== day) return false
    if (!period.close) return true // open 24h that day
    if (period.close.day !== day) return true // stays open past midnight, covers the rest of today
    const openMinutes = timeToMinutes(period.open.time)
    const closeMinutes = timeToMinutes(period.close.time)
    return openMinutes <= startMinutes && closeMinutes >= endMinutes
  })
}

export function formatPeriodForDay(hours: OpeningHours | null | undefined, day: number): string {
  if (!hours) return 'Horario no disponible'
  const period = hours.periods.find((p) => p.open.day === day)
  if (!period) return 'Cerrado'
  if (!period.close) return 'Abierto 24 horas'
  const format = (t: string) => `${t.slice(0, 2)}:${t.slice(2)}`
  return `${format(period.open.time)} – ${format(period.close.time)}`
}
