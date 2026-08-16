/** Format whole minutes as "H h M min" (e.g. 510 → "8 h 30 min"). Units are passed in for i18n. */
export function formatHoursMinutes(
  totalMinutes: number,
  hourUnit: string,
  minuteUnit: string,
): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours)} ${hourUnit} ${String(minutes)} ${minuteUnit}`
}

/**
 * Like `formatHoursMinutes`, but drops a zero component: 480 → "8 h",
 * 58 → "58 min", 350 → "5 h 50 min". The dashboard reads back limits and
 * remainders in running text, where "8 h 0 min" would be noise.
 * Zero itself still renders as "0 {minuteUnit}".
 */
export function formatDurationCompact(
  totalMinutes: number,
  hourUnit: string,
  minuteUnit: string,
): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${String(minutes)} ${minuteUnit}`
  if (minutes === 0) return `${String(hours)} ${hourUnit}`
  return `${String(hours)} ${hourUnit} ${String(minutes)} ${minuteUnit}`
}
