/**
 * Daily check-in (doc 05) — the record shape, its validation, and the
 * derived day states the dashboard and CSV export both key off. Pure types
 * and signatures only; implementations are plain functions, no I/O — the
 * app-service layer is the one that persists the result.
 */
import { nextDate } from '@domain/clock.ts'
import type { CheckIn, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'

/** What the check-in form collects before it becomes a `CheckIn` record. */
export interface CheckInDraft {
  behaviorDate: ISODate
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
  context: { today: ISODate; weekFirstDay: ISODate },
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

/** Derived, never stored: `date(submittedAt) > behaviorDate + 1 day`. */
export type IsBackfill = (behaviorDate: ISODate, submittedAt: ISOTimestamp) => boolean

/** The calendar date a timestamp was recorded on, in the offset it carries. */
const dateOfTimestamp = (timestamp: ISOTimestamp): ISODate => timestamp.slice(0, 10)

export const isBackfill: IsBackfill = (behaviorDate, submittedAt) =>
  dateOfTimestamp(submittedAt) > nextDate(behaviorDate)

/** `future` if `behaviorDate > today − 1`; `missing` if no record and not future; else completed/backfilled. */
export type DayStateOf = (params: {
  behaviorDate: ISODate
  today: ISODate
  checkIn: CheckIn | undefined
}) => DayState

/**
 * `behaviorDate > today − 1` is equivalent to `behaviorDate >= today` for
 * whole calendar dates, so no separate "yesterday" arithmetic is needed.
 */
export const dayStateOf: DayStateOf = ({ behaviorDate, today, checkIn }) => {
  if (behaviorDate >= today) return 'future'
  if (!checkIn) return 'missing'
  return isBackfill(behaviorDate, checkIn.submittedAt) ? 'backfilled' : 'completed'
}
