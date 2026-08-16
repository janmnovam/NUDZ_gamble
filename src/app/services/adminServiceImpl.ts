/**
 * Concrete AdminService. A thin wrapper over the outbound `DatabaseAdmin`
 * port — no domain logic to do here; a drop is a drop. Kept as its own
 * service so the destructive path has an explicit, testable inbound seam.
 * Resolves to a `Result<void>` like every finished inbound service.
 */
import type { AdminService } from '@/app/ports/adminService.ts'
import { type Result, run } from '@/app/result.ts'
import type { UserId } from '@domain/model.ts'
import type { DatabaseAdmin } from '@domain/ports.ts'

export interface AdminServiceDeps {
  databaseAdmin: DatabaseAdmin
}

export class AdminServiceImpl implements AdminService {
  private readonly deps: AdminServiceDeps

  constructor(deps: AdminServiceDeps) {
    this.deps = deps
  }

  dropUserData(userId: UserId): Promise<Result<void>> {
    return run(() => this.deps.databaseAdmin.clearUserData(userId))
  }
}
