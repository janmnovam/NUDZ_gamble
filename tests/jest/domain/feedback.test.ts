import { buildCheckInFeedback } from '@domain/feedback.ts'
import type { CheckIn, CopingStrategy, Limit } from '@domain/model.ts'

const LIMIT: Limit = {
  limitId: 'l1',
  userId: 'demo-user',
  weekNo: 1,
  weeklyLimitTimeMin: 480,
  weeklyLimitStakesCzk: 8_000,
  limitSetAt: '2026-08-31T21:30:00+02:00',
}

function checkIn(over: Partial<CheckIn>): CheckIn {
  return {
    checkInId: `c-${over.behaviorDate ?? ''}`,
    userId: 'demo-user',
    behaviorDate: '2026-09-01T00:00:00.000Z',
    weekNo: 1,
    played: true,
    timeMin: 0,
    stakesCzk: 0,
    winningsCzk: 0,
    submittedAt: '2026-09-01T20:00:00+02:00',
    updatedAt: null,
    ...over,
  }
}

function coping(over: Partial<CopingStrategy>): CopingStrategy {
  return {
    copingStrategyId: 's1',
    userId: 'demo-user',
    label: 'Go outside for 15 minutes',
    type: 'custom',
    whenToUse: null,
    howToStart: null,
    priority: 0,
    active: true,
    createdAt: '2026-08-31T21:30:00+02:00',
    updatedAt: null,
    ...over,
  }
}

// Week 1 = 09-01..09-07; today 09-03 → 09-01,09-02 are past days.
const WEEK_DAYS = [
  '2026-09-01T00:00:00.000Z',
  '2026-09-02T00:00:00.000Z',
  '2026-09-03T00:00:00.000Z',
  '2026-09-04T00:00:00.000Z',
  '2026-09-05T00:00:00.000Z',
  '2026-09-06T00:00:00.000Z',
  '2026-09-07T00:00:00.000Z',
]

describe('buildCheckInFeedback', () => {
  it('reports both axes and no coping reminder when OK', () => {
    const fb = buildCheckInFeedback({
      weekNo: 1,
      checkIns: [
        checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z', timeMin: 100, stakesCzk: 1_000 }),
      ],
      limit: LIMIT,
      copingStrategies: [coping({})],
      weekDays: WEEK_DAYS,
      today: '2026-09-02',
    })
    expect(fb.time).toEqual({ used: 100, limit: 480, percent: 21, remaining: 380, status: 'OK' })
    expect(fb.stakes.status).toBe('OK')
    expect(fb.overall).toBe('OK')
    expect(fb.copingReminder).toBeNull()
  })

  it('surfaces the top-priority active coping label at POZOR', () => {
    const fb = buildCheckInFeedback({
      weekNo: 1,
      checkIns: [
        checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z', timeMin: 100, stakesCzk: 6_600 }),
      ],
      limit: LIMIT,
      copingStrategies: [
        coping({ copingStrategyId: 's2', label: 'Call a friend', priority: 2 }),
        coping({ copingStrategyId: 's1', label: 'Go for a walk', priority: 0 }),
        coping({ copingStrategyId: 's3', label: 'Inactive one', priority: 1, active: false }),
      ],
      weekDays: WEEK_DAYS,
      today: '2026-09-02',
    })
    expect(fb.stakes.status).toBe('POZOR')
    expect(fb.overall).toBe('POZOR')
    expect(fb.copingReminder).toBe('Go for a walk')
  })

  it('flags an incomplete week when a past day has no check-in', () => {
    const fb = buildCheckInFeedback({
      weekNo: 1,
      checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z', timeMin: 10 })],
      limit: LIMIT,
      copingStrategies: [],
      weekDays: WEEK_DAYS,
      today: '2026-09-03', // 09-02 is a past day with no record → incomplete
    })
    expect(fb.incompleteWeek).toBe(true)
  })

  it('handles a zero limit: percent null, positive usage is PREKROCENO', () => {
    const fb = buildCheckInFeedback({
      weekNo: 1,
      checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z', stakesCzk: 50 })],
      limit: { ...LIMIT, weeklyLimitStakesCzk: 0 },
      copingStrategies: [coping({})],
      weekDays: WEEK_DAYS,
      today: '2026-09-02',
    })
    expect(fb.stakes.percent).toBeNull()
    expect(fb.stakes.status).toBe('PREKROCENO')
    expect(fb.copingReminder).toBe('Go outside for 15 minutes')
  })
})
