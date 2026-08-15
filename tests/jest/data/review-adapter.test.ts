import { type ReviewEntity } from '@data/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('ReviewAdapter', () => {
  const FIXED_NOW = '2026-09-08T08:00:00.000Z'
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db, () => FIXED_NOW)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  const week1: ReviewEntity = {
    review_id: 'rev-1',
    user_id: 'A001',
    review_week_no: 1,
    review_completed_at: FIXED_NOW,
    limit_changed: true,
    incomplete: false,
  }

  it('saves and reads a review by week', async () => {
    await data.reviews.save(week1)
    await expect(data.reviews.getByWeek('A001', 1)).resolves.toEqual(week1)
  })

  it('returns undefined for a week with no review', async () => {
    await expect(data.reviews.getByWeek('A001', 2)).resolves.toBeUndefined()
  })

  it('enforces one review per week (append-only)', async () => {
    await data.reviews.save(week1)
    await expect(data.reviews.save({ ...week1, review_id: 'rev-2' })).rejects.toThrow()
  })

  it('lists reviews by week ascending', async () => {
    await data.reviews.save(week1)
    await data.reviews.save({ ...week1, review_id: 'rev-2', review_week_no: 2 })
    const list = await data.reviews.listByUser('A001')
    expect(list.map((r) => r.review_week_no)).toEqual([1, 2])
  })
})
