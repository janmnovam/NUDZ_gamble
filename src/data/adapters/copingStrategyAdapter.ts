import { type CopingStrategyEntity } from '@data/model.ts'
import { copingDefaultToDomain, copingToDomain, copingToEntity } from '@data/mappers.ts'
import type {
  CopingStrategy,
  CopingStrategyDefault,
  CopingStrategyInput,
  ISOTimestamp,
  UserId,
} from '@domain/model.ts'
import { type CopingStrategyRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { newId } from '../ids'
import { DexieRepository } from '../repository'
import { COPING_STRATEGY_DEFAULTS } from '../seeds/copingDefaults'

/**
 * Per-user coping strategies: load the predefined suggestions, write the
 * user's own (custom or adopted), and toggle active/inactive. Time-ignorant —
 * the caller supplies the instant that stamps `createdAt`/`updatedAt`.
 */
export class CopingStrategyAdapter implements CopingStrategyRepository {
  private readonly repo: Repository<CopingStrategyEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.coping_strategy)
  }

  loadDefaults(): Promise<CopingStrategyDefault[]> {
    return Promise.resolve(COPING_STRATEGY_DEFAULTS.map(copingDefaultToDomain))
  }

  async create(input: CopingStrategyInput, time: ISOTimestamp): Promise<CopingStrategy> {
    const strategy: CopingStrategy = {
      copingStrategyId: newId(),
      userId: input.userId,
      label: input.label,
      type: input.type,
      priority: input.priority,
      active: input.active ?? true,
      createdAt: time,
      updatedAt: null,
    }
    await this.repo.put(copingToEntity(strategy))
    return strategy
  }

  async setActive(copingStrategyId: string, active: boolean, time: ISOTimestamp): Promise<void> {
    const existing = await this.repo.get(copingStrategyId)
    if (!existing) {
      throw new Error(`coping_strategy not found: ${copingStrategyId}`)
    }
    await this.repo.put({ ...existing, active, updated_at: time })
  }

  async listByUser(userId: UserId): Promise<CopingStrategy[]> {
    const rows = await this.repo.query({
      where: { field: 'user_id', equals: userId },
      sortBy: 'priority',
    })
    return rows.map(copingToDomain)
  }
}
