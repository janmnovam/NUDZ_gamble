import { getDueReminder, isReminderTimeDue } from '@domain/reminder.ts'
import type { CheckIn, Profile } from '@domain/model.ts'

const USER_ID = 'A001'

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: USER_ID,
    onboardingCompletedAt: '2026-08-31T21:30:00+02:00',
    interventionStartDate: '2026-09-01T00:00:00.000Z',
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
    ...overrides,
  }
}

function checkIn(overrides: Partial<CheckIn>): CheckIn {
  return {
    checkInId: `c-${overrides.behaviorDate ?? ''}`,
    userId: USER_ID,
    weekNo: 1,
    played: false,
    winningsCzk: 0,
    submittedAt: '2026-09-02T08:00:00+02:00',
    updatedAt: null,
    timeMin: 0,
    stakesCzk: 0,
    behaviorDate: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getDueReminder', () => {
  it('is null before day 1 has started', () => {
    expect(
      getDueReminder({ profile: profile(), checkIns: [], time: '2026-08-31T08:00:00+02:00' }),
    ).toBeNull()
  })

  it('is null once the week has no missing days', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z' })],
      time: '2026-09-02T08:00:00+02:00',
    })
    expect(result).toBeNull()
  })

  it('reports the earliest missing day in the current week', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-02T00:00:00.000Z' })],
      time: '2026-09-04T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'checkin_due', behaviorDate: '2026-09-01T00:00:00.000Z' })
  })

  it('is null once the programme is over (final summary applies instead)', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [],
      time: '2026-09-30T08:00:00+02:00',
    })
    expect(result).toBeNull()
  })
})

describe('isReminderTimeDue', () => {
  const times = ['09:00', '20:00']

  it('is false before any configured slot today', () => {
    expect(isReminderTimeDue({ times, lastFiredAt: null, now: '2026-09-05T08:59:00+02:00' })).toBe(
      false,
    )
  })

  it('is true once a slot has passed and nothing has fired yet', () => {
    expect(isReminderTimeDue({ times, lastFiredAt: null, now: '2026-09-05T09:00:00+02:00' })).toBe(
      true,
    )
  })

  it('is false right after firing for that slot, same day', () => {
    expect(
      isReminderTimeDue({
        times,
        lastFiredAt: '2026-09-05T09:00:00+02:00',
        now: '2026-09-05T09:30:00+02:00',
      }),
    ).toBe(false)
  })

  it('re-arms once the later slot is crossed, same day', () => {
    expect(
      isReminderTimeDue({
        times,
        lastFiredAt: '2026-09-05T09:00:00+02:00',
        now: '2026-09-05T20:00:00+02:00',
      }),
    ).toBe(true)
  })

  it('re-arms the next calendar day even for the same slot', () => {
    expect(
      isReminderTimeDue({
        times,
        lastFiredAt: '2026-09-05T09:00:00+02:00',
        now: '2026-09-06T09:00:00+02:00',
      }),
    ).toBe(true)
  })
})
