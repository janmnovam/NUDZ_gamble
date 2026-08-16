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
import { type Result, run } from '@/app/result.ts'
import {
  completeReview,
  getFinalSummary,
  getPendingReview,
  type ReviewDeps,
} from '@domain/review.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

export interface ReviewServiceDeps {
  profiles: ProfileRepository
  limits: LimitRepository
  checkIns: CheckInRepository
  reviews: ReviewRepository
  newId: () => string
}

export class ReviewServiceImpl implements ReviewService {
  private readonly deps: ReviewServiceDeps

  constructor(deps: ReviewServiceDeps) {
    this.deps = deps
  }

  private domainDeps(userId: UserId, time: ISOTimestamp): ReviewDeps {
    return {
      userId,
      profiles: this.deps.profiles,
      limits: this.deps.limits,
      checkIns: this.deps.checkIns,
      reviews: this.deps.reviews,
      time,
      newId: this.deps.newId,
    }
  }

  getPendingReview(userId: UserId, time: ISOTimestamp): Promise<Result<ReviewResponse | null>> {
    return run(() => getPendingReview(this.domainDeps(userId, time)))
  }

  completeReview(
    req: CompleteReviewRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<void>> {
    return run(() => completeReview(req, this.domainDeps(userId, time)))
  }

  getFinalSummary(userId: UserId, time: ISOTimestamp): Promise<Result<FinalSummaryResponse>> {
    return run(() => getFinalSummary(this.domainDeps(userId, time)))
  }
}
