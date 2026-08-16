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
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInEditRepository,
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

export interface CheckInServiceDeps {
  checkIns: CheckInRepository
  checkInEdits: CheckInEditRepository
  limits: LimitRepository
  profiles: ProfileRepository
}

export class CheckInServiceImpl implements CheckInService {
  protected readonly deps: CheckInServiceDeps

  constructor(deps: CheckInServiceDeps) {
    this.deps = deps
  }

  submitCheckIn(
    _req: CheckInRequest,
    _userId: UserId,
    _time: ISOTimestamp,
  ): Promise<CheckInResultResponse> {
    return Promise.reject(new Error('CheckInService.submitCheckIn: not implemented (wiring only)'))
  }

  editCheckIn(
    _req: CheckInRequest,
    _userId: UserId,
    _time: ISOTimestamp,
  ): Promise<CheckInResultResponse> {
    return Promise.reject(new Error('CheckInService.editCheckIn: not implemented (wiring only)'))
  }
}
