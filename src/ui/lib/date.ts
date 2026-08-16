import { type ISOCalendarTimestamp } from '@domain/model.ts'

/**
 * Calendar helpers for `ISOCalendarTimestamp` — an ISO timestamp pinned to UTC
 * midnight (`2026-08-17T00:00:00.000Z`) that models a calendar day.
 *
 * The calendar day is therefore the value's **UTC** date. Reading it in local
 * time would shift a whole column of the week strip to the previous day for any
 * viewer west of Greenwich, so the parts are read in UTC and only then rebuilt
 * as a local date for formatting.
 *
 * A bare `YYYY-MM-DD` also parses as UTC midnight, so both forms work.
 */
function toCalendarDate(value: ISOCalendarTimestamp): Date {
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) {
    throw new RangeError(`Not an ISO calendar timestamp: ${value}`)
  }
  return new Date(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate())
}

/** Day of the month, e.g. "2026-09-07T00:00:00.000Z" → 7. */
export function dayOfMonth(value: ISOCalendarTimestamp): number {
  return toCalendarDate(value).getDate()
}

/**
 * Short weekday name for a locale, e.g. → "út" (cs) / "Tue" (en). Rendered
 * through `.type-overline`, which uppercases it in CSS — so the lowercase Czech
 * form `Intl` returns is intentional, not a bug.
 */
export function weekdayAbbrev(value: ISOCalendarTimestamp, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(toCalendarDate(value))
}

/**
 * Czech "on {weekday}" phrases, indexed by `Date.getDay()` (0 = Sunday). Czech
 * needs the accusative and the right `v`/`ve` preposition ("ve středu",
 * "v sobotu"), which `Intl` can't produce — so the seven forms are spelled out.
 */
const CS_WEEKDAY_IN = [
  'v neděli',
  'v pondělí',
  'v úterý',
  've středu',
  've čtvrtek',
  'v pátek',
  'v sobotu',
] as const

/**
 * A localized "on {weekday} {day}" phrase for a specific calendar day, e.g.
 * "v úterý 18" (cs) / "on Tuesday 18" (en) — used when a check-in covers a day
 * other than yesterday and the question has to name it. Other locales fall back
 * to Intl's long weekday with an English "on".
 */
export function dayInWords(value: ISOCalendarTimestamp, locale: string): string {
  const date = toCalendarDate(value)
  const day = String(date.getDate())
  if (locale.startsWith('cs')) {
    // getDay() is always 0..6, so the lookup is total; the `?? ''` only satisfies
    // noUncheckedIndexedAccess and never actually fires.
    const weekdayIn = CS_WEEKDAY_IN[date.getDay()] ?? ''
    return `${weekdayIn} ${day}`.trim()
  }
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)
  return `on ${weekday} ${day}`
}
