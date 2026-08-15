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

import { type DataLayer } from '@/core/ports'

import { CopingStrategyAdapter } from './adapters/copingStrategyAdapter'
import { LimitAdapter } from './adapters/limitAdapter'
import { ProfileAdapter } from './adapters/profileAdapter'
import { type Now, systemNow } from './clock'
import { type AppDatabase, db as defaultDb } from './db'

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

export { AppDatabase, db } from './db'
export { DexieRepository } from './repository'
export { systemNow, type Now } from './clock'
export { newId } from './ids'
export { COPING_STRATEGY_DEFAULTS } from './seeds/copingDefaults'
