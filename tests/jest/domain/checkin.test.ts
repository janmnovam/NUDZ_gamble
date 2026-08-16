import type { CheckIn } from '@domain/model.ts'
import {
  dayStateOf,
  isBackfill,
  submitCheckIn,
  validateCheckIn,
  type CheckInDraft,
} from '@domain/checkin.ts'

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    checkInId: 'c1',
    userId: 'A001',
    behaviorDate: '2026-09-03T00:00:00.000Z',
    weekNo: 1,
    played: true,
    timeMin: 60,
    stakesCzk: 500,
    winningsCzk: 0,
    submittedAt: '2026-09-04T08:00:00+02:00',
    updatedAt: null,
    ...overrides,
  }
}

describe('isBackfill', () => {
  it('is false when submitted the next calendar day (on time)', () => {
    expect(isBackfill('2026-09-03T00:00:00.000Z', '2026-09-04T08:00:00+02:00')).toBe(false)
  })

  it('is false when submitted the same day', () => {
    expect(isBackfill('2026-09-03T00:00:00.000Z', '2026-09-03T23:00:00+02:00')).toBe(false)
  })

  it('is true when submitted two or more days later', () => {
    expect(isBackfill('2026-09-03T00:00:00.000Z', '2026-09-05T08:00:00+02:00')).toBe(true)
  })
})

describe('dayStateOf', () => {
  it('is future for a date on or after today', () => {
    expect(
      dayStateOf({
        behaviorDate: '2026-09-04T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: undefined,
      }),
    ).toBe('future')
    expect(
      dayStateOf({
        behaviorDate: '2026-09-05T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: undefined,
      }),
    ).toBe('future')
  })

  it('is missing for a past date with no record', () => {
    expect(
      dayStateOf({
        behaviorDate: '2026-09-02T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: undefined,
      }),
    ).toBe('missing')
  })

  it('is completed for a past date submitted on time', () => {
    const record = checkIn({
      behaviorDate: '2026-09-02T00:00:00.000Z',
      submittedAt: '2026-09-03T08:00:00+02:00',
    })
    expect(
      dayStateOf({
        behaviorDate: '2026-09-02T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: record,
      }),
    ).toBe('completed')
  })

  it('is backfilled for a past date submitted late', () => {
    const record = checkIn({
      behaviorDate: '2026-09-02T00:00:00.000Z',
      submittedAt: '2026-09-05T08:00:00+02:00',
    })
    expect(
      dayStateOf({
        behaviorDate: '2026-09-02T00:00:00.000Z',
        today: '2026-09-06',
        checkIn: record,
      }),
    ).toBe('backfilled')
  })
})

// Week 1 starts 2026-09-01; "today" is 2026-09-04 so 09-01..09-03 are valid past days.
const CTX = { today: '2026-09-04', weekFirstDay: '2026-09-01T00:00:00.000Z' }

function draft(over: Partial<CheckInDraft> = {}): CheckInDraft {
  return {
    behaviorDate: '2026-09-03T00:00:00.000Z',
    played: true,
    timeMin: 60,
    stakesCzk: 500,
    winningsCzk: 0,
    ...over,
  }
}

describe('validateCheckIn', () => {
  it('accepts a valid played row', () => {
    expect(validateCheckIn(draft(), CTX)).toEqual({ valid: true })
  })

  it('accepts a not-played all-zero row', () => {
    expect(
      validateCheckIn(draft({ played: false, timeMin: 0, stakesCzk: 0, winningsCzk: 0 }), CTX),
    ).toEqual({ valid: true })
  })

  it('rejects not-played with non-zero numerics', () => {
    const res = validateCheckIn(draft({ played: false, timeMin: 30, stakesCzk: 0 }), CTX)
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.map((e) => e.field)).toContain('timeMin')
  })

  it('rejects timeMin above 1440', () => {
    const res = validateCheckIn(draft({ timeMin: 1441 }), CTX)
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.map((e) => e.field)).toContain('timeMin')
  })

  it('rejects negative timeMin', () => {
    expect(validateCheckIn(draft({ timeMin: -1 }), CTX).valid).toBe(false)
  })

  it('rejects non-integer stakes', () => {
    const res = validateCheckIn(draft({ stakesCzk: 12.5 }), CTX)
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.map((e) => e.field)).toContain('stakesCzk')
  })

  it('rejects behaviorDate equal to today', () => {
    const res = validateCheckIn(draft({ behaviorDate: '2026-09-04T00:00:00.000Z' }), CTX)
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.map((e) => e.field)).toContain('behaviorDate')
  })

  it('rejects behaviorDate before the current week', () => {
    const res = validateCheckIn(draft({ behaviorDate: '2026-08-31T00:00:00.000Z' }), CTX)
    expect(res.valid).toBe(false)
    if (!res.valid) expect(res.errors.map((e) => e.field)).toContain('behaviorDate')
  })
})

describe('submitCheckIn', () => {
  const time = '2026-09-04T08:00:00+02:00'

  it('builds a new record with id, weekNo, submittedAt, updatedAt null', () => {
    const record = submitCheckIn('demo-user', draft(), 1, time, () => 'new-id')
    expect(record).toMatchObject({
      checkInId: 'new-id',
      userId: 'demo-user',
      behaviorDate: '2026-09-03T00:00:00.000Z',
      weekNo: 1,
      played: true,
      timeMin: 60,
      stakesCzk: 500,
      submittedAt: time,
      updatedAt: null,
    })
  })

  it('forces numerics to 0 when not played', () => {
    const record = submitCheckIn(
      'demo-user',
      draft({ played: false, timeMin: 99, stakesCzk: 99, winningsCzk: 99 }),
      1,
      time,
      () => 'new-id',
    )
    expect(record).toMatchObject({ played: false, timeMin: 0, stakesCzk: 0, winningsCzk: 0 })
  })

  it('preserves checkInId and submittedAt on edit, sets updatedAt', () => {
    const existing: CheckIn = {
      checkInId: 'existing-id',
      userId: 'demo-user',
      behaviorDate: '2026-09-03T00:00:00.000Z',
      weekNo: 1,
      played: true,
      timeMin: 10,
      stakesCzk: 10,
      winningsCzk: 0,
      submittedAt: '2026-09-03T20:00:00+02:00',
      updatedAt: null,
    }
    const record = submitCheckIn('demo-user', draft({ timeMin: 120 }), 1, time, () => 'unused', existing)
    expect(record).toMatchObject({
      checkInId: 'existing-id',
      submittedAt: '2026-09-03T20:00:00+02:00',
      updatedAt: time,
      timeMin: 120,
    })
  })
})
