import { type ReviewEntity } from '@data/model.ts'
import { type ReviewRepository } from '@domain/ports.ts'

import { type AppDatabase } from '../db'
import { DexieRepository } from '../repository'
import type { Review, UserId } from '@domain/model.ts'

/**
 * Weekly reviews. Append-only: the `&[user_id+review_week_no]` unique index
 * rejects a second review for the same week (with a new review_id), so the
 * historical record per week is never overwritten.
 */
export class ReviewAdapter implements ReviewRepository {
  private readonly repo: DexieRepository<ReviewEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.reviews)
  }

  async save(review: Review): Promise<void> {
    await this.repo.put(review)
  }

  getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined> {
    return this.repo.table.where('[user_id+review_week_no]').equals([userId, weekNo]).first()
  }

  listByUser(userId: UserId): Promise<Review[]> {
    return this.repo.query({
      where: { field: 'user_id', equals: userId },
      sortBy: 'review_week_no',
    })
  }
}
