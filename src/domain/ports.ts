/**
 * Storage ports — the contract the domain/dispatcher depends on.
 *
 * Concrete implementations (IndexedDB today, HTTP later) live in `src/data`
 * and are injected through these interfaces, so the domain never imports a
 * storage engine. Every method speaks domain objects, never storage rows.
 */

import type {
  CopingStrategy,
  CopingStrategyDefault,
  CopingStrategyInput,
  Limit,
  Profile,
  UserId,
} from '@domain/model.ts'

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
