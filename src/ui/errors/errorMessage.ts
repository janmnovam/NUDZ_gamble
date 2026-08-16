import type { ErrorEnvelope } from '@/app/result.ts'
import type { ErrorType } from '@domain/errors.ts'
import type { TranslationKey } from '@ui/i18n/types.ts'

/**
 * Domain error codes the user can actually do something about — a limit over
 * the cap, a missing coping strategy, an empty label. Anything not listed falls
 * back to its category, so a new code never reaches the screen as a raw string.
 */
const CODE_KEYS: Partial<Record<string, TranslationKey>> = {
  ONBOARDING_NO_COPING: 'error.onboarding.noCoping',
  ONBOARDING_TIME_CAP: 'error.onboarding.timeCap',
  ONBOARDING_STAKES_CAP: 'error.onboarding.stakesCap',
  REVIEW_TIME_CAP: 'error.review.timeCap',
  REVIEW_STAKES_CAP: 'error.review.stakesCap',
  REVIEW_NO_PROFILE: 'error.review.noProfile',
  DASHBOARD_NO_PROFILE: 'error.dashboard.noProfile',
  DASHBOARD_NO_LIMIT: 'error.dashboard.noLimit',
  COPING_EMPTY_LABEL: 'error.coping.emptyLabel',
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
