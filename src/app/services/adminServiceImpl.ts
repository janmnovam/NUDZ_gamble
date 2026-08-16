/**
 * Concrete AdminService. A thin wrapper over the outbound `DatabaseAdmin`
 * port — no domain logic to do here; a wipe is a wipe. Kept as its own
 * service so the destructive path has an explicit, testable inbound seam.
 */
import type { AdminService } from '@/app/ports/adminService.ts'
import type { DatabaseAdmin } from '@domain/ports.ts'

export interface AdminServiceDeps {
  databaseAdmin: DatabaseAdmin
}

export class AdminServiceImpl implements AdminService {
  private readonly deps: AdminServiceDeps

  constructor(deps: AdminServiceDeps) {
    this.deps = deps
  }

  async dropAllData(): Promise<void> {
    await this.deps.databaseAdmin.clearAll()
  }
}
