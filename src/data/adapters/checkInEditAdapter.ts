import { type CheckInEditEntity } from '@data/model.ts'
import { checkInEditToDomain, checkInEditToEntity } from '@data/mappers.ts'
import type { CheckInEdit } from '@domain/model.ts'
import { type CheckInEditRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'

export class CheckInEditAdapter implements CheckInEditRepository {
  private readonly repo: Repository<CheckInEditEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.check_in_edits)
  }

  async save(edit: CheckInEdit): Promise<void> {
    await this.repo.put(checkInEditToEntity(edit))
  }

  async get(checkInEditId: string): Promise<CheckInEdit | undefined> {
    const entity = await this.repo.get(checkInEditId)
    return entity && checkInEditToDomain(entity)
  }

  async listByCheckIn(checkInId: string): Promise<CheckInEdit[]> {
    const rows = await this.repo.query({
      where: { field: 'check_in_id', equals: checkInId },
      sortBy: 'edited_at',
    })
    return rows.map(checkInEditToDomain)
  }
}
