import { type CopingStrategy, type CopingStrategyDefault, type UserId } from '@/core/model'
import { type CopingStrategyPort, type NewCopingStrategy, type Repository } from '@/core/ports'

import { type Now, systemNow } from '../clock'
import { type AppDatabase } from '../db'
import { newId } from '../ids'
import { DexieRepository } from '../repository'
import { COPING_STRATEGY_DEFAULTS } from '../seeds/copingDefaults'

/**
 * Per-user coping strategies: load the predefined suggestions, write the
 * user's own (custom or adopted), and toggle active/inactive.
 */
export class CopingStrategyAdapter implements CopingStrategyPort {
  private readonly repo: Repository<CopingStrategy>
  private readonly now: Now

  constructor(db: AppDatabase, now: Now = systemNow) {
    this.repo = new DexieRepository(db.coping_strategy)
    this.now = now
  }

  loadDefaults(): Promise<CopingStrategyDefault[]> {
    return Promise.resolve([...COPING_STRATEGY_DEFAULTS])
  }

  async create(input: NewCopingStrategy): Promise<CopingStrategy> {
    const strategy: CopingStrategy = {
      coping_strategy_id: newId(),
      user_id: input.user_id,
      label: input.label,
      type: input.type,
      priority: input.priority,
      active: input.active ?? true,
      created_at: this.now(),
      updated_at: null,
    }
    await this.repo.put(strategy)
    return strategy
  }

  async setActive(copingStrategyId: string, active: boolean): Promise<void> {
    const existing = await this.repo.get(copingStrategyId)
    if (!existing) {
      throw new Error(`coping_strategy not found: ${copingStrategyId}`)
    }
    await this.repo.put({ ...existing, active, updated_at: this.now() })
  }

  listByUser(userId: UserId): Promise<CopingStrategy[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'priority' })
  }
}
