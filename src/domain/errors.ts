/**
 * Domain error taxonomy. Pure — no framework/app imports. A thrown `DomainError`
 * carries a category (`type`) and a specific machine `code`; the app layer maps
 * it onto the `ErrorEnvelope` returned by every finished service (see
 * `@/app/result.ts`). Any other thrown value is treated as `internal`.
 */

import type { DomainErrorCode } from '@domain/errorCodes.ts'

/**
 * Broad error categories, surfaced on the envelope as `type`. A frozen constant
 * map (like `ERROR_CODES`) rather than a TS `enum` — matches the codebase's
 * `as const` + derived-union idiom and stays a plain string at runtime.
 */
export const ERROR_TYPES = {
  INTERNAL: 'internal',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
} as const

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES]

export class DomainError extends Error {
  readonly type: ErrorType
  /** A registered code from `ERROR_CODES` (see `@domain/errorCodes.ts`). */
  readonly code: DomainErrorCode

  constructor(type: ErrorType, code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
    this.type = type
    this.code = code
  }
}
