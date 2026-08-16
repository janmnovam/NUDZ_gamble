/**
 * Onboarding DTOs — the UI-shaped, camelCase boundary of the inbound
 * `OnboardingService` (docs/architecture.md §OnboardingService). These are the
 * shapes the UI wizard passes in and reads back; a mapper
 * (`@/app/mappers/onboardingMapper.ts`) converts them to/from the snake_case
 * domain models so the camelCase surface never leaks into `src/domain`.
 */
import type { CopingType, ISODate } from '@domain/model.ts'

/** A time (minutes) / stakes (CZK) pair — the reference week and the chosen limits share this shape. */
export interface TimeStakesDto {
  timeMinutes: number
  stakesAmount: number
}

export interface CopingDto {
  label: string
  type: CopingType
}

/** Input to `getSuggestedLimits` — the user's usual weekly time & stakes. */
export type ReferenceWeekRequest = TimeStakesDto

/**
 * The 80% suggested limits, the percentages the slider labels itself with, and
 * the 90% cap (the highest the user may adjust to) — everything the onboarding
 * limits screen needs to render its wheels/fields without re-deriving the rules.
 */
export interface SuggestedLimitsResponse extends TimeStakesDto {
  timePercent: number
  stakePercent: number
  /** Upper bound (90% of reference) the user may adjust up to. */
  timeCapMinutes: number
  stakesCapAmount: number
  /** The cap as a whole-number percent (90). */
  capPercent: number
}

/** Input to `complete` — reference week, the adjusted weekly limits, and ≥1 coping strategy. */
export interface OnboardingProfileRequest {
  reference: TimeStakesDto
  limits: TimeStakesDto
  coping: CopingDto[]
}

/** Echo of the completed profile plus the derived first intervention day. */
export interface OnboardingProfileResponse extends OnboardingProfileRequest {
  interventionStartDate: ISODate
}

/** Whether the demo user has already completed onboarding — gates the UI's entry screen. */
export interface OnboardingStatusResponse {
  completed: boolean
}
