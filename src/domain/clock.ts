/**
 * Study-calendar port + implementation (doc 02) — day 1–28 / week 1–4
 * mapping.
 *
 * `TodayClock` is the only way domain code ever learns "today"; nothing in
 * this layer calls `new Date()` or `Date.now()` directly. It's named
 * distinctly from `Clock` in `ports.ts` (`() => ISOTimestamp`, used to stamp
 * `created_at`/`submitted_at` on writes) — the two answer different
 * questions and must never be conflated: a record timestamp is a UTC
 * instant, "today" is a local calendar date (doc 02's timezone warning is
 * exactly about not blurring these two).
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
import type { ISODate } from '@domain/model.ts'

/** Injected "today" source — real clock in production, fixed/offset clock in tests and the demo drawer. */
export interface TodayClock {
  today(): ISODate
}

/**
 * 1..28 while the programme runs.
 * ≤ 0: onboarding done, day 1 hasn't started yet.
 * > 28: programme finished, final summary applies.
 */
export type StudyDay = number

/** 1..4. */
export type WeekNo = number

export interface StudyCalendar {
  /** `(date - intervention_start_date) + 1`, whole calendar days. */
  studyDay(date: ISODate): StudyDay
  /** `ceil(day / 7)`. Throws on `day <= 0` — there is no week 0; callers must guard before calling. */
  weekNo(day: StudyDay): WeekNo
  /** Calendar date for a given study day. */
  dateOf(day: StudyDay): ISODate
  /** First study day of a week: `7*(week-1) + 1`. */
  firstDay(week: WeekNo): StudyDay
  /** Last study day of a week: `7*week`. */
  lastDay(week: WeekNo): StudyDay
  /** `studyDay(today())`. */
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

/** Pure implementation of `StudyCalendar` for one user's `intervention_start_date`. */
export function createStudyCalendar(
  intervention_start_date: ISODate,
  clock: TodayClock,
  config: DomainConfig = DEFAULT_CONFIG,
): StudyCalendar {
  const startMs = toUtcMs(intervention_start_date)
  const { WEEK_LENGTH_DAYS, PROGRAMME_DAYS } = config

  const studyDay = (date: ISODate): StudyDay =>
    Math.round((toUtcMs(date) - startMs) / MS_PER_DAY) + 1

  const weekNo = (day: StudyDay): WeekNo => {
    if (day <= 0) {
      throw new RangeError(`weekNo: study day ${String(day)} is before day 1 — there is no week 0`)
    }
    return Math.ceil(day / WEEK_LENGTH_DAYS)
  }

  const dateOf = (day: StudyDay): ISODate => fromUtcMs(startMs + (day - 1) * MS_PER_DAY)

  const firstDay = (week: WeekNo): StudyDay => WEEK_LENGTH_DAYS * (week - 1) + 1

  const lastDay = (week: WeekNo): StudyDay => WEEK_LENGTH_DAYS * week

  const currentDay = (): StudyDay => studyDay(clock.today())

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
