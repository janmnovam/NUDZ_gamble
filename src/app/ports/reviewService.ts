/**
 * ReviewService — inbound (driving) port. Contract per docs/architecture.md
 * §ReviewService; DTO shapes live in `@/app/dto/review.ts`.
 */
import type {
  CompleteReviewRequest,
  FinalSummaryResponse,
  ReviewResponse,
} from '@/app/dto/review.ts'
import type { ISOTimestamp } from '@domain/model.ts'

export type { CompleteReviewRequest, FinalSummaryResponse, ReviewResponse }

export interface ReviewService {
  /**
   * The review due for a closed week, if any. `time` is the caller-supplied
   * instant (offset-bearing) that anchors "today".
   */
  getPendingReview(time: ISOTimestamp): Promise<ReviewResponse | null>
  /** Close the week and set the next week's limits; `time` stamps the records. */
  completeReview(req: CompleteReviewRequest, time: ISOTimestamp): Promise<void>
  /** Final summary after day 28 (no limit-setting). */
  getFinalSummary(time: ISOTimestamp): Promise<FinalSummaryResponse>
}
