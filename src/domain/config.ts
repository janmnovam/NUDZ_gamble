/**
 * Centrally managed constants (docs 02, 04, 05 & 06) — the single source of
 * truth for every magic number in the spec, from percentage thresholds to
 * the programme calendar. Referenced everywhere, never inlined at a call
 * site.
 */

/** Weekly evaluation status. Ordered worst-to-best so `overall = max(...)` is one line. */
export type Status = 'OK' | 'POZOR' | 'PREKROCENO'

export interface DomainConfig {
  /** Suggested limit = this fraction of the reference (doc 04). */
  readonly DEFAULT_LIMIT_PCT: number
  /** Hard ceiling on a user-adjusted limit = this fraction of the reference (doc 04). */
  readonly MAX_LIMIT_PCT: number
  /** pct >= this and <= PREKROCENO_THRESHOLD → POZOR (doc 06). Inclusive lower bound. */
  readonly POZOR_THRESHOLD: number
  /** pct > this → PREKROCENO (doc 06). Inclusive upper bound for POZOR. */
  readonly PREKROCENO_THRESHOLD: number
  /** Study days per week (doc 02: W1 = 1–7, …, W4 = 22–28). */
  readonly WEEK_LENGTH_DAYS: number
  /** Total programme length; day 29 is the final summary, not a study day (doc 02). */
  readonly PROGRAMME_DAYS: number
  /**
   * How many days after `behaviorDate` a check-in stays editable (doc 05 /
   * `docs/data-model.md`'s `EDIT_WINDOW_DAYS`, float — was left `TBD`). Set equal
   * to `WEEK_LENGTH_DAYS`: editing is allowed anywhere in the still-open
   * week, no separate day-count cutoff on top of `weekClosed` (doc 05's
   * default reading — one boundary, not two overlapping ones).
   *
   * Superseded for backfill by `BACKFILL_WINDOW_DAYS` (see below); left here as
   * the documented "no extra cutoff" knob and currently unconsumed.
   */
  readonly EDIT_WINDOW_DAYS: number
  /**
   * Rolling backfill window: a missing day is backfillable iff
   * `1 <= studyDay(today) - studyDay(behaviorDate) <= this` AND its week isn't
   * review-closed. Replaces the old "current week only" boundary — the window
   * can reach into a previous week that hasn't been reviewed yet. Distinct from
   * `EDIT_WINDOW_DAYS`, which describes a different (unconsumed) policy.
   */
  readonly BACKFILL_WINDOW_DAYS: number
  /**
   * Local wall-clock times ("HH:mm", 24h) the installed app checks for a due
   * reminder and, if one is due, pops a system notification (doc 08's "one
   * working reminder scenario" — `NotificationService`/`reminder.ts`). Edit
   * this list to change when reminders fire; nothing else needs to change.
   * Single slot, hardcoded to 15:30 per an explicit product call so the demo
   * has one predictable moment to click through both `checkin_due` and
   * `review_due` popups — no runtime settings UI for it (the time machine's
   * time-of-day input is what testers use to dial the clock up to this slot).
   */
  readonly REMINDER_TIMES: readonly string[]
}

/**
 * Reference scenario (doc 04/06): 600 min / 10 000 CZK → proposed 480 min /
 * 8 000 CZK, ceiling 540 min / 9 000 CZK. Rounding rule for `proposed`/
 * `ceiling` (floor, applied identically everywhere) lives with whichever
 * function reads these constants — not decided here.
 */
export const DEFAULT_CONFIG: DomainConfig = {
  DEFAULT_LIMIT_PCT: 0.8,
  MAX_LIMIT_PCT: 0.9,
  POZOR_THRESHOLD: 0.8,
  PREKROCENO_THRESHOLD: 1.0,
  WEEK_LENGTH_DAYS: 7,
  PROGRAMME_DAYS: 28,
  EDIT_WINDOW_DAYS: 7,
  BACKFILL_WINDOW_DAYS: 5,
  REMINDER_TIMES: ['15:30'],
}
