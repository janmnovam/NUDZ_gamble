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
    await Promise.all([
      db.profile.where('user_id').equals(userId).delete(),
      db.coping_strategy.where('user_id').equals(userId).delete(),
      db.limits.where('user_id').equals(userId).delete(),
      db.check_ins.where('user_id').equals(userId).delete(),
      db.reviews.where('user_id').equals(userId).delete(),
      db.usage_events.where('user_id').equals(userId).delete(),
      db.check_in_edits.where('user_id').equals(userId).delete(),
    ])
  }
}
