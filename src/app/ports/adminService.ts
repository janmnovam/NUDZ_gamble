/**
 * AdminService — the inbound (driving) port for administrative operations.
 * For now it holds a single capability: dropping all data from the database.
 * Destructive and irreversible; intended for admin/demo-reset flows only.
 */
export interface AdminService {
  /** Drops all data from the database (every table). Irreversible. */
  dropAllData(): Promise<void>
}
