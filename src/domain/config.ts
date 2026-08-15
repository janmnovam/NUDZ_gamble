/**
 * Centrally managed constants (docs 04 & 06) — the single source of truth
 * for every percentage/threshold in the spec. Referenced everywhere, never
 * inlined as a magic number at a call site.
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
}
