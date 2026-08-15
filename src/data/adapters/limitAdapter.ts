import { type Limit, type UserId } from '@/core/model'
import { type LimitPort, type Repository } from '@/core/ports'

import { type AppDatabase } from '../db'
import { DexieRepository } from '../repository'

/**
 * Weekly limits. Append-only: the `&[user_id+week_no]` unique index rejects a
 * second limit for the same week, so history is never overwritten.
 */
export class LimitAdapter implements LimitPort {
  private readonly repo: Repository<Limit>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.limits)
  }

  async save(limit: Limit): Promise<void> {
    await this.repo.put(limit)
  }

  listByUser(userId: UserId): Promise<Limit[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'week_no' })
  }
}
