import { type CheckInEntity } from '@data/model.ts'
import { type CheckInRepository } from '@domain/ports.ts'

import { type AppDatabase } from '../db'
import { DexieRepository } from '../repository'
import type { CheckIn, ISODate, UserId } from '@domain/model.ts'

/**
 * Daily check-ins. `upsert` is a plain `put`: the domain reuses an existing
 * row's `check_in_id` on edit, so replacing by primary key never trips the
 * `&[user_id+behavior_date]` unique index. A *new* id for a day that already
 * has a row is rejected by that index (one check-in per day).
 */
export class CheckInAdapter implements CheckInRepository {
  private readonly repo: DexieRepository<CheckInEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.check_ins)
  }

  async upsert(checkIn: CheckIn): Promise<void> {
    await this.repo.put(checkIn)
  }

  getByDate(userId: UserId, behaviorDate: ISODate): Promise<CheckIn | undefined> {
    return this.repo.table.where('[user_id+behavior_date]').equals([userId, behaviorDate]).first()
  }

  listByUser(userId: UserId): Promise<CheckIn[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'behavior_date' })
  }

  listByWeek(userId: UserId, weekNo: number): Promise<CheckIn[]> {
    return this.repo.query({
      where: { field: 'user_id', equals: userId },
      filter: (c) => c.week_no === weekNo,
      sortBy: 'behavior_date',
    })
  }
}
