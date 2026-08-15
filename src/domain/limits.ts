/**
 * Centrally-managed limit rules (CLAUDE.md, doc 04): suggested limit is 80%
 * of the reference; the user may adjust down, or up to at most 90%.
 * Reference 0 ⇒ limit 0, so any positive value exceeds. Applies to stakes
 * and time alike. The 80/90 live in `config.ts`'s `DEFAULT_CONFIG` — not
 * redefined here, so there's exactly one copy of each (doc 04: "never
 * inlined as a magic number in three different files").
 */
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'

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
  readonly suggestedPct: number
  readonly maxPct: number
}

export const limitPercentView = (config: DomainConfig = DEFAULT_CONFIG): LimitPercentView => ({
  suggestedPct: Math.round(config.DEFAULT_LIMIT_PCT * 100),
  maxPct: Math.round(config.MAX_LIMIT_PCT * 100),
})

/**
 * Doc 06's status table, classified on the raw `used / limit` ratio — never
 * the rounded display percent. `limit` of 0 (zero reference) never divides:
 * any positive usage is `PREKROCENO`, zero usage is `OK`.
 */
export const classifyStatus = (
  used: number,
  limit: number,
  config: DomainConfig = DEFAULT_CONFIG,
): Status => {
  if (limit <= 0) return used > 0 ? 'PREKROCENO' : 'OK'
  const ratio = used / limit
  if (ratio > config.PREKROCENO_THRESHOLD) return 'PREKROCENO'
  if (ratio >= config.POZOR_THRESHOLD) return 'POZOR'
  return 'OK'
}

const STATUS_RANK: Record<Status, number> = { OK: 0, POZOR: 1, PREKROCENO: 2 }

/** `overall = max(status_time, status_stakes)` (doc 06) — worse of the two. */
export const worseStatus = (a: Status, b: Status): Status =>
  STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
