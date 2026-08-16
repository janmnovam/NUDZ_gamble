/**
 * The UI-owned clock: the single instant every time-dependent service call
 * passes to the backend, so the backend never reads a clock of its own. The demo
 * drawer will later swap this for an advanceable time-machine source — no call
 * site or backend code changes when it does.
 *
 * Emits an **offset-bearing** ISO 8601 timestamp (local `+hh:mm`), not a
 * `Z`-normalized one: the backend derives "today" from the date component, so it
 * must carry the local offset or the day drifts near midnight (doc 02's timezone
 * warning; see `dateOf` in `@domain/clock.ts`).
 */
import type { ISOTimestamp } from '@domain/model.ts'
import type { Clock } from '@domain/ports.ts'

export function clientNow(): ISOTimestamp {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetMin = -d.getTimezoneOffset() // minutes east of UTC
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  const date = `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(
    d.getMilliseconds(),
  ).padStart(3, '0')}`
  return `${date}T${time}${offset}`
}

/**
 * The FE wall clock as the `Clock` the not-yet-refactored services still expect
 * (checkin / dashboard / review / reminder), passed to `createApp`. It reads the
 * offset-bearing `clientNow`, so the study calendar derives the user's local day.
 * Temporary bridge until those services take the instant per request like
 * onboarding / coping already do.
 */
export const uiClock: Clock = clientNow
