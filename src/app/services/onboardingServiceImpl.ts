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
import { DEMO_USER_ID } from '@/app/constants.ts'
import { toOnboardingInput, toOnboardingProfileResponse } from '@/app/mappers/onboardingMapper.ts'
import { type TodayClock, nextDate } from '@domain/clock.ts'
import { limitPercentView, maxLimit, suggestLimit } from '@domain/limits.ts'
import type { UserId } from '@domain/model.ts'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { Clock, OnboardingRepository, ProfileRepository } from '@domain/ports.ts'

export interface OnboardingServiceDeps {
  repo: OnboardingRepository
  /** Read-only lookup for `getStatus` — `OnboardingRepository` is a write-only atomic port. */
  profiles: ProfileRepository
  /** UTC instant source — stamps the record `*_at` timestamps. */
  now: Clock
  /** Local calendar date source — anchors the intervention start date. */
  today: TodayClock
  newId: () => string
  /** The single demo user these records belong to. */
  userId?: UserId
}

export class OnboardingServiceImpl implements OnboardingService {
  private readonly deps: OnboardingServiceDeps
  private readonly userId: UserId

  constructor(deps: OnboardingServiceDeps) {
    this.deps = deps
    this.userId = deps.userId ?? DEMO_USER_ID
  }

  async getStatus(): Promise<OnboardingStatusResponse> {
    const profile = await this.deps.profiles.get(this.userId)
    return { completed: profile !== undefined }
  }

  getSuggestedLimits(req: ReferenceWeekRequest): Promise<SuggestedLimitsResponse> {
    const { suggestedPct, maxPct } = limitPercentView()
    return Promise.resolve({
      timeMinutes: suggestLimit(req.timeMinutes),
      stakesAmount: suggestLimit(req.stakesAmount),
      timePercent: suggestedPct,
      stakePercent: suggestedPct,
      timeCapMinutes: maxLimit(req.timeMinutes),
      stakesCapAmount: maxLimit(req.stakesAmount),
      capPercent: maxPct,
    })
  }

  async complete(req: OnboardingProfileRequest): Promise<OnboardingProfileResponse> {
    const input = toOnboardingInput(req, this.userId)
    await completeOnboarding(input, {
      repo: this.deps.repo,
      now: this.deps.now,
      today: this.deps.today,
      newId: this.deps.newId,
    })
    // Same value the domain just persisted: the day after the local `today`.
    const interventionStartDate = nextDate(this.deps.today.today())
    return toOnboardingProfileResponse(req, interventionStartDate)
  }
}
