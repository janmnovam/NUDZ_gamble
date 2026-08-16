/**
 * CheckInService wiring stub. Dependencies are injected at the composition root
 * (see `@/core/app.ts`); the method bodies are TODO — see
 * docs/architecture.md §CheckInService.
 */
import type {
  CheckInRequest,
  CheckInResultResponse,
  CheckInService,
} from '@/app/ports/checkInService.ts'
import type { TodayClock } from '@domain/clock.ts'
import type {
  CheckInEditRepository,
  CheckInRepository,
  Clock,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

export interface CheckInServiceDeps {
  checkIns: CheckInRepository
  checkInEdits: CheckInEditRepository
  limits: LimitRepository
  profiles: ProfileRepository
  now: Clock
  today: TodayClock
}

export class CheckInServiceImpl implements CheckInService {
  protected readonly deps: CheckInServiceDeps

  constructor(deps: CheckInServiceDeps) {
    this.deps = deps
  }

  submitCheckIn(_req: CheckInRequest): Promise<CheckInResultResponse> {
    return Promise.reject(new Error('CheckInService.submitCheckIn: not implemented (wiring only)'))
  }

  editCheckIn(_req: CheckInRequest): Promise<CheckInResultResponse> {
    return Promise.reject(new Error('CheckInService.editCheckIn: not implemented (wiring only)'))
  }
}
