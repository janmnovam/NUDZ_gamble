/**
 * Storage ports — the contract the domain/dispatcher depends on.
 *
 * Concrete implementations (IndexedDB today, HTTP later) live in `src/data`
 * and are injected through these interfaces, so the domain never imports a
 * storage engine. Every method speaks domain objects, never storage rows.
 */

import {
  type CopingStrategy,
  type CopingStrategyDefault,
  type CopingType,
  type Limit,
  type Profile,
  type UserId,
} from './model'

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

export interface ProfilePort {
  save(profile: Profile): Promise<void>
  get(userId: UserId): Promise<Profile | undefined>
}

/** Fields the caller supplies; the adapter assigns id + timestamps. */
export interface NewCopingStrategy {
  user_id: UserId
  label: string
  type: CopingType
  priority: number
  /** Defaults to `true`. */
  active?: boolean
}

export interface CopingStrategyPort {
  /** Predefined suggestions (Dr. Kazmer's list) for the onboarding picker. */
  loadDefaults(): Promise<CopingStrategyDefault[]>
  create(input: NewCopingStrategy): Promise<CopingStrategy>
  setActive(copingStrategyId: string, active: boolean): Promise<void>
  listByUser(userId: UserId): Promise<CopingStrategy[]>
}

export interface LimitPort {
  /** Append-only: one limit per (user, week); a duplicate week is rejected. */
  save(limit: Limit): Promise<void>
  listByUser(userId: UserId): Promise<Limit[]>
}

/** The bundle the dispatcher wires up and injects into domain services. */
export interface DataLayer {
  profiles: ProfilePort
  copingStrategies: CopingStrategyPort
  limits: LimitPort
}
