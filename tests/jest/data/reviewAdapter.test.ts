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
    review_id: 'r-1',
    user_id: 'A001',
    review_week_no: 1,
    review_completed_at: '2026-09-08T09:00:00.000Z',
    limit_changed: true,
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
    await data.reviews.save({ ...review, review_id: 'r-2', review_week_no: 2 })
    await data.reviews.save(review)
    const list = await data.reviews.listByUser('A001')
    expect(list.map((r) => r.review_week_no)).toEqual([1, 2])
  })

  it('enforces one review per (user, week)', async () => {
    await data.reviews.save(review)
    await expect(data.reviews.save({ ...review, review_id: 'r-dup' })).rejects.toThrow()
  })
})
