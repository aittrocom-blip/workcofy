const DAY_MS = 86_400_000

export function formatRelativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (days < 30) return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  return months <= 1 ? 'Hace 1 mes' : `Hace ${months} meses`
}
