import { type LimitEntity } from '@data/model.ts'
import { type LimitRepository } from '@domain/ports.ts'

import {type AppDatabase, type Repository} from '../db'
import { DexieRepository } from '../repository'
import type {Limit, UserId} from "@domain/model.ts";

/**
 * Weekly limits. Append-only: the `&[user_id+week_no]` unique index rejects a
 * second limit for the same week, so history is never overwritten.
 */
export class LimitAdapter implements LimitRepository {
  private readonly repo: Repository<LimitEntity>

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
