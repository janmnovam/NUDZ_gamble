/**
 * Daily check-in (doc 05) — the record shape, its validation, and the
 * derived day states the dashboard and CSV export both key off. Pure types
 * and signatures only; implementations are plain functions, no I/O — the
 * app-service layer is the one that persists the result.
 */
import { calendarDate, nextDate } from '@domain/clock.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'

/** What the check-in form collects before it becomes a `CheckIn` record. */
export interface CheckInDraft {
  behaviorDate: ISOCalendarTimestamp
  played: boolean
  /** Forced to 0 when `played` is false — the form shouldn't even show these fields then. */
  timeMin: number
  stakesCzk: number
  winningsCzk: number
}

export type CheckInFieldErrorField = keyof CheckInDraft

export interface CheckInFieldError {
  field: CheckInFieldErrorField
  message: string
}

export type CheckInValidation = { valid: true } | { valid: false; errors: CheckInFieldError[] }

/**
 * Doc 05's validation table: numeric bounds, `played=false ⟹ all zero`, and
 * `behaviorDate` must fall in the current week and be ≤ `today − 1`.
 * `weekFirstDay` comes from `StudyCalendar.dateOf(firstDay(currentWeek()))`.
 */
export type ValidateCheckIn = (
  draft: CheckInDraft,
  context: { today: ISODate; weekFirstDay: ISOCalendarTimestamp },
) => CheckInValidation

/** Pure command handler: a validated draft + `now` → the record to persist (upsert on `behaviorDate`). */
export type SubmitCheckIn = (
  userId: UserId,
  draft: CheckInDraft,
  weekNo: number,
  now: ISOTimestamp,
  existing?: CheckIn,
) => CheckIn

/** A day's presentation state. Never confuse `missing` (no record) with a zero-filled record. */
export type DayState = 'completed' | 'backfilled' | 'missing' | 'future'

/** Derived, never stored: `date(submittedAt) > date(behaviorDate) + 1 day`. */
export type IsBackfill = (behaviorDate: ISOCalendarTimestamp, submittedAt: ISOTimestamp) => boolean

export const isBackfill: IsBackfill = (behaviorDate, submittedAt) =>
  calendarDate(submittedAt) > nextDate(calendarDate(behaviorDate))

/** `future` if `date(behaviorDate) > today − 1`; missing if no record and not future. */
export type DayStateOf = (params: {
  behaviorDate: ISOCalendarTimestamp
  today: ISODate
  checkIn: CheckIn | undefined
}) => DayState

/**
 * `date(behaviorDate) > today − 1` is equivalent to `date(behaviorDate) >= today`
 * for whole calendar dates, so no separate "yesterday" arithmetic is needed.
 */
export const dayStateOf: DayStateOf = ({ behaviorDate, today, checkIn }) => {
  if (calendarDate(behaviorDate) >= today) return 'future'
  if (!checkIn) return 'missing'
  return isBackfill(behaviorDate, checkIn.submittedAt) ? 'backfilled' : 'completed'
}
