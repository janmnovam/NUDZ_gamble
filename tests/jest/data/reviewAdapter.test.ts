import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { Review } from '@domain/model.ts'

describe('review adapter', () => {
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  const review: Review = {
    reviewId: 'r-1',
    userId: 'A001',
    reviewWeekNo: 1,
    reviewCompletedAt: '2026-09-08T09:00:00.000Z',
    limitChanged: true,
    incomplete: false,
  }

  it('saves and reads a review by week', async () => {
    await data.reviews.save(review)
    await expect(data.reviews.getByWeek('A001', 1)).resolves.toEqual(review)
  })

  it('returns undefined for a week with no review', async () => {
    await expect(data.reviews.getByWeek('A001', 2)).resolves.toBeUndefined()
  })

  it('lists a user’s reviews ordered by week', async () => {
    await data.reviews.save({ ...review, reviewId: 'r-2', reviewWeekNo: 2 })
    await data.reviews.save(review)
    const list = await data.reviews.listByUser('A001')
    expect(list.map((r) => r.reviewWeekNo)).toEqual([1, 2])
  })

  it('enforces one review per (user, week)', async () => {
    await data.reviews.save(review)
    await expect(data.reviews.save({ ...review, reviewId: 'r-dup' })).rejects.toThrow()
  })
})
