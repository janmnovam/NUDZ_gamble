import type { UserId } from '@domain/model.ts'
import type { DatabaseAdmin } from '@domain/ports.ts'

import { type AppDatabase } from '../db'

/**
 * Deletes a single user's data across every user-scoped store. This is the
 * one adapter allowed to reach past a single table into the raw Dexie stores,
 * because a "drop this user's data" operation spans them all at once. The
 * global `contacts` help-line directory has no `user_id` and is deliberately
 * left untouched.
 */
export class DatabaseAdminAdapter implements DatabaseAdmin {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async clearUserData(userId: UserId): Promise<void> {
    const { db } = this
    // Every user-scoped store indexes `user_id`; contacts is global and omitted.
    const userTables = [
      db.profile,
      db.coping_strategy,
      db.limits,
      db.check_ins,
      db.reviews,
      db.usage_events,
      db.check_in_edits,
    ]
    // One rw transaction so a user's "delete my data" is all-or-nothing:
    // a mid-way failure rolls back rather than leaving a partial delete.
    await db.transaction('rw', userTables, () =>
      Promise.all(userTables.map((table) => table.where('user_id').equals(userId).delete())),
    )
  }
}
