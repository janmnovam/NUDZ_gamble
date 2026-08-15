import type { CheckIn } from '@domain/model.ts'
import { dayStateOf, isBackfill } from '@domain/checkin.ts'

function checkIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    check_in_id: 'c1',
    user_id: 'A001',
    behavior_date: '2026-09-03',
    week_no: 1,
    played: true,
    time_min: 60,
    stakes_czk: 500,
    winnings_czk: 0,
    submitted_at: '2026-09-04T08:00:00+02:00',
    updated_at: null,
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
      dayStateOf({ behavior_date: '2026-09-04', today: '2026-09-04', check_in: undefined }),
    ).toBe('future')
    expect(
      dayStateOf({ behavior_date: '2026-09-05', today: '2026-09-04', check_in: undefined }),
    ).toBe('future')
  })

  it('is missing for a past date with no record', () => {
    expect(
      dayStateOf({ behavior_date: '2026-09-02', today: '2026-09-04', check_in: undefined }),
    ).toBe('missing')
  })

  it('is completed for a past date submitted on time', () => {
    const record = checkIn({
      behavior_date: '2026-09-02',
      submitted_at: '2026-09-03T08:00:00+02:00',
    })
    expect(dayStateOf({ behavior_date: '2026-09-02', today: '2026-09-04', check_in: record })).toBe(
      'completed',
    )
  })

  it('is backfilled for a past date submitted late', () => {
    const record = checkIn({
      behavior_date: '2026-09-02',
      submitted_at: '2026-09-05T08:00:00+02:00',
    })
    expect(dayStateOf({ behavior_date: '2026-09-02', today: '2026-09-06', check_in: record })).toBe(
      'backfilled',
    )
  })
})
