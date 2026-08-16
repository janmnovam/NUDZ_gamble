import { getDueReminder, getLastChanceDue, isReminderTimeDue } from '@domain/reminder.ts'
import type { CheckIn, Profile, Review } from '@domain/model.ts'

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

function review(overrides: Partial<Review>): Review {
  return {
    reviewId: `r-${String(overrides.reviewWeekNo ?? 0)}`,
    userId: USER_ID,
    reviewWeekNo: 1,
    reviewCompletedAt: '2026-09-08T09:00:00+02:00',
    limitChanged: false,
    incomplete: false,
    ...overrides,
  }
}

describe('getDueReminder', () => {
  it('is null before day 1 has started', () => {
    expect(
      getDueReminder({
        profile: profile(),
        checkIns: [],
        reviews: [],
        time: '2026-08-31T08:00:00+02:00',
      }),
    ).toBeNull()
  })

  it('is null once the week has no missing days and no review is open', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z' })],
      reviews: [],
      time: '2026-09-02T08:00:00+02:00',
    })
    expect(result).toBeNull()
  })

  it('reports the earliest missing day in the current week', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-02T00:00:00.000Z' })],
      reviews: [],
      time: '2026-09-04T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'checkin_due', behaviorDate: '2026-09-01T00:00:00.000Z' })
  })

  it('reports week 1 review as due once week 1 has elapsed and no review exists yet', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [],
      reviews: [],
      time: '2026-09-08T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'review_due', weekNo: 1 })
  })

  it('prefers review_due over checkin_due once the elapsed week also has missing days', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z' })],
      reviews: [],
      time: '2026-09-08T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'review_due', weekNo: 1 })
  })

  it('falls back to checkin_due for the new week once the prior review is completed', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [checkIn({ behaviorDate: '2026-09-09T00:00:00.000Z' })],
      reviews: [review({ reviewWeekNo: 1 })],
      time: '2026-09-11T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'checkin_due', behaviorDate: '2026-09-08T00:00:00.000Z' })
  })

  it('keeps reporting review_due past the final-summary boundary until it is completed', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [],
      reviews: [
        review({ reviewWeekNo: 1 }),
        review({ reviewWeekNo: 2, reviewId: 'r-2' }),
        review({ reviewWeekNo: 3, reviewId: 'r-3' }),
      ],
      time: '2026-09-30T08:00:00+02:00',
    })
    expect(result).toEqual({ kind: 'review_due', weekNo: 4 })
  })

  it('is null once the programme is over and every week has been reviewed', () => {
    const result = getDueReminder({
      profile: profile(),
      checkIns: [],
      reviews: [1, 2, 3, 4].map((weekNo) =>
        review({ reviewWeekNo: weekNo, reviewId: `r-${String(weekNo)}` }),
      ),
      time: '2026-09-30T08:00:00+02:00',
    })
    expect(result).toBeNull()
  })
})

describe('getLastChanceDue', () => {
  const LAST_DAY_WEEK1 = '2026-09-07T21:00:00+02:00' // day 7, evening

  it('is true on the last day of the week when a day is still missing', () => {
    // days 1–6 checkable; only day 1 filled, so day 2 (and others) are missing
    expect(
      getLastChanceDue({
        profile: profile(),
        checkIns: [checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z' })],
        time: LAST_DAY_WEEK1,
      }),
    ).toBe(true)
  })

  it('is false on the last day when every checkable day of the week is filled', () => {
    // days 1–6 all filled (day 7 itself is "future" on day 7, never counts as missing)
    const filled = ['01', '02', '03', '04', '05', '06'].map((d) =>
      checkIn({ behaviorDate: `2026-09-${d}T00:00:00.000Z` }),
    )
    expect(
      getLastChanceDue({ profile: profile(), checkIns: filled, time: LAST_DAY_WEEK1 }),
    ).toBe(false)
  })

  it('is false when it is not the last day of the week, even with missing days', () => {
    expect(
      getLastChanceDue({
        profile: profile(),
        checkIns: [],
        time: '2026-09-05T21:00:00+02:00', // day 5, missing days but not the last day
      }),
    ).toBe(false)
  })

  it('is true on day 28 (last day of the final week) with a missing day', () => {
    expect(
      getLastChanceDue({
        profile: profile(),
        checkIns: [],
        time: '2026-09-28T21:00:00+02:00', // day 28
      }),
    ).toBe(true)
  })

  it('is false during the final summary (day 29+)', () => {
    expect(
      getLastChanceDue({
        profile: profile(),
        checkIns: [],
        time: '2026-09-29T21:00:00+02:00', // day 29
      }),
    ).toBe(false)
  })

  it('is false before day 1 has started', () => {
    expect(
      getLastChanceDue({
        profile: profile(),
        checkIns: [],
        time: '2026-08-31T21:00:00+02:00',
      }),
    ).toBe(false)
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
