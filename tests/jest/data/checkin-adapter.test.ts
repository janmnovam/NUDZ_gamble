import { type CheckInEntity } from '@data/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('CheckInAdapter', () => {
  const FIXED_NOW = '2026-09-04T08:00:00.000Z'
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

  const day3: CheckInEntity = {
    check_in_id: 'ci-1',
    user_id: 'A001',
    behavior_date: '2026-09-03',
    week_no: 1,
    played: true,
    time_min: 60,
    stakes_czk: 500,
    winnings_czk: 0,
    submitted_at: FIXED_NOW,
    updated_at: null,
  }

  it('upserts and reads a check-in by date', async () => {
    await data.checkIns.upsert(day3)
    await expect(data.checkIns.getByDate('A001', '2026-09-03')).resolves.toEqual(day3)
  })

  it('returns undefined for a date with no record', async () => {
    await expect(data.checkIns.getByDate('A001', '2026-09-02')).resolves.toBeUndefined()
  })

  it('replaces the row when upserting the same check_in_id (edit)', async () => {
    await data.checkIns.upsert(day3)
    await data.checkIns.upsert({ ...day3, time_min: 45, updated_at: FIXED_NOW })
    const reloaded = await data.checkIns.getByDate('A001', '2026-09-03')
    expect(reloaded?.time_min).toBe(45)
    expect(reloaded?.updated_at).toBe(FIXED_NOW)
    expect(await data.checkIns.listByUser('A001')).toHaveLength(1)
  })

  it('rejects a second row for the same (user, date) with a new id', async () => {
    await data.checkIns.upsert(day3)
    await expect(data.checkIns.upsert({ ...day3, check_in_id: 'ci-2' })).rejects.toThrow()
  })

  it('lists a week sorted by behavior_date', async () => {
    await data.checkIns.upsert({ ...day3, check_in_id: 'ci-a', behavior_date: '2026-09-05' })
    await data.checkIns.upsert({ ...day3, check_in_id: 'ci-b', behavior_date: '2026-09-03' })
    await data.checkIns.upsert({
      ...day3,
      check_in_id: 'ci-c',
      behavior_date: '2026-09-10',
      week_no: 2,
    })
    const week1 = await data.checkIns.listByWeek('A001', 1)
    expect(week1.map((c) => c.behavior_date)).toEqual(['2026-09-03', '2026-09-05'])
  })
})
