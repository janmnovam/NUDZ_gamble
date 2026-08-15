/**
 * Centrally-managed limit rules (CLAUDE.md, doc 04): suggested limit is 80%
 * of the reference; the user may adjust down, or up to at most 90%.
 * Reference 0 ⇒ limit 0, so any positive value exceeds. Applies to stakes
 * and time alike. The 80/90 live in `config.ts`'s `DEFAULT_CONFIG` — not
 * redefined here, so there's exactly one copy of each (doc 04: "never
 * inlined as a magic number in three different files").
 */
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'

export const suggestLimit = (reference: number, config: DomainConfig = DEFAULT_CONFIG): number =>
  Math.round(reference * config.DEFAULT_LIMIT_PCT)

export const maxLimit = (reference: number, config: DomainConfig = DEFAULT_CONFIG): number =>
  Math.round(reference * config.MAX_LIMIT_PCT)

/** True when `limit` is a non-negative value no greater than the 90% cap. */
export const isWithinCap = (
  limit: number,
  reference: number,
  config: DomainConfig = DEFAULT_CONFIG,
): boolean => limit >= 0 && limit <= maxLimit(reference, config)

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
