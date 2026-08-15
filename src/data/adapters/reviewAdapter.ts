import { type ReviewEntity } from '@data/model.ts'
import type { Review, UserId } from '@domain/model.ts'
import { type ReviewRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'

/**
 * Weekly reviews. Append-only: the `&[user_id+review_week_no]` unique index
 * rejects a second review for the same week.
 */
export class ReviewAdapter implements ReviewRepository {
  private readonly repo: Repository<ReviewEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.reviews)
  }

  async save(review: Review): Promise<void> {
    await this.repo.put(review)
  }

  async getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined> {
    const rows = await this.repo.query({
      where: { field: 'user_id', equals: userId },
      filter: (r) => r.review_week_no === weekNo,
    })
    return rows[0]
  }

  listByUser(userId: UserId): Promise<Review[]> {
    return this.repo.query({
      where: { field: 'user_id', equals: userId },
      sortBy: 'review_week_no',
    })
  }
}
