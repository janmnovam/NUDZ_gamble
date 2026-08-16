/**
 * Concrete OnboardingService. Wraps the existing domain use-cases —
 * `completeOnboarding` for `complete`, `suggestLimit`/`limitPercentView` for
 * `getSuggestedLimits` — and translates DTOs at the boundary.
 *
 * Note on dependencies: docs/architecture.md lists Profile/Limit/Coping repos
 * separately, but the built `completeOnboarding` persists all three atomically
 * through the single `OnboardingRepository`, so that is what this impl injects
 * (via `DataLayer.onboarding`). The service stays free of `@data`/`@ui`.
 */
import type { OnboardingService } from '@/app/ports/onboardingService.ts'
import type {
  OnboardingProfileRequest,
  OnboardingProfileResponse,
  OnboardingStatusResponse,
  ReferenceWeekRequest,
  SuggestedLimitsResponse,
} from '@/app/dto/onboarding.ts'
import { toOnboardingInput, toOnboardingProfileResponse } from '@/app/mappers/onboardingMapper.ts'
import { type Result, run } from '@/app/result.ts'
import { calendarTimestamp, dateOf, nextDate } from '@domain/clock.ts'
import { limitPercentView, maxLimit, suggestLimit } from '@domain/limits.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { OnboardingRepository, ProfileRepository } from '@domain/ports.ts'

export interface OnboardingServiceDeps {
  repo: OnboardingRepository
  /** Read-only lookup for `getStatus` — `OnboardingRepository` is a write-only atomic port. */
  profiles: ProfileRepository
  newId: () => string
}

export class OnboardingServiceImpl implements OnboardingService {
  private readonly deps: OnboardingServiceDeps

  constructor(deps: OnboardingServiceDeps) {
    this.deps = deps
  }

  getStatus(userId: UserId, _time: ISOTimestamp): Promise<Result<OnboardingStatusResponse>> {
    return run(async () => {
      const profile = await this.deps.profiles.get(userId)
      return {
        userId,
        completed: profile !== undefined,
        completedAt: profile?.onboardingCompletedAt ?? null,
      }
    })
  }

  getSuggestedLimits(
    req: ReferenceWeekRequest,
    _userId: UserId,
    _time: ISOTimestamp,
  ): Promise<Result<SuggestedLimitsResponse>> {
    return run(() => {
      const { suggestedPct, maxPct } = limitPercentView()
      return {
        timeMinutes: suggestLimit(req.timeMinutes),
        stakesAmount: suggestLimit(req.stakesAmount),
        timePercent: suggestedPct,
        stakePercent: suggestedPct,
        timeCapMinutes: maxLimit(req.timeMinutes),
        stakesCapAmount: maxLimit(req.stakesAmount),
        capPercent: maxPct,
      }
    })
  }

  complete(
    req: OnboardingProfileRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<OnboardingProfileResponse>> {
    return run(async () => {
      const input = toOnboardingInput(req, userId)
      await completeOnboarding(input, {
        repo: this.deps.repo,
        time,
        newId: this.deps.newId,
      })
      // Same value the domain just persisted: the day after the instant's local date.
      const interventionStartDate = calendarTimestamp(nextDate(dateOf(time)))
      return toOnboardingProfileResponse(req, interventionStartDate)
    })
  }
}
