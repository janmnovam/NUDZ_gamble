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
