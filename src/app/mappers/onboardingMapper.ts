/**
 * DTO ⟷ domain mapping for onboarding (docs/architecture.md: "domain ⇄ DTO
 * mapper (dispatcher / app layer)"). Pure translation only — no I/O, no
 * validation (the domain use-case owns the rules).
 */
import type { OnboardingProfileRequest, OnboardingProfileResponse } from '@/app/dto/onboarding.ts'
import type { ISOCalendarTimestamp, UserId } from '@domain/model.ts'
import type { OnboardingInput } from '@domain/onboarding.ts'

/** Map the UI-shaped request to the domain input, injecting the user id. */
export function toOnboardingInput(req: OnboardingProfileRequest, userId: UserId): OnboardingInput {
  return {
    userId,
    referenceTimeMin: req.reference.timeMinutes,
    referenceStakesCzk: req.reference.stakesAmount,
    limitTimeMin: req.limits.timeMinutes,
    limitStakesCzk: req.limits.stakesAmount,
    coping: req.coping.map((c) => ({ label: c.label, type: c.type })),
  }
}

/** Echo the request back with the generated user id and derived first intervention day. */
export function toOnboardingProfileResponse(
  req: OnboardingProfileRequest,
  userId: UserId,
  interventionStartDate: ISOCalendarTimestamp,
): OnboardingProfileResponse {
  return {
    userId,
    reference: { ...req.reference },
    limits: { ...req.limits },
    coping: req.coping.map((c) => ({ ...c })),
    interventionStartDate,
  }
}
