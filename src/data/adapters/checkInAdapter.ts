import { type CheckInEntity } from '@data/model.ts'
import { checkInToDomain, checkInToEntity } from '@data/mappers.ts'
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
    await this.repo.put(checkInToEntity(checkIn))
  }

  async get(checkInId: string): Promise<CheckIn | undefined> {
    const entity = await this.repo.get(checkInId)
    return entity && checkInToDomain(entity)
  }

  async listByUser(userId: UserId): Promise<CheckIn[]> {
    const rows = await this.repo.query({
      where: { field: 'user_id', equals: userId },
      sortBy: 'behavior_date',
    })
    return rows.map(checkInToDomain)
  }
}
