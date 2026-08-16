import { type ErrorEnvelope } from '@/app/result.ts'
import { ERROR_CODES } from '@domain/errorCodes.ts'
import { type ErrorType } from '@domain/errors.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'

/**
 * Domain error codes the user can actually do something about — a limit over
 * the cap, a missing coping strategy, a day past the backfill window. Keyed off
 * the `ERROR_CODES` registry so the code strings never drift. Anything not
 * listed falls back to its category, so a new code never reaches the screen as a
 * raw string.
 */
const CODE_KEYS: Partial<Record<string, TranslationKey>> = {
  [ERROR_CODES.onboarding.NO_COPING]: 'error.onboarding.noCoping',
  [ERROR_CODES.onboarding.TIME_CAP]: 'error.onboarding.timeCap',
  [ERROR_CODES.onboarding.STAKES_CAP]: 'error.onboarding.stakesCap',
  [ERROR_CODES.review.TIME_CAP]: 'error.review.timeCap',
  [ERROR_CODES.review.STAKES_CAP]: 'error.review.stakesCap',
  [ERROR_CODES.review.NO_PROFILE]: 'error.review.noProfile',
  [ERROR_CODES.dashboard.NO_PROFILE]: 'error.dashboard.noProfile',
  [ERROR_CODES.dashboard.NO_LIMIT]: 'error.dashboard.noLimit',
  [ERROR_CODES.coping.EMPTY_LABEL]: 'error.coping.emptyLabel',
  [ERROR_CODES.checkin.OUTSIDE_WINDOW]: 'error.checkin.outsideWindow',
  [ERROR_CODES.checkin.WEEK_CLOSED]: 'error.checkin.weekClosed',
}

const TYPE_KEYS = {
  validation: 'error.type.validation',
  not_found: 'error.type.notFound',
  conflict: 'error.type.conflict',
  internal: 'error.type.internal',
} as const satisfies Record<ErrorType, TranslationKey>

/**
 * The message to show for a failed service call. Never returns the raw `code`
 * or `trace` — those are for the console, not for someone trying to record
 * whether they gambled yesterday.
 */
export function errorMessageKey(error: ErrorEnvelope | null | undefined): TranslationKey {
  if (!error) return 'error.type.internal'
  return CODE_KEYS[error.code] ?? TYPE_KEYS[error.type]
}
