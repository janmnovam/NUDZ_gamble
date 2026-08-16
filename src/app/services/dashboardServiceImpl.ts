/**
 * Concrete DashboardService. Wraps `buildDashboardVM` (`@domain/dashboard.ts`)
 * and translates its `DashboardVM` to the `DashboardResponse` DTO at the
 * boundary. See docs/architecture.md §DashboardService.
 */
import type { DashboardResponse, DashboardService } from '@/app/ports/dashboardService.ts'
import { toDashboardResponse } from '@/app/mappers/dashboardMapper.ts'
import { type Result, run } from '@/app/result.ts'
import { buildDashboardVM } from '@domain/dashboard.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

export interface DashboardServiceDeps {
  profiles: ProfileRepository
  limits: LimitRepository
  checkIns: CheckInRepository
  /** Read by `buildDashboardVM` to gate each missing day's `backfillable` flag on a closed week. */
  reviews: ReviewRepository
}

export class DashboardServiceImpl implements DashboardService {
  private readonly deps: DashboardServiceDeps

  constructor(deps: DashboardServiceDeps) {
    this.deps = deps
  }

  getDashboard(userId: UserId, time: ISOTimestamp): Promise<Result<DashboardResponse>> {
    return run(async () => {
      const vm = await buildDashboardVM({
        userId,
        profileRepo: this.deps.profiles,
        limitRepo: this.deps.limits,
        checkInRepo: this.deps.checkIns,
        reviewRepo: this.deps.reviews,
        time,
      })
      return toDashboardResponse(vm)
    })
  }
}
