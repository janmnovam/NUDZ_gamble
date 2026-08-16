import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CheckIn, CheckInEdit } from '@domain/model.ts'

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

  const checkIn: CheckIn = {
    checkInId: 'ci-1',
    userId: 'A001',
    behaviorDate: '2026-09-02T00:00:00.000Z',
    weekNo: 1,
    played: true,
    timeMin: 45,
    stakesCzk: 500,
    winningsCzk: 0,
    submittedAt: '2026-09-03T08:00:00.000Z',
    updatedAt: null,
  }

  it('saves and reads a check-in by id', async () => {
    await data.checkIns.save(checkIn)
    await expect(data.checkIns.get('ci-1')).resolves.toEqual(checkIn)
  })

  it('lists a user’s check-ins ordered by behaviorDate', async () => {
    await data.checkIns.save({
      ...checkIn,
      checkInId: 'ci-2',
      behaviorDate: '2026-09-04T00:00:00.000Z',
    })
    await data.checkIns.save(checkIn)
    const list = await data.checkIns.listByUser('A001')
    expect(list.map((c) => c.behaviorDate)).toEqual([
      '2026-09-02T00:00:00.000Z',
      '2026-09-04T00:00:00.000Z',
    ])
  })

  it('enforces one check-in per (user, day)', async () => {
    await data.checkIns.save(checkIn)
    await expect(data.checkIns.save({ ...checkIn, checkInId: 'ci-dup' })).rejects.toThrow()
  })

  const edit: CheckInEdit = {
    checkInEditId: 'e-1',
    userId: 'A001',
    checkInId: 'ci-1',
    action: 'created',
    editedAt: '2026-09-03T08:00:00.000Z',
    changedFields: ['played', 'timeMin', 'stakesCzk'],
    before: null,
    after: JSON.stringify({ played: true, timeMin: 45 }),
  }

  it('appends and reads check-in edits, oldest first', async () => {
    await data.checkInEdits.save(edit)
    await data.checkInEdits.save({
      ...edit,
      checkInEditId: 'e-2',
      action: 'updated',
      editedAt: '2026-09-05T09:00:00.000Z',
      changedFields: ['timeMin'],
      before: JSON.stringify({ timeMin: 45 }),
      after: JSON.stringify({ timeMin: 60 }),
    })
    await expect(data.checkInEdits.get('e-1')).resolves.toEqual(edit)
    const log = await data.checkInEdits.listByCheckIn('ci-1')
    expect(log.map((e) => e.action)).toEqual(['created', 'updated'])
  })
})
