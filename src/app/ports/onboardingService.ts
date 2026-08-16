/**
 * OnboardingService — the inbound (driving) port the UI onboarding wizard
 * calls. It speaks camelCase DTOs; the concrete impl
 * (`@/app/services/onboardingServiceImpl.ts`) maps them onto the domain
 * use-cases and outbound repositories.
 */
import type {
  OnboardingProfileRequest,
  OnboardingProfileResponse,
  OnboardingStatusResponse,
  ReferenceWeekRequest,
  SuggestedLimitsResponse,
} from '@/app/dto/onboarding.ts'
import type { Result } from '@/app/result.ts'
import type { ISOTimestamp } from '@domain/model.ts'

export interface OnboardingService {
  /**
   * The current user's onboarding status, resolved from the stored profile — the
   * UI learns *who* the user is (`userId`) from this call, not from any
   * client-side id. `userId` is null when no one has onboarded yet. The UI checks
   * this at startup so a returning user lands on the dashboard.
   */
  getStatus(time: ISOTimestamp): Promise<Result<OnboardingStatusResponse>>

  /**
   * Derive the auto-suggested weekly limits (80% of the reference) plus the
   * percentages, without persisting anything. User-agnostic — no user exists
   * yet during onboarding.
   */
  getSuggestedLimits(
    req: ReferenceWeekRequest,
    time: ISOTimestamp,
  ): Promise<Result<SuggestedLimitsResponse>>

  /**
   * Finalize onboarding: the service **generates a fresh user id**, then persists
   * profile + week-1 limit + coping atomically under it and returns the id in the
   * response. Rejects if no coping strategy is given or a limit exceeds the 90%
   * cap. `time` is the caller-supplied instant — it stamps the record `*_at`
   * fields, and its date component anchors the intervention start (the day
   * after). Pass an offset-bearing instant so that date is the user's local day
   * (see `dateOf`).
   */
  complete(
    req: OnboardingProfileRequest,
    time: ISOTimestamp,
  ): Promise<Result<OnboardingProfileResponse>>
}
