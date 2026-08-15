import { type CheckInEditEntity } from '@data/model.ts'
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
    await this.repo.put(edit)
  }

  get(checkInEditId: string): Promise<CheckInEdit | undefined> {
    return this.repo.get(checkInEditId)
  }

  listByCheckIn(checkInId: string): Promise<CheckInEdit[]> {
    return this.repo.query({
      where: { field: 'check_in_id', equals: checkInId },
      sortBy: 'edited_at',
    })
  }
}
