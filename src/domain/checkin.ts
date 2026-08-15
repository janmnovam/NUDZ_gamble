/**
 * Daily check-in (doc 05) — the record shape, its validation, and the
 * derived day states the dashboard and CSV export both key off. Pure types
 * and signatures only; implementations are plain functions, no I/O — the
 * app-service layer is the one that persists the result.
 */
import type { CheckIn, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'

/** What the check-in form collects before it becomes a `CheckIn` record. */
export interface CheckInDraft {
  behavior_date: ISODate
  played: boolean
  /** Forced to 0 when `played` is false — the form shouldn't even show these fields then. */
  time_min: number
  stakes_czk: number
  winnings_czk: number
}

export type CheckInFieldErrorField = keyof CheckInDraft

export interface CheckInFieldError {
  field: CheckInFieldErrorField
  message: string
}

export type CheckInValidation = { valid: true } | { valid: false; errors: CheckInFieldError[] }

/**
 * Doc 05's validation table: numeric bounds, `played=false ⟹ all zero`, and
 * `behavior_date` must fall in the current week and be ≤ `today − 1`.
 * `week_first_day` comes from `StudyCalendar.dateOf(firstDay(currentWeek()))`.
 */
export type ValidateCheckIn = (
  draft: CheckInDraft,
  context: { today: ISODate; week_first_day: ISODate },
) => CheckInValidation

/** Pure command handler: a validated draft + `now` → the record to persist (upsert on `behavior_date`). */
export type SubmitCheckIn = (
  user_id: UserId,
  draft: CheckInDraft,
  week_no: number,
  now: ISOTimestamp,
  existing?: CheckIn,
) => CheckIn

/** A day's presentation state. Never confuse `missing` (no record) with a zero-filled record. */
export type DayState = 'completed' | 'backfilled' | 'missing' | 'future'

/** Derived, never stored: `date(submitted_at) > behavior_date + 1 day`. */
export type IsBackfill = (behavior_date: ISODate, submitted_at: ISOTimestamp) => boolean

/** `future` if `behavior_date > today − 1`; `missing` if no record and not future; else completed/backfilled. */
export type DayStateOf = (params: {
  behavior_date: ISODate
  today: ISODate
  check_in: CheckIn | undefined
}) => DayState
