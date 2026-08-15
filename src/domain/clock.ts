/**
 * Study-calendar port (doc 02) — day 1–28 / week 1–4 mapping.
 *
 * `Clock` is the only way domain code ever learns "today"; nothing in this
 * layer calls `new Date()` or `Date.now()` directly. `StudyCalendar` is the
 * pure conversion layer built on top of it — one method per formula in the
 * spec, zero I/O.
 *
 * Deliberately excludes week-closed / review-availability: closing a week
 * is driven by a completed review record, not the calendar (doc 09's
 * "ordering trap") — that check lives in guards.ts instead.
 */
import type { ISODate } from '@domain/model.ts'

/** Injected time source — real clock in production, fixed/offset clock in tests and the demo drawer. */
export interface Clock {
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
  /** `ceil(day / 7)`. Caller must guard `day <= 0` — there is no week 0. */
  weekNo(day: StudyDay): WeekNo
  /** Calendar date for a given study day. */
  dateOf(day: StudyDay): ISODate
  /** First study day of a week: `7*(week-1) + 1`. */
  firstDay(week: WeekNo): StudyDay
  /** Last study day of a week: `7*week`. */
  lastDay(week: WeekNo): StudyDay
  /** `studyDay(today())`. */
  currentDay(): StudyDay
  /** `weekNo(currentDay())`. */
  currentWeek(): WeekNo
  /** `currentDay() > lastDay(week)` — the week's 7 days have all elapsed. */
  isWeekElapsed(week: WeekNo): boolean
  /** `currentDay() > 28`. */
  isFinalSummary(): boolean
}
