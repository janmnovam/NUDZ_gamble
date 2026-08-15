import type { CheckIn } from '@domain/model.ts'
import { dayStateOf, isBackfill } from '@domain/checkin.ts'

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    checkInId: 'c1',
    userId: 'A001',
    behaviorDate: '2026-09-03',
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
    expect(isBackfill('2026-09-03', '2026-09-04T08:00:00+02:00')).toBe(false)
  })

  it('is false when submitted the same day', () => {
    expect(isBackfill('2026-09-03', '2026-09-03T23:00:00+02:00')).toBe(false)
  })

  it('is true when submitted two or more days later', () => {
    expect(isBackfill('2026-09-03', '2026-09-05T08:00:00+02:00')).toBe(true)
  })
})

describe('dayStateOf', () => {
  it('is future for a date on or after today', () => {
    expect(
      dayStateOf({ behaviorDate: '2026-09-04', today: '2026-09-04', checkIn: undefined }),
    ).toBe('future')
    expect(
      dayStateOf({ behaviorDate: '2026-09-05', today: '2026-09-04', checkIn: undefined }),
    ).toBe('future')
  })

  it('is missing for a past date with no record', () => {
    expect(
      dayStateOf({ behaviorDate: '2026-09-02', today: '2026-09-04', checkIn: undefined }),
    ).toBe('missing')
  })

  it('is completed for a past date submitted on time', () => {
    const record = checkIn({
      behaviorDate: '2026-09-02',
      submittedAt: '2026-09-03T08:00:00+02:00',
    })
    expect(dayStateOf({ behaviorDate: '2026-09-02', today: '2026-09-04', checkIn: record })).toBe(
      'completed',
    )
  })

  it('is backfilled for a past date submitted late', () => {
    const record = checkIn({
      behaviorDate: '2026-09-02',
      submittedAt: '2026-09-05T08:00:00+02:00',
    })
    expect(dayStateOf({ behaviorDate: '2026-09-02', today: '2026-09-06', checkIn: record })).toBe(
      'backfilled',
    )
  })
})
