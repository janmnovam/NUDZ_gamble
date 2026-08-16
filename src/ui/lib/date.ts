import type { ISOCalendarTimestamp } from '@domain/model.ts'

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
