/**
 * OnboardingService — the inbound (driving) port the UI onboarding wizard
 * calls. It speaks camelCase DTOs; the concrete impl
 * (`@/app/services/onboardingServiceImpl.ts`) maps them onto the domain
 * use-cases and outbound repositories.
 */
import type {
  OnboardingProfileRequest,
  OnboardingProfileResponse,
  ReferenceWeekRequest,
  SuggestedLimitsResponse,
} from '@/app/dto/onboarding.ts'

export interface OnboardingService {
  /**
   * Derive the auto-suggested weekly limits (80% of the reference) plus the
   * percentages, without persisting anything.
   */
  getSuggestedLimits(req: ReferenceWeekRequest): Promise<SuggestedLimitsResponse>

  /**
   * Finalize onboarding: persist profile + week-1 limit + coping atomically.
   * Rejects if no coping strategy is given or a limit exceeds the 90% cap.
   */
  complete(req: OnboardingProfileRequest): Promise<OnboardingProfileResponse>
}
