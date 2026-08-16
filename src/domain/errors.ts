/**
 * Domain error taxonomy. Pure — no framework/app imports. A thrown `DomainError`
 * carries a category (`type`) and a specific machine `code`; the app layer maps
 * it onto the `ErrorEnvelope` returned by every finished service (see
 * `@/app/result.ts`). Any other thrown value is treated as `internal`.
 */

/** Broad error category, surfaced on the envelope as `type`. */
export type ErrorType = 'internal' | 'validation' | 'not_found' | 'conflict'

export class DomainError extends Error {
  readonly type: ErrorType
  /** Specific machine-readable identifier, e.g. `ONBOARDING_TIME_CAP`. */
  readonly code: string

  constructor(type: ErrorType, code: string, message: string) {
    super(message)
    this.name = 'DomainError'
    this.type = type
    this.code = code
  }
}
