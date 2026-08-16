/**
 * AdminService — the inbound (driving) port for administrative operations.
 * For now it holds a single capability: dropping a user's data from the
 * database. Destructive and irreversible; intended for admin/demo-reset flows.
 */
import type { UserId } from '@domain/model.ts'

export interface AdminService {
  /**
   * Drops all data owned by `userId` (every user-scoped table). The global
   * contacts directory is preserved. Irreversible.
   */
  dropUserData(userId: UserId): Promise<void>
}
