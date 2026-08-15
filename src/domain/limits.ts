/**
 * Centrally-managed limit rules (CLAUDE.md): suggested limit is 80% of the
 * reference; the user may adjust down, or up to at most 90%. Reference 0 ⇒
 * limit 0, so any positive value exceeds. Applies to stakes and time alike.
 */
export const LIMIT_SUGGEST_PCT = 0.8
export const LIMIT_MAX_PCT = 0.9

export const suggestLimit = (reference: number): number => Math.round(reference * LIMIT_SUGGEST_PCT)

export const maxLimit = (reference: number): number => Math.round(reference * LIMIT_MAX_PCT)

/** True when `limit` is a non-negative value no greater than the 90% cap. */
export const isWithinCap = (limit: number, reference: number): boolean =>
  limit >= 0 && limit <= maxLimit(reference)
