import Dexie, { type Table } from 'dexie'

import {
  type CheckIn,
  type CopingStrategy,
  type Limit,
  type Profile,
  type Review,
  type UsageEvent,
} from '@/core/model'

/**
 * IndexedDB wiring for the NUDZ Gamble data model (see
 * `docs/data-model.md`).
 *
 * Index notes:
 * - `&[a+b]` = unique compound index; it enforces the model invariants
 *   (≤1 check-in/day, 1 limit/week, 1 review/week) at the storage layer.
 * - Booleans (`active`, `played`, `incomplete`) are deliberately NOT indexed:
 *   IndexedDB cannot index boolean keys. Filter them in memory (data is tiny).
 */
export class AppDatabase extends Dexie {
  profile!: Table<Profile, string>
  coping_strategy!: Table<CopingStrategy, string>
  limits!: Table<Limit, string>
  check_ins!: Table<CheckIn, string>
  reviews!: Table<Review, string>
  usage_events!: Table<UsageEvent, string>

  constructor(name = 'nudz-gamble') {
    super(name)
    this.version(1).stores({
      profile: 'user_id',
      coping_strategy: 'coping_strategy_id, user_id, type, priority',
      limits: 'limit_id, &[user_id+week_no], user_id, week_no, limit_set_at',
      check_ins:
        'check_in_id, &[user_id+behavior_date], user_id, behavior_date, week_no, submitted_at, updated_at',
      reviews: 'review_id, &[user_id+review_week_no], user_id, review_week_no, review_completed_at',
      usage_events: 'usage_event_id, [user_id+occurred_at], user_id, event_type',
    })
  }
}

export const db = new AppDatabase()
