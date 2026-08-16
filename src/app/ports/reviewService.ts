/**
 * ReviewService — inbound (driving) port. Wiring stub: the contract follows
 * docs/architecture.md §ReviewService, but the DTO shapes are placeholders
 * until the service (and `@domain/review.ts`) are implemented.
 */
// TODO(app): replace with the documented shapes when ReviewService is built.
export type ReviewResponse = Record<string, unknown>
export type CompleteReviewRequest = Record<string, unknown>
export type FinalSummaryResponse = Record<string, unknown>

export interface ReviewService {
  /** The review due for a closed week, if any. */
  getPendingReview(): Promise<ReviewResponse | null>
  /** Close the week and set the next week's limits. */
  completeReview(req: CompleteReviewRequest): Promise<void>
  /** Final summary after day 28 (no limit-setting). */
  getFinalSummary(): Promise<FinalSummaryResponse>
}
