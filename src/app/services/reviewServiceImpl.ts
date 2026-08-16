/**
 * ReviewService wiring stub. Depends on `@domain/review.ts` (not built yet) and
 * the guards in `@domain/guards.ts`; method bodies are TODO. See
 * docs/architecture.md §ReviewService.
 */
import type {
  CompleteReviewRequest,
  FinalSummaryResponse,
  ReviewResponse,
  ReviewService,
} from '@/app/ports/reviewService.ts'
import type { TodayClock } from '@domain/clock.ts'
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
  now: Clock
  today: TodayClock
}

export class ReviewServiceImpl implements ReviewService {
  protected readonly deps: ReviewServiceDeps

  constructor(deps: ReviewServiceDeps) {
    this.deps = deps
  }

  getPendingReview(): Promise<ReviewResponse | null> {
    return Promise.reject(
      new Error('ReviewService.getPendingReview: not implemented (wiring only)'),
    )
  }

  completeReview(_req: CompleteReviewRequest): Promise<void> {
    return Promise.reject(new Error('ReviewService.completeReview: not implemented (wiring only)'))
  }

  getFinalSummary(): Promise<FinalSummaryResponse> {
    return Promise.reject(new Error('ReviewService.getFinalSummary: not implemented (wiring only)'))
  }
}
