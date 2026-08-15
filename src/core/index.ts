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
import { ProfileAdapter } from '@data/adapters/profileAdapter.ts'
import { type Now, systemNow } from '@data/clock.ts'
import { type AppDatabase, db as defaultDb } from '@data/db.ts'
import type {CopingStrategyRepository, LimitRepository, ProfileRepository} from "@domain/ports.ts";

export function createDataLayer(
  database: AppDatabase = defaultDb,
  now: Now = systemNow,
): DataLayer {
  return {
    profiles: new ProfileAdapter(database),
    copingStrategies: new CopingStrategyAdapter(database, now),
    limits: new LimitAdapter(database),
  }
}

/** The bundle the dispatcher wires up and injects into domain services. */
export interface DataLayer {
  profiles: ProfileRepository
  copingStrategies: CopingStrategyRepository
  limits: LimitRepository
}

export { AppDatabase, db } from '@data/db.ts'
export { DexieRepository } from '@data/repository.ts'
export { systemNow, type Now } from '@data/clock.ts'
export { newId } from '@data/ids.ts'
export { COPING_STRATEGY_DEFAULTS } from '@data/seeds/copingDefaults.ts'
