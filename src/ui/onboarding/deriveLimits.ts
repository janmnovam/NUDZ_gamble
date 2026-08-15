/**
 * ⚠️ TEMPORARY UI PLACEHOLDER — NOT the source of truth.
 *
 * The 80% suggested limit and the 90% cap are domain rules with centrally
 * managed constants, owned by the domain layer (outside the UI team's scope).
 * This stub exists only so the onboarding limits screen is interactive and
 * demoable before that lands. Replace these calls with the domain function
 * once it is available.
 */
const SUGGESTED_RATIO = 0.8
const CAP_RATIO = 0.9

export function suggestedFromReference(reference: number): number {
  return Math.round(reference * SUGGESTED_RATIO)
}

export function capFromReference(reference: number): number {
  return Math.round(reference * CAP_RATIO)
}
