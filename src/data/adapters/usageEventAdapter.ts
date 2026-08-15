import { type UsageEventEntity } from '@data/model.ts'
import { usageEventToDomain, usageEventToEntity } from '@data/mappers.ts'
import type { UsageEvent, UserId } from '@domain/model.ts'
import { type UsageEventRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'

export class UsageEventAdapter implements UsageEventRepository {
  private readonly repo: Repository<UsageEventEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.usage_events)
  }

  async save(event: UsageEvent): Promise<void> {
    await this.repo.put(usageEventToEntity(event))
  }

  async get(usageEventId: string): Promise<UsageEvent | undefined> {
    const entity = await this.repo.get(usageEventId)
    return entity && usageEventToDomain(entity)
  }

  async listByUser(userId: UserId): Promise<UsageEvent[]> {
    const rows = await this.repo.query({
      where: { field: 'user_id', equals: userId },
      sortBy: 'occurred_at',
    })
    return rows.map(usageEventToDomain)
  }
}
