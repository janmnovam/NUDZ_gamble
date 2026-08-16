/**
 * The UI-owned clock. Every time-dependent service call now takes the instant as
 * an explicit parameter (the backend never reads a clock of its own), so views
 * decide *which* instant to pass: the real wall clock via `clientNow`, or a
 * simulated one via `isoForDay` when the demo time machine is engaged.
 *
 * Emits an **offset-bearing** ISO 8601 timestamp (local `+hh:mm`), not a
 * `Z`-normalized one: the backend derives "today" from the date component, so it
 * must carry the local offset or the day drifts near midnight (doc 02's timezone
 * warning; see `dateOf` in `@domain/clock.ts`).
 */
import type { ISOTimestamp } from '@domain/model.ts'

/** Format a `Date` as an offset-bearing ISO 8601 timestamp (local `+hh:mm`). */
function formatOffsetIso(d: Date): ISOTimestamp {
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

/** The real wall-clock instant, offset-bearing. The default "now" for every view. */
export function clientNow(): ISOTimestamp {
  return formatOffsetIso(new Date())
}

/**
 * Offset-bearing instant (local noon) for study `day` of an intervention that
 * started on `interventionStartDate` — day 1 is the start date itself, so day N
 * is start + (N − 1) days. Noon anchoring keeps the date stable across DST and
 * midnight; the backend derives the study day from this instant's date. The demo
 * time machine passes the result in place of `clientNow()` to simulate that day.
 */
export function isoForDay(interventionStartDate: ISOTimestamp, day: number): ISOTimestamp {
  const d = new Date(`${interventionStartDate.slice(0, 10)}T12:00:00`) // local noon of day 1
  d.setDate(d.getDate() + (day - 1))
  return formatOffsetIso(d)
}
