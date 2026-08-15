/**
 * Data layer public surface for the dispatcher / composition root.
 *
 * Wire it once and inject the returned `DataLayer` into domain services:
 *
 *   const data = createDataLayer()          // default IndexedDB + system clock
 *   await data.profiles.save(profile)
 *   const defaults = await data.copingStrategies.loadDefaults()
 *
 * Domain code depends only on the ports in `@/core/ports`; swapping IndexedDB
 * for an HTTP backend later means a different factory here, nothing upstream.
 */

import { CopingStrategyAdapter } from '@data/adapters/copingStrategyAdapter.ts'
import { LimitAdapter } from '@data/adapters/limitAdapter.ts'
import { OnboardingAdapter } from '@data/adapters/onboardingAdapter.ts'
import { ProfileAdapter } from '@data/adapters/profileAdapter.ts'
import { systemNow } from '@data/clock.ts'
import { type AppDatabase, db as defaultDb } from '@data/db.ts'
import type {
  Clock,
  CopingStrategyRepository,
  LimitRepository,
  OnboardingRepository,
  ProfileRepository,
} from '@domain/ports.ts'

// `TodayClock`/`StudyCalendar` aren't part of `DataLayer`: the study
// calendar needs a user's `intervention_start_date`, which isn't known
// until a `Profile` is loaded, so it's built per-user at the call site
// instead of once at composition-root startup.

export function createDataLayer(
  database: AppDatabase = defaultDb,
  now: Clock = systemNow,
): DataLayer {
  return {
    profiles: new ProfileAdapter(database),
    copingStrategies: new CopingStrategyAdapter(database, now),
    limits: new LimitAdapter(database),
    now,
    onboarding: new OnboardingAdapter(database),
  }
}

/** The bundle the dispatcher wires up and injects into domain services. */
export interface DataLayer {
  profiles: ProfileRepository
  copingStrategies: CopingStrategyRepository
  limits: LimitRepository
  /** Shared clock — pass to domain services instead of reading wall-clock time directly. */
  now: Clock
  onboarding: OnboardingRepository
}

export { AppDatabase, db } from '@data/db.ts'
export { DexieRepository } from '@data/repository.ts'
export { systemNow, systemTodayClock } from '@data/clock.ts'
export type { Clock } from '@domain/ports.ts'
export {
  createStudyCalendar,
  type StudyCalendar,
  type StudyDay,
  type TodayClock,
  type WeekNo,
} from '@domain/clock.ts'
export { newId } from '@data/ids.ts'
export { COPING_STRATEGY_DEFAULTS } from '@data/seeds/copingDefaults.ts'
