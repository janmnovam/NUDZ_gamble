/**
 * Daily check-in (doc 05) — the record shape, its validation, the derived day
 * states the dashboard and CSV export both key off, and the `recordCheckIn`
 * use case. Pure: all time/id sources are injected, so the domain stays
 * storage- and framework-agnostic. Persistence is the repository's job.
 */
import { nextDate } from '@domain/clock.ts'
import type { CheckIn, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'
import type { CheckInRepository } from '@domain/ports.ts'

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

/** A day's presentation state. Never confuse `missing` (no record) with a zero-filled record. */
export type DayState = 'completed' | 'backfilled' | 'missing' | 'future'

function isNonNegInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0
}

/**
 * Doc 05's validation: numeric bounds, `played=false ⟹ all zero`, and
 * `behavior_date` must fall in the current week and be ≤ `today − 1`.
 * `week_first_day` comes from `StudyCalendar.dateOf(firstDay(currentWeek()))`.
 * ISO dates compare correctly as plain strings.
 */
export function validateCheckIn(
  draft: CheckInDraft,
  context: { today: ISODate; week_first_day: ISODate },
): CheckInValidation {
  const errors: CheckInFieldError[] = []

  if (!draft.played) {
    for (const field of ['time_min', 'stakes_czk', 'winnings_czk'] as const) {
      if (draft[field] !== 0) {
        errors.push({ field, message: 'no-play day must be zero' })
      }
    }
  } else {
    for (const field of ['time_min', 'stakes_czk', 'winnings_czk'] as const) {
      if (!isNonNegInt(draft[field])) {
        errors.push({ field, message: 'must be a whole number ≥ 0' })
      }
    }
  }

  if (draft.behavior_date >= context.today) {
    errors.push({ field: 'behavior_date', message: 'must be yesterday or earlier' })
  } else if (draft.behavior_date < context.week_first_day) {
    errors.push({ field: 'behavior_date', message: 'outside the current week' })
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

/**
 * Build the record to persist from a validated draft. On edit (`existing`
 * present) the id and original `submitted_at` are preserved and `updated_at`
 * is stamped; on first submit a new id is minted and `updated_at` stays null.
 */
export function buildCheckInRecord(params: {
  user_id: UserId
  draft: CheckInDraft
  week_no: number
  now: ISOTimestamp
  newId: () => string
  existing?: CheckIn | undefined
}): CheckIn {
  const { user_id, draft, week_no, now, newId, existing } = params
  const played = draft.played
  return {
    check_in_id: existing?.check_in_id ?? newId(),
    user_id,
    behavior_date: draft.behavior_date,
    week_no,
    played,
    time_min: played ? draft.time_min : 0,
    stakes_czk: played ? draft.stakes_czk : 0,
    winnings_czk: played ? draft.winnings_czk : 0,
    submitted_at: existing?.submitted_at ?? now,
    updated_at: existing ? now : null,
  }
}

/** Derived, never stored: submitted more than one calendar day after the behavior day. */
export function isBackfill(behavior_date: ISODate, submitted_at: ISOTimestamp): boolean {
  return submitted_at.slice(0, 10) > nextDate(behavior_date)
}

/** `future` if `behavior_date ≥ today`; `missing` if no record; else completed/backfilled. */
export function dayStateOf(params: {
  behavior_date: ISODate
  today: ISODate
  check_in: CheckIn | undefined
}): DayState {
  const { behavior_date, today, check_in } = params
  if (behavior_date >= today) return 'future'
  if (!check_in) return 'missing'
  return isBackfill(behavior_date, check_in.submitted_at) ? 'backfilled' : 'completed'
}

export interface RecordCheckInInput {
  user_id: UserId
  week_no: number
  draft: CheckInDraft
  context: { today: ISODate; week_first_day: ISODate }
}

export interface RecordCheckInDeps {
  checkIns: CheckInRepository
  now: () => ISOTimestamp
  newId: () => string
}

/**
 * The check-in use case — covers both first submit and later edit (upsert
 * semantics): validate the draft, reuse an existing day's record if present
 * (preserving submitted_at, stamping updated_at), and persist. Pure aside
 * from the injected repo/now/newId. Feedback (status/remaining) is produced
 * by the shared weekly evaluator, not here.
 */
export async function recordCheckIn(
  input: RecordCheckInInput,
  deps: RecordCheckInDeps,
): Promise<CheckIn> {
  const result = validateCheckIn(input.draft, input.context)
  if (!result.valid) {
    throw new Error(`check-in: invalid draft — ${result.errors.map((e) => e.field).join(', ')}`)
  }
  const existing = await deps.checkIns.getByDate(input.user_id, input.draft.behavior_date)
  const record = buildCheckInRecord({
    user_id: input.user_id,
    draft: input.draft,
    week_no: input.week_no,
    now: deps.now(),
    newId: deps.newId,
    existing,
  })
  await deps.checkIns.upsert(record)
  return record
}
