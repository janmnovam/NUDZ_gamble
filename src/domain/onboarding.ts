import { calendarTimestamp, dateOf, nextDate } from '@domain/clock.ts'
import { DomainError } from '@domain/errors.ts'
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
  userId: UserId
  referenceTimeMin: number
  referenceStakesCzk: number
  /** User's chosen (already adjusted) weekly limits. */
  limitTimeMin: number
  limitStakesCzk: number
  /** At least one required. */
  coping: readonly OnboardingCopingInput[]
}

export interface OnboardingDeps {
  repo: OnboardingRepository
  /**
   * Caller-supplied instant — stamps `*_at` fields, and its date component
   * (`dateOf`) anchors "today", so the intervention starts the day after it.
   * Must carry the local offset (not a `Z`-normalized instant) for that date to
   * be the user's local day — see `dateOf`.
   */
  time: ISOTimestamp
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
    throw new DomainError(
      'validation',
      'ONBOARDING_NO_COPING',
      'onboarding: at least one coping strategy is required',
    )
  }
  if (!isWithinCap(input.limitTimeMin, input.referenceTimeMin)) {
    throw new DomainError(
      'validation',
      'ONBOARDING_TIME_CAP',
      'onboarding: time limit exceeds the 90% cap',
    )
  }
  if (!isWithinCap(input.limitStakesCzk, input.referenceStakesCzk)) {
    throw new DomainError(
      'validation',
      'ONBOARDING_STAKES_CAP',
      'onboarding: stakes limit exceeds the 90% cap',
    )
  }

  const at = deps.time

  const profile: Profile = {
    userId: input.userId,
    onboardingCompletedAt: at,
    interventionStartDate: calendarTimestamp(nextDate(dateOf(at))),
    referenceTimeMin: input.referenceTimeMin,
    referenceStakesCzk: input.referenceStakesCzk,
  }

  const limit: Limit = {
    limitId: deps.newId(),
    userId: input.userId,
    weekNo: 1,
    weeklyLimitTimeMin: input.limitTimeMin,
    weeklyLimitStakesCzk: input.limitStakesCzk,
    limitSetAt: at,
  }

  const coping: CopingStrategy[] = input.coping.map((c, i) => ({
    copingStrategyId: deps.newId(),
    userId: input.userId,
    label: c.label,
    type: c.type,
    priority: i + 1,
    active: true,
    createdAt: at,
    updatedAt: null,
  }))

  await deps.repo.save(profile, limit, coping)
}
