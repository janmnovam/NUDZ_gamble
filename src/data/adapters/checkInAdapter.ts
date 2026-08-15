import { type CheckInEntity } from '@data/model.ts'
import type { CheckIn, UserId } from '@domain/model.ts'
import { type CheckInRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'

export class CheckInAdapter implements CheckInRepository {
  private readonly repo: Repository<CheckInEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.check_ins)
  }

  async save(checkIn: CheckIn): Promise<void> {
    await this.repo.put(checkIn)
  }

  get(checkInId: string): Promise<CheckIn | undefined> {
    return this.repo.get(checkInId)
  }

  listByUser(userId: UserId): Promise<CheckIn[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'behavior_date' })
  }
}
