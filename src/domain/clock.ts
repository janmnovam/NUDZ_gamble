/**
 * Study-calendar port + implementation (doc 02) — day 1–28 / week 1–4
 * mapping.
 *
 * Time enters the domain as a plain `ISOTimestamp` value the caller passes in
 * per request (the FE reads its own clock); nothing in this layer calls
 * `new Date()` or `Date.now()`. "Today" is not a separate source — it's the
 * calendar date of that instant, taken with `calendarDate` (an offset-preserving
 * slice, doc 02's timezone warning): the caller must supply an offset-bearing
 * instant so the day is the user's local day, not the UTC day.
 *
 * `createStudyCalendar` is the pure conversion layer built on top of it —
 * one method per formula in the spec, zero I/O, calendar arithmetic done in
 * UTC-anchored day counts so DST never enters into it.
 *
 * Deliberately excludes week-closed / review-availability: closing a week
 * is driven by a completed review record, not the calendar (doc 09's
 * "ordering trap") — that check lives in guards.ts instead.
 */
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import type { ISOCalendarTimestamp, ISODate, ISOTimestamp } from '@domain/model.ts'

/**
 * 1..28 while the programme runs.
 * ≤ 0: onboarding done, day 1 hasn't started yet.
 * > 28: programme finished, final summary applies.
 */
export type StudyDay = number

/** 1..4. */
export type WeekNo = number

export interface StudyCalendar {
  /** `(date - interventionStartDate) + 1`, whole calendar days. */
  studyDay(date: string): StudyDay
  /** `ceil(day / 7)`. Throws on `day <= 0` — there is no week 0; callers must guard before calling. */
  weekNo(day: StudyDay): WeekNo
  /** Canonical day-start timestamp for a given study day. */
  dateOf(day: StudyDay): ISOCalendarTimestamp
  /** First study day of a week: `7*(week-1) + 1`. */
  firstDay(week: WeekNo): StudyDay
  /** Last study day of a week: `7*week`. */
  lastDay(week: WeekNo): StudyDay
  /** `studyDay(time)` — the study day the caller's instant falls on. */
  currentDay(): StudyDay
  /** `weekNo(currentDay())`. Throws if `currentDay() <= 0` — check that (or `isFinalSummary`) first. */
  currentWeek(): WeekNo
  /** `currentDay() > lastDay(week)` — the week's 7 days have all elapsed. */
  isWeekElapsed(week: WeekNo): boolean
  /** `currentDay() > 28`. */
  isFinalSummary(): boolean
}

const MS_PER_DAY = 86_400_000

/**
 * `YYYY-MM-DD` → a UTC-midnight instant. Anchoring in UTC (not the host's
 * local timezone) makes day-count arithmetic immune to DST transitions —
 * the input is already a calendar date, not a timezone-bearing instant, so
 * there's no local offset to get wrong.
 */
function toUtcMs(date: ISODate): number {
  const parts = date.split('-')
  if (parts.length !== 3) {
    throw new RangeError(`toUtcMs: not an ISO date (YYYY-MM-DD): ${date}`)
  }
  const [year, month, day] = parts.map(Number) as [number, number, number]
  return Date.UTC(year, month - 1, day)
}

function fromUtcMs(ms: number): ISODate {
  const d = new Date(ms)
  const year = String(d.getUTCFullYear())
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Calendar date carried by either a `YYYY-MM-DD` date or an ISO timestamp. */
export function calendarDate(value: string): ISODate {
  return value.slice(0, 10)
}

/** Canonical timestamp for a calendar day stored as a timestamp-valued field. */
export function calendarTimestamp(date: ISODate): ISOCalendarTimestamp {
  return `${date}T00:00:00.000Z`
}

/** Canonical day-start timestamp for either an old date-only value or a timestamp. */
export function canonicalCalendarTimestamp(value: string): ISOCalendarTimestamp {
  return calendarTimestamp(calendarDate(value))
}

/**
 * The calendar date after `date` (DST-immune, same UTC-anchored arithmetic as
 * the rest of this module). Both inputs and outputs are bare `YYYY-MM-DD`, so
 * this stays a pure calendar step with no timezone in play.
 */
export function nextDate(date: ISODate): ISODate {
  return fromUtcMs(toUtcMs(date) + MS_PER_DAY)
}

/**
 * The calendar date an ISO 8601 timestamp falls on, **in the timestamp's own
 * timezone** — a plain string slice, deliberately NOT `new Date(ts).toISOString()`,
 * which re-normalizes to UTC and reports the wrong local day near midnight
 * (doc 02's timezone warning). This is how the backend derives "today" now that
 * callers pass a single instant: the caller MUST supply an offset-bearing instant
 * (local `+hh:mm`), not a `Z`-normalized one, or the date comes back as the UTC day.
 */
export function dateOf(timestamp: ISOTimestamp): ISODate {
  return timestamp.slice(0, 10)
}

/** Pure implementation of `StudyCalendar` for one user's `interventionStartDate`. */
export function createStudyCalendar(
  interventionStartDate: ISOCalendarTimestamp,
  time: ISOTimestamp,
  config: DomainConfig = DEFAULT_CONFIG,
): StudyCalendar {
  const startMs = toUtcMs(calendarDate(interventionStartDate))
  const { WEEK_LENGTH_DAYS, PROGRAMME_DAYS } = config

  const studyDay = (date: string): StudyDay =>
    Math.round((toUtcMs(calendarDate(date)) - startMs) / MS_PER_DAY) + 1

  const weekNo = (day: StudyDay): WeekNo => {
    if (day <= 0) {
      throw new RangeError(`weekNo: study day ${String(day)} is before day 1 — there is no week 0`)
    }
    return Math.ceil(day / WEEK_LENGTH_DAYS)
  }

  const dateOf = (day: StudyDay): ISOCalendarTimestamp =>
    calendarTimestamp(fromUtcMs(startMs + (day - 1) * MS_PER_DAY))

  const firstDay = (week: WeekNo): StudyDay => WEEK_LENGTH_DAYS * (week - 1) + 1

  const lastDay = (week: WeekNo): StudyDay => WEEK_LENGTH_DAYS * week

  const currentDay = (): StudyDay => studyDay(time)

  const currentWeek = (): WeekNo => weekNo(currentDay())

  const isWeekElapsed = (week: WeekNo): boolean => currentDay() > lastDay(week)

  const isFinalSummary = (): boolean => currentDay() > PROGRAMME_DAYS

  return {
    studyDay,
    weekNo,
    dateOf,
    firstDay,
    lastDay,
    currentDay,
    currentWeek,
    isWeekElapsed,
    isFinalSummary,
  }
}
