/**
 * Concrete DashboardService. Wraps `buildDashboardVM` (`@domain/dashboard.ts`)
 * and translates its `DashboardVM` to the `DashboardResponse` DTO at the
 * boundary. See docs/architecture.md §DashboardService.
 */
import type { DashboardResponse, DashboardService } from '@/app/ports/dashboardService.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { toDashboardResponse } from '@/app/mappers/dashboardMapper.ts'
import { buildDashboardVM } from '@domain/dashboard.ts'
import type { TodayClock } from '@domain/clock.ts'
import type { UserId } from '@domain/model.ts'
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
  // Not yet read by `buildDashboardVM` — `reviewable_weeks` stays hardcoded
  // empty until ReviewRepository/ReviewService are wired (architecture.md TODO #4/#7).
  reviews: ReviewRepository
  today: TodayClock
  /** The single demo user these records belong to. */
  userId?: UserId
}

export class DashboardServiceImpl implements DashboardService {
  private readonly deps: DashboardServiceDeps
  private readonly userId: UserId

  constructor(deps: DashboardServiceDeps) {
    this.deps = deps
    this.userId = deps.userId ?? DEMO_USER_ID
  }

  async getDashboard(): Promise<DashboardResponse> {
    const vm = await buildDashboardVM({
      userId: this.userId,
      profileRepo: this.deps.profiles,
      limitRepo: this.deps.limits,
      checkInRepo: this.deps.checkIns,
      today: this.deps.today,
    })
    return toDashboardResponse(vm)
  }
}
