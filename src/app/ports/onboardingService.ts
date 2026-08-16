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

export interface OnboardingService {
  /**
   * Whether the demo user has already completed onboarding. The UI checks
   * this before showing the onboarding wizard, so a returning user lands on
   * the dashboard instead of going through onboarding again.
   */
  getStatus(): Promise<OnboardingStatusResponse>

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
