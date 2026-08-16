import Dexie, { type Table } from 'dexie'
import { canonicalCalendarTimestamp } from '@domain/clock.ts'

import {
  type CheckInEditEntity,
  type CheckInEntity,
  type ContactEntity,
  type CopingStrategyEntity,
  type LimitEntity,
  type ProfileEntity,
  type ReviewEntity,
  type UsageEventEntity,
} from '@data/model.ts'

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
  profile!: Table<ProfileEntity, string>
  coping_strategy!: Table<CopingStrategyEntity, string>
  limits!: Table<LimitEntity, string>
  check_ins!: Table<CheckInEntity, string>
  reviews!: Table<ReviewEntity, string>
  usage_events!: Table<UsageEventEntity, string>
  contacts!: Table<ContactEntity, string>
  check_in_edits!: Table<CheckInEditEntity, string>

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
    // v2 adds the global contacts directory (help lines); prior stores carry over.
    this.version(2).stores({
      contacts: 'contact_id, category, priority',
    })
    // v3 adds the append-only check-in edit log.
    this.version(3).stores({
      check_in_edits: 'check_in_edit_id, user_id, check_in_id, edited_at',
    })
    // v4 stores intervention_start_date and behavior_date as canonical timestamps.
    this.version(4).upgrade(async (tx) => {
      await tx
        .table<ProfileEntity, string>('profile')
        .toCollection()
        .modify((profile) => {
          profile.intervention_start_date = canonicalCalendarTimestamp(
            profile.intervention_start_date,
          )
        })
      await tx
        .table<CheckInEntity, string>('check_ins')
        .toCollection()
        .modify((checkIn) => {
          checkIn.behavior_date = canonicalCalendarTimestamp(checkIn.behavior_date)
        })
    })
  }
}

/** Value types IndexedDB (and a future SQL backend) can index on. */
export type IndexableValue = string | number

/**
 * Generic query spec for a store. Kept small on purpose; richer needs
 * (joins, aggregations) compose these calls or drop to the repository's
 * escape hatch in the adapter that needs them.
 */
export interface Query<T> {
  /** Equality match on a single indexed field. */
  where?: { field: keyof T & string; equals: IndexableValue }
  /** In-memory predicate applied after the indexed narrowing. */
  filter?: (item: T) => boolean
  sortBy?: keyof T & string
  reverse?: boolean
  offset?: number
  limit?: number
}

/**
 * General read/write repository over one store. The building block every
 * future adapter reuses; specific ports below add domain semantics on top.
 */
export interface Repository<T, K extends IndexableValue = string> {
  get(key: K): Promise<T | undefined>
  getAll(): Promise<T[]>
  query(spec?: Query<T>): Promise<T[]>
  count(spec?: Pick<Query<T>, 'where' | 'filter'>): Promise<number>
  /** Insert or replace by primary key; returns the key. */
  put(item: T): Promise<K>
  bulkPut(items: T[]): Promise<void>
  remove(key: K): Promise<void>
}

export const db = new AppDatabase()
