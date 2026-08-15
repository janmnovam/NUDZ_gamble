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
