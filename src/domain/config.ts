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
   * How many days after `behavior_date` a check-in stays editable (doc 05 /
   * `data-model.md`'s `EDIT_WINDOW_DAYS`, float — was left `TBD`). Set equal
   * to `WEEK_LENGTH_DAYS`: editing is allowed anywhere in the still-open
   * week, no separate day-count cutoff on top of `week_closed` (doc 05's
   * default reading — one boundary, not two overlapping ones).
   */
  readonly EDIT_WINDOW_DAYS: number
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
}

/**
 * Display-ready view of the limit-adjustment percentages (doc 04) — the same
 * `DEFAULT_LIMIT_PCT`/`MAX_LIMIT_PCT` as whole numbers (80/90), so the
 * onboarding/review slider labels them without re-multiplying by 100 itself.
 */
export interface LimitPercentView {
  readonly suggested_pct: number
  readonly max_pct: number
}

export const limitPercentView = (config: DomainConfig = DEFAULT_CONFIG): LimitPercentView => ({
  suggested_pct: Math.round(config.DEFAULT_LIMIT_PCT * 100),
  max_pct: Math.round(config.MAX_LIMIT_PCT * 100),
})
