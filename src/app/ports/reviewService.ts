/**
 * ReviewService — inbound (driving) port. Contract per docs/architecture.md
 * §ReviewService; DTO shapes live in `@/app/dto/review.ts`.
 */
import type {
  CompleteReviewRequest,
  FinalSummaryResponse,
  ReviewResponse,
} from '@/app/dto/review.ts'

export type { CompleteReviewRequest, FinalSummaryResponse, ReviewResponse }

export interface ReviewService {
  /** The review due for a closed week, if any. */
  getPendingReview(): Promise<ReviewResponse | null>
  /** Close the week and set the next week's limits. */
  completeReview(req: CompleteReviewRequest): Promise<void>
  /** Final summary after day 28 (no limit-setting). */
  getFinalSummary(): Promise<FinalSummaryResponse>
}
