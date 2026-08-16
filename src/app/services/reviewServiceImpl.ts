/**
 * Concrete ReviewService. Wraps the pure use-cases in `@domain/review.ts` and
 * exposes them behind the inbound port; the domain VMs already match the DTO
 * shapes field-for-field, so no rename mapper is needed. See
 * docs/architecture.md §ReviewService.
 */
import type {
  CompleteReviewRequest,
  FinalSummaryResponse,
  ReviewResponse,
  ReviewService,
} from '@/app/ports/reviewService.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import {
  completeReview,
  getFinalSummary,
  getPendingReview,
  type ReviewDeps,
} from '@domain/review.ts'
import type { UserId } from '@domain/model.ts'
import type {
  CheckInRepository,
  Clock,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

export interface ReviewServiceDeps {
  profiles: ProfileRepository
  limits: LimitRepository
  checkIns: CheckInRepository
  reviews: ReviewRepository
  /** Time source; "today" is the calendar date of `time()` (see `calendarDate`). */
  time: Clock
  newId: () => string
  /** The single demo user these records belong to. */
  userId?: UserId
}

export class ReviewServiceImpl implements ReviewService {
  private readonly deps: ReviewServiceDeps
  private readonly userId: UserId

  constructor(deps: ReviewServiceDeps) {
    this.deps = deps
    this.userId = deps.userId ?? DEMO_USER_ID
  }

  private domainDeps(): ReviewDeps {
    return {
      userId: this.userId,
      profiles: this.deps.profiles,
      limits: this.deps.limits,
      checkIns: this.deps.checkIns,
      reviews: this.deps.reviews,
      time: this.deps.time,
      newId: this.deps.newId,
    }
  }

  getPendingReview(): Promise<ReviewResponse | null> {
    return getPendingReview(this.domainDeps())
  }

  completeReview(req: CompleteReviewRequest): Promise<void> {
    return completeReview(req, this.domainDeps())
  }

  getFinalSummary(): Promise<FinalSummaryResponse> {
    return getFinalSummary(this.domainDeps())
  }
}
