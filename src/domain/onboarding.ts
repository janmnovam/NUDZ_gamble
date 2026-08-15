import { type TodayClock, nextDate } from '@domain/clock.ts'
import { isWithinCap } from '@domain/limits.ts'
import {
  type CopingStrategy,
  type CopingType,
  type ISOTimestamp,
  type Limit,
  type Profile,
  type UserId,
} from '@domain/model.ts'
import { type OnboardingRepository } from '@domain/ports.ts'

export interface OnboardingCopingInput {
  label: string
  type: CopingType
}

export interface OnboardingInput {
  user_id: UserId
  reference_time_min: number
  reference_stakes_czk: number
  /** User's chosen (already adjusted) weekly limits. */
  limit_time_min: number
  limit_stakes_czk: number
  /** At least one required. */
  coping: readonly OnboardingCopingInput[]
}

export interface OnboardingDeps {
  repo: OnboardingRepository
  /** UTC instant source — stamps `*_at` record timestamps. */
  now: () => ISOTimestamp
  /** Local calendar date source — same anchor the study calendar reads back with. */
  today: TodayClock
  newId: () => string
}

/**
 * The onboarding use-case: validate the inputs against the limit rules, then
 * persist profile + week-1 limit + coping atomically through the repository.
 * Pure — all time/id sources are injected so the domain stays storage-agnostic.
 */
export async function completeOnboarding(
  input: OnboardingInput,
  deps: OnboardingDeps,
): Promise<void> {
  if (input.coping.length < 1) {
    throw new Error('onboarding: at least one coping strategy is required')
  }
  if (!isWithinCap(input.limit_time_min, input.reference_time_min)) {
    throw new Error('onboarding: time limit exceeds the 90% cap')
  }
  if (!isWithinCap(input.limit_stakes_czk, input.reference_stakes_czk)) {
    throw new Error('onboarding: stakes limit exceeds the 90% cap')
  }

  const at = deps.now()

  const profile: Profile = {
    user_id: input.user_id,
    onboarding_completed_at: at,
    intervention_start_date: nextDate(deps.today.today()),
    reference_time_min: input.reference_time_min,
    reference_stakes_czk: input.reference_stakes_czk,
  }

  const limit: Limit = {
    limit_id: deps.newId(),
    user_id: input.user_id,
    week_no: 1,
    weekly_limit_time_min: input.limit_time_min,
    weekly_limit_stakes_czk: input.limit_stakes_czk,
    limit_set_at: at,
  }

  const coping: CopingStrategy[] = input.coping.map((c, i) => ({
    coping_strategy_id: deps.newId(),
    user_id: input.user_id,
    label: c.label,
    type: c.type,
    priority: i + 1,
    active: true,
    created_at: at,
    updated_at: null,
  }))

  await deps.repo.save(profile, limit, coping)
}
