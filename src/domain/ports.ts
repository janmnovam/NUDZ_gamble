/**
 * Storage ports — the contract the domain/dispatcher depends on.
 *
 * Concrete implementations (IndexedDB today, HTTP later) live in `src/data`
 * and are injected through these interfaces, so the domain never imports a
 * storage engine. Every method speaks domain objects, never storage rows.
 */

import type {
  CheckIn,
  CopingStrategy,
  CopingStrategyDefault,
  CopingStrategyInput,
  ISODate,
  ISOTimestamp,
  Limit,
  Profile,
  Review,
  UserId,
} from '@domain/model.ts'

/** Current time as an ISO 8601 timestamp; injectable so callers (and tests) control time. */
export type Clock = () => ISOTimestamp

export interface ProfileRepository {
  save(profile: Profile): Promise<void>
  get(userId: UserId): Promise<Profile | undefined>
}

export interface CopingStrategyRepository {
  /** Predefined suggestions (Dr. Kazmer's list) for the onboarding picker. */
  loadDefaults(): Promise<CopingStrategyDefault[]>
  create(input: CopingStrategyInput): Promise<CopingStrategy>
  setActive(copingStrategyId: string, active: boolean): Promise<void>
  listByUser(userId: UserId): Promise<CopingStrategy[]>
}

export interface LimitRepository {
  /** Append-only: one limit per (user, week); a duplicate week is rejected. */
  save(limit: Limit): Promise<void>
  listByUser(userId: UserId): Promise<Limit[]>
}

export interface OnboardingRepository {
  /** Persists profile + week-1 limit + ≥1 coping atomically, or nothing. */
  save(profile: Profile, limit: Limit, coping: CopingStrategy[]): Promise<void>
}

export interface CheckInRepository {
  /** Insert or replace, keyed on (user, behavior_date). Caller reuses an existing row's check_in_id so the unique index isn't tripped. */
  upsert(checkIn: CheckIn): Promise<void>
  getByDate(userId: UserId, behaviorDate: ISODate): Promise<CheckIn | undefined>
  listByUser(userId: UserId): Promise<CheckIn[]>
  listByWeek(userId: UserId, weekNo: number): Promise<CheckIn[]>
}

export interface ReviewRepository {
  /** Append-only: one review per (user, week); a duplicate week is rejected by the unique index. */
  save(review: Review): Promise<void>
  getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined>
  listByUser(userId: UserId): Promise<Review[]>
}
