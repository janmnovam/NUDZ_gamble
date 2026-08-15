import type { Clock } from '@domain/ports.ts'
import type { TodayClock } from '@domain/clock.ts'

/** Default clock adapter: real wall-clock time as an ISO 8601 string. */
export const systemNow: Clock = () => new Date().toISOString()

/**
 * Default "today" adapter: the host's local calendar date, `YYYY-MM-DD`.
 * Deliberately not `new Date().toISOString().slice(0, 10)` — `toISOString`
 * is UTC, so near midnight that silently reports the wrong calendar day in
 * any timezone ahead of UTC (doc 02's timezone warning).
 */
export const systemTodayClock: TodayClock = {
  today: () => {
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
}
