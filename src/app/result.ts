/**
 * Service result envelope. Every *finished* inbound service resolves to a
 * `Result<T>` instead of throwing: on success `data` is set and `error` is null;
 * on failure `error` carries the category (`type`), a machine `code`, and a
 * `trace` naming where it originated. The `run` wrapper turns a throwing body
 * into this shape, mapping a `DomainError` onto its `type`/`code` and any other
 * thrown value onto `internal`.
 */
import { DomainError, ERROR_TYPES, type ErrorType } from '@domain/errors.ts'

export interface ErrorEnvelope {
  /** Broad category — lets callers branch without matching on `code`. */
  type: ErrorType
  /** Specific machine-readable identifier (e.g. `ONBOARDING_TIME_CAP`, `INTERNAL`). */
  code: string
  /** Where the error originated — the top stack frame, e.g. `completeOnboarding (onboarding.ts:51:11)`. */
  trace: string
}

export interface Result<T> {
  data: T | null
  error: ErrorEnvelope | null
}

export function ok<T>(data: T): Result<T> {
  return { data, error: null }
}

export function fail(error: ErrorEnvelope): Result<never> {
  return { data: null, error }
}

/** The frame where the error was thrown — the first stack frame outside this module and the error class. */
function originOf(err: unknown): string {
  if (err instanceof Error && typeof err.stack === 'string') {
    const frame = err.stack
      .split('\n')
      .map((line) => line.trim())
      .find(
        (line) =>
          line.startsWith('at ') && !line.includes('errors.ts') && !line.includes('result.ts'),
      )
    if (frame) return frame.replace(/^at\s+/, '')
  }
  return 'unknown'
}

export function toEnvelope(err: unknown): ErrorEnvelope {
  if (err instanceof DomainError) {
    return { type: err.type, code: err.code, trace: originOf(err) }
  }
  return {
    type: ERROR_TYPES.INTERNAL,
    code: err instanceof Error ? err.name : 'INTERNAL',
    trace: originOf(err),
  }
}

/** Run `fn`, resolving to `{ data }` on success or `{ error }` on any throw — never rejects. */
export async function run<T>(fn: () => Promise<T> | T): Promise<Result<T>> {
  try {
    return ok(await fn())
  } catch (err) {
    return fail(toEnvelope(err))
  }
}
