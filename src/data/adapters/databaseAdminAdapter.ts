import type { DatabaseAdmin } from '@domain/ports.ts'

import { type AppDatabase } from '../db'

/**
 * Clears every store in one shot. This is the one adapter allowed to reach
 * past a single table into `db.tables` — a whole-database wipe has no
 * per-entity meaning.
 */
export class DatabaseAdminAdapter implements DatabaseAdmin {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async clearAll(): Promise<void> {
    await Promise.all(this.db.tables.map((table) => table.clear()))
  }
}
