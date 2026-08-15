import type { CheckIn } from '@domain/model.ts'
import {
  buildCheckInRecord,
  dayStateOf,
  isBackfill,
  recordCheckIn,
  validateCheckIn,
} from '@domain/checkin.ts'
import type { CheckInDraft, RecordCheckInDeps } from '@domain/checkin.ts'

const ctx = { today: '2026-09-04', week_first_day: '2026-09-01' }
const playedDraft: CheckInDraft = {
  behavior_date: '2026-09-03',
  played: true,
  time_min: 60,
  stakes_czk: 500,
  winnings_czk: 0,
}

describe('validateCheckIn', () => {
  it('accepts a valid played day in the current week', () => {
    expect(validateCheckIn(playedDraft, ctx)).toEqual({ valid: true })
  })

  it('accepts a no-play day with all zeros', () => {
    const d: CheckInDraft = {
      ...playedDraft,
      played: false,
      time_min: 0,
      stakes_czk: 0,
      winnings_czk: 0,
    }
    expect(validateCheckIn(d, ctx)).toEqual({ valid: true })
  })

  it('rejects a no-play day carrying non-zero values', () => {
    const d: CheckInDraft = { ...playedDraft, played: false }
    const r = validateCheckIn(d, ctx)
    expect(r.valid).toBe(false)
  })

  it('rejects negative or non-integer numbers on a played day', () => {
    expect(validateCheckIn({ ...playedDraft, stakes_czk: -1 }, ctx).valid).toBe(false)
    expect(validateCheckIn({ ...playedDraft, time_min: 1.5 }, ctx).valid).toBe(false)
  })

  it('rejects today or a future date (must be <= today - 1)', () => {
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-09-04' }, ctx).valid).toBe(false)
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-09-05' }, ctx).valid).toBe(false)
  })

  it('rejects a date before the current week (closed-week guard falls out of this)', () => {
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-08-31' }, ctx).valid).toBe(false)
  })
})

describe('buildCheckInRecord', () => {
  it('builds a fresh record with a new id, played values, updated_at null', () => {
    const rec = buildCheckInRecord({
      user_id: 'A001',
      draft: playedDraft,
      week_no: 1,
      now: '2026-09-04T08:00:00.000Z',
      newId: () => 'ci-new',
    })
    expect(rec).toMatchObject({
      check_in_id: 'ci-new',
      user_id: 'A001',
      behavior_date: '2026-09-03',
      week_no: 1,
      played: true,
      time_min: 60,
      stakes_czk: 500,
      winnings_czk: 0,
      submitted_at: '2026-09-04T08:00:00.000Z',
      updated_at: null,
    })
  })

  it('forces zeros when played is false', () => {
    const rec = buildCheckInRecord({
      user_id: 'A001',
      draft: { ...playedDraft, played: false },
      week_no: 1,
      now: '2026-09-04T08:00:00.000Z',
      newId: () => 'ci-x',
    })
    expect([rec.time_min, rec.stakes_czk, rec.winnings_czk]).toEqual([0, 0, 0])
  })

  it('on edit reuses id + original submitted_at and stamps updated_at', () => {
    const existing: CheckIn = {
      check_in_id: 'ci-1',
      user_id: 'A001',
      behavior_date: '2026-09-03',
      week_no: 1,
      played: true,
      time_min: 60,
      stakes_czk: 500,
      winnings_czk: 0,
      submitted_at: '2026-09-04T08:00:00.000Z',
      updated_at: null,
    }
    const rec = buildCheckInRecord({
      user_id: 'A001',
      draft: { ...playedDraft, time_min: 45 },
      week_no: 1,
      now: '2026-09-05T09:00:00.000Z',
      newId: () => 'SHOULD-NOT-BE-USED',
      existing,
    })
    expect(rec.check_in_id).toBe('ci-1')
    expect(rec.submitted_at).toBe('2026-09-04T08:00:00.000Z')
    expect(rec.updated_at).toBe('2026-09-05T09:00:00.000Z')
    expect(rec.time_min).toBe(45)
  })
})

describe('isBackfill', () => {
  it('false when submitted the day after behavior_date', () => {
    expect(isBackfill('2026-09-03', '2026-09-04T08:00:00.000Z')).toBe(false)
  })
  it('true when submitted more than one day later', () => {
    expect(isBackfill('2026-09-03', '2026-09-05T08:00:00.000Z')).toBe(true)
  })
})

describe('dayStateOf', () => {
  const base = { behavior_date: '2026-09-03', today: '2026-09-04' }
  it('future when behavior_date is today or later', () => {
    expect(
      dayStateOf({ behavior_date: '2026-09-04', today: '2026-09-04', check_in: undefined }),
    ).toBe('future')
  })
  it('missing when past and no record', () => {
    expect(dayStateOf({ ...base, check_in: undefined })).toBe('missing')
  })
  it('completed when submitted next day', () => {
    const ci = { submitted_at: '2026-09-04T08:00:00.000Z' } as CheckIn
    expect(dayStateOf({ ...base, check_in: ci })).toBe('completed')
  })
  it('backfilled when submitted late', () => {
    const ci = { submitted_at: '2026-09-06T08:00:00.000Z' } as CheckIn
    expect(dayStateOf({ ...base, check_in: ci })).toBe('backfilled')
  })
})

describe('recordCheckIn', () => {
  function fakeDeps() {
    const store = new Map<string, CheckIn>()
    const deps: RecordCheckInDeps = {
      now: () => '2026-09-04T08:00:00.000Z',
      newId: () => 'ci-generated',
      checkIns: {
        upsert: (c) => {
          store.set(`${c.user_id}|${c.behavior_date}`, c)
          return Promise.resolve()
        },
        getByDate: (u, d) => Promise.resolve(store.get(`${u}|${d}`)),
        listByUser: () => Promise.resolve([...store.values()]),
        listByWeek: () => Promise.resolve([...store.values()]),
      },
    }
    return { deps, store }
  }

  it('validates, builds, and upserts a new record', async () => {
    const { deps, store } = fakeDeps()
    const rec = await recordCheckIn(
      { user_id: 'A001', week_no: 1, draft: playedDraft, context: ctx },
      deps,
    )
    expect(rec.check_in_id).toBe('ci-generated')
    expect(store.get('A001|2026-09-03')?.time_min).toBe(60)
  })

  it('edits an existing day: reuses id, sets updated_at', async () => {
    const { deps } = fakeDeps()
    await recordCheckIn({ user_id: 'A001', week_no: 1, draft: playedDraft, context: ctx }, deps)
    const edited = await recordCheckIn(
      { user_id: 'A001', week_no: 1, draft: { ...playedDraft, time_min: 30 }, context: ctx },
      deps,
    )
    expect(edited.check_in_id).toBe('ci-generated')
    expect(edited.updated_at).toBe('2026-09-04T08:00:00.000Z')
    expect(edited.time_min).toBe(30)
  })

  it('rejects an invalid draft and writes nothing', async () => {
    const { deps, store } = fakeDeps()
    await expect(
      recordCheckIn(
        { user_id: 'A001', week_no: 1, draft: { ...playedDraft, stakes_czk: -5 }, context: ctx },
        deps,
      ),
    ).rejects.toThrow(/check-in/)
    expect(store.size).toBe(0)
  })
})
