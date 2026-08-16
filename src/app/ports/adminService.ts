/**
 * AdminService — the inbound (driving) port for administrative operations.
 * For now it holds a single capability: dropping a user's data from the
 * database. Destructive and irreversible; intended for admin/user-reset flows.
 */
import type { Result } from '@/app/result.ts'
import type { UserId } from '@domain/model.ts'

export interface AdminService {
  /**
   * Drops all data owned by `userId` (every user-scoped table), atomically.
   * The global contacts directory is preserved. Irreversible.
   */
  dropUserData(userId: UserId): Promise<Result<void>>
}
