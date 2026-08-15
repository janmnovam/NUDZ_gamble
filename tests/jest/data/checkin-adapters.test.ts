import { type CheckInEntity } from '@data/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CheckInEdit } from '@domain/model.ts'

/** Set/get round-trips for the check-in and check-in-edit adapters. */
describe('check-in adapters', () => {
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

  const checkIn: CheckInEntity = {
    check_in_id: 'ci-1',
    user_id: 'A001',
    behavior_date: '2026-09-02',
    week_no: 1,
    played: true,
    time_min: 45,
    stakes_czk: 500,
    winnings_czk: 0,
    submitted_at: '2026-09-03T08:00:00.000Z',
    updated_at: null,
  }

  it('saves and reads a check-in by id', async () => {
    await data.checkIns.save(checkIn)
    await expect(data.checkIns.get('ci-1')).resolves.toEqual(checkIn)
  })

  it('lists a user’s check-ins ordered by behavior_date', async () => {
    await data.checkIns.save({ ...checkIn, check_in_id: 'ci-2', behavior_date: '2026-09-04' })
    await data.checkIns.save(checkIn)
    const list = await data.checkIns.listByUser('A001')
    expect(list.map((c) => c.behavior_date)).toEqual(['2026-09-02', '2026-09-04'])
  })

  it('enforces one check-in per (user, day)', async () => {
    await data.checkIns.save(checkIn)
    await expect(data.checkIns.save({ ...checkIn, check_in_id: 'ci-dup' })).rejects.toThrow()
  })

  const edit: CheckInEdit = {
    check_in_edit_id: 'e-1',
    user_id: 'A001',
    check_in_id: 'ci-1',
    action: 'created',
    edited_at: '2026-09-03T08:00:00.000Z',
    changed_fields: ['played', 'time_min', 'stakes_czk'],
    before: null,
    after: JSON.stringify({ played: true, time_min: 45 }),
  }

  it('appends and reads check-in edits, oldest first', async () => {
    await data.checkInEdits.save(edit)
    await data.checkInEdits.save({
      ...edit,
      check_in_edit_id: 'e-2',
      action: 'updated',
      edited_at: '2026-09-05T09:00:00.000Z',
      changed_fields: ['time_min'],
      before: JSON.stringify({ time_min: 45 }),
      after: JSON.stringify({ time_min: 60 }),
    })
    await expect(data.checkInEdits.get('e-1')).resolves.toEqual(edit)
    const log = await data.checkInEdits.listByCheckIn('ci-1')
    expect(log.map((e) => e.action)).toEqual(['created', 'updated'])
  })
})
