/**
 * ⚠️ TEMPORARY UI PLACEHOLDER — NOT the source of truth.
 *
 * `completeOnboarding` is a domain use case (OnboardingService, driven through
 * the app dispatcher) that persists the profile, week-1 limits and coping
 * strategies, and returns the derived intervention start date. This mock stands
 * in for it so the UI can be wired end-to-end; replace it with the real
 * dispatcher call when it exists.
 */
export interface OnboardingResult {
  referenceTimeMinutes: number
  referenceStakesCzk: number
  timeLimitMinutes: number
  stakesLimitCzk: number
  copingStrategyIds: string[]
  customStrategy: string | null
}

export interface OnboardingCompletion {
  /** Day 1 of the 28-day window — the first full calendar day after onboarding. */
  interventionStartDate: Date
}

export function completeOnboarding(result: OnboardingResult): OnboardingCompletion {
  // Mock: day 1 = tomorrow. The domain persists `result` and derives this from its Clock.
  const interventionStartDate = new Date()
  interventionStartDate.setDate(interventionStartDate.getDate() + 1)
  console.info('[completeOnboarding] mock — would persist:', result)
  return { interventionStartDate }
}
