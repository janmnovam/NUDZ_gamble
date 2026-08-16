/**
 * Storage ports — the contract the domain/dispatcher depends on.
 *
 * Concrete implementations (IndexedDB today, HTTP later) live in `src/data`
 * and are injected through these interfaces, so the domain never imports a
 * storage engine. Every method speaks domain objects, never storage rows.
 */

import type {
  CheckIn,
  CheckInEdit,
  Contact,
  CopingStrategy,
  CopingStrategyDefault,
  CopingStrategyInput,
  ISOTimestamp,
  Limit,
  Profile,
  Review,
  UsageEvent,
  UserId,
} from '@domain/model.ts'

export interface ProfileRepository {
  save(profile: Profile): Promise<void>
  get(userId: UserId): Promise<Profile | undefined>
  /** The single stored profile, if onboarding has happened — the backend is the
   * source of truth for "who the current user is" (no client-side id). */
  getCurrent(): Promise<Profile | undefined>
}

export interface CopingStrategyRepository {
  /** Predefined suggestions (Dr. Kazmer's list) for the onboarding picker. */
  loadDefaults(): Promise<CopingStrategyDefault[]>
  /** `time` (caller-supplied instant) stamps `createdAt` — the adapter reads no clock. */
  create(input: CopingStrategyInput, time: ISOTimestamp): Promise<CopingStrategy>
  /** `time` (caller-supplied instant) stamps `updatedAt`. */
  setActive(copingStrategyId: string, active: boolean, time: ISOTimestamp): Promise<void>
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

export interface ContactRepository {
  /** Idempotent — safe to call on every boot. */
  seed(): Promise<void>
  list(): Promise<Contact[]>
  get(contactId: string): Promise<Contact | undefined>
}

export interface CheckInRepository {
  save(checkIn: CheckIn): Promise<void>
  get(checkInId: string): Promise<CheckIn | undefined>
  listByUser(userId: UserId): Promise<CheckIn[]>
}

export interface CheckInEditRepository {
  save(edit: CheckInEdit): Promise<void>
  get(checkInEditId: string): Promise<CheckInEdit | undefined>
  listByCheckIn(checkInId: string): Promise<CheckInEdit[]>
}

export interface ReviewRepository {
  /** Append-only: one review per (user, week); a duplicate week is rejected. */
  save(review: Review): Promise<void>
  getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined>
  listByUser(userId: UserId): Promise<Review[]>
}

export interface UsageEventRepository {
  save(event: UsageEvent): Promise<void>
  get(usageEventId: string): Promise<UsageEvent | undefined>
  listByUser(userId: UserId): Promise<UsageEvent[]>
}

/**
 * Administrative outbound port. Destructive, coarse-grained maintenance
 * operations — not per-entity CRUD. Backed by a single adapter that reaches
 * straight into the database; no domain objects cross it.
 */
export interface DatabaseAdmin {
  /**
   * Deletes every row owned by `userId` across all user-scoped tables. The
   * global contacts directory (no `user_id`) is preserved. Irreversible;
   * admin/dev use only.
   */
  clearUserData(userId: UserId): Promise<void>
}
