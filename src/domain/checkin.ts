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
 * `behaviorDate` must be ≤ `today − 1` (a day that isn't over can't be checked
 * in). Eligibility to *backfill* a given past day — the rolling window and
 * review-closed week — is a separate policy (`canEditCheckIn` in guards.ts),
 * enforced by the service; those are fixed-date refusals, not form errors.
 */
export type ValidateCheckIn = (
  draft: CheckInDraft,
  context: { today: ISODate },
) => CheckInValidation

/**
 * Pure command handler: a validated draft + `time` + `newId` → the record to
 * persist (upsert on `behaviorDate`). On `existing` it edits in place — keeps
 * the original `checkInId`/`submittedAt` and sets `updatedAt`; otherwise it
 * mints a fresh id and stamps `submittedAt`. `newId` is threaded in (the domain
 * never calls `crypto.randomUUID()`), so record construction stays in one place.
 */
export type SubmitCheckIn = (
  userId: UserId,
  draft: CheckInDraft,
  weekNo: number,
  time: ISOTimestamp,
  newId: () => string,
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

/**
 * Doc 05's validation table. Numeric bounds apply only when `played`; when not
 * played all three numerics must be 0 (the form hides them). `behaviorDate`
 * must be ≤ today − 1 (`< today` for whole calendar dates). Never validates
 * against the limit — exceeding it is a legal outcome (doc 06), not a form
 * error. The backfill window / closed-week eligibility is enforced separately
 * (see `canEditCheckIn`).
 */
export const validateCheckIn: ValidateCheckIn = (draft, { today }) => {
  const errors: CheckInFieldError[] = []
  const behaviorDay = calendarDate(draft.behaviorDate)

  if (behaviorDay >= today) {
    errors.push({ field: 'behaviorDate', message: 'Date must be on or before yesterday.' })
  }

  if (draft.played) {
    if (!Number.isInteger(draft.timeMin) || draft.timeMin < 0 || draft.timeMin > 1440) {
      errors.push({
        field: 'timeMin',
        message: 'Minutes must be a whole number between 0 and 1440.',
      })
    }
    if (!Number.isInteger(draft.stakesCzk) || draft.stakesCzk < 0) {
      errors.push({ field: 'stakesCzk', message: 'Stakes must be a non-negative whole number.' })
    }
    if (!Number.isInteger(draft.winningsCzk) || draft.winningsCzk < 0) {
      errors.push({
        field: 'winningsCzk',
        message: 'Winnings must be a non-negative whole number.',
      })
    }
  } else {
    if (draft.timeMin !== 0) {
      errors.push({ field: 'timeMin', message: 'Must be 0 when you did not play.' })
    }
    if (draft.stakesCzk !== 0) {
      errors.push({ field: 'stakesCzk', message: 'Must be 0 when you did not play.' })
    }
    if (draft.winningsCzk !== 0) {
      errors.push({ field: 'winningsCzk', message: 'Must be 0 when you did not play.' })
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

/** See `SubmitCheckIn`. Assumes the draft already passed `validateCheckIn`. */
export const submitCheckIn: SubmitCheckIn = (userId, draft, weekNo, time, newId, existing) => ({
  checkInId: existing?.checkInId ?? newId(),
  userId,
  behaviorDate: draft.behaviorDate,
  weekNo,
  played: draft.played,
  timeMin: draft.played ? draft.timeMin : 0,
  stakesCzk: draft.played ? draft.stakesCzk : 0,
  winningsCzk: draft.played ? draft.winningsCzk : 0,
  submittedAt: existing?.submittedAt ?? time,
  updatedAt: existing ? time : null,
})
