export const LIMA_TIME_ZONE = 'America/Lima'

const limaPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: LIMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/**
 * Returns a Date whose LOCAL getters (`getDay()`, `getHours()`, `getMinutes()`, ...)
 * report Lima wall-clock values, regardless of the host's system timezone.
 *
 * Opening-hours logic (`isOpenNow`, `formatPeriodForDay`) reads local getters, so a
 * server running on UTC — the default on most hosts, including Vercel — would
 * otherwise report "Abierto ahora" and today's-hours highlighting five hours ahead
 * of the Lima visitors the app serves.
 *
 * The Lima wall-clock components are extracted via `Intl.DateTimeFormat` and then
 * re-encoded into a plain local Date. The resulting Date does NOT represent the
 * correct instant in time — it is only meant to be read through its local getters.
 */
export function getLimaNow(instant: Date = new Date()): Date {
  const parts = limaPartsFormatter.formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value
    return value ? parseInt(value, 10) : 0
  }

  // Intl renders midnight as hour "24" in some engines under hour12: false.
  const hour = get('hour') % 24

  return new Date(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
}
