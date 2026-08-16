/**
 * DashboardService wiring stub. `buildDashboardVM` already exists in
 * `@domain/dashboard.ts`; this wrapper just needs to call it and map the VM to
 * the DTO — TODO. See docs/architecture.md §DashboardService.
 */
import type { DashboardResponse, DashboardService } from '@/app/ports/dashboardService.ts'
import type { TodayClock } from '@domain/clock.ts'
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
  reviews: ReviewRepository
  today: TodayClock
}

export class DashboardServiceImpl implements DashboardService {
  protected readonly deps: DashboardServiceDeps

  constructor(deps: DashboardServiceDeps) {
    this.deps = deps
  }

  getDashboard(): Promise<DashboardResponse> {
    return Promise.reject(new Error('DashboardService.getDashboard: not implemented (wiring only)'))
  }
}
