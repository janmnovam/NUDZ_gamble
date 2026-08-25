import { ReviewServiceImpl, type ReviewServiceDeps } from '@/app/services/reviewServiceImpl.ts'
import { ok, type Result } from '@/app/result.ts'
import type { CheckIn, Limit, Profile, Review } from '@domain/model.ts'

/** Unwrap a service `Result`, failing the test if it carried an envelope error or null data. */
function data<T>(r: Result<T>): NonNullable<T> {
  if (r.error) throw new Error(`unexpected error envelope: ${r.error.type}:${r.error.code}`)
  if (r.data === null || r.data === undefined) throw new Error('expected data, got null')
  return r.data
}
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

const USER_ID = 'demo-user'

// intervention start 2026-09-01 → day 1 = 09-01, week 1 = 09-01..09-07, week 2 starts 09-08.
const START = '2026-09-01'

function checkIn(over: Partial<CheckIn>): CheckIn {
  return {
    checkInId: `c-${over.behaviorDate ?? ''}`,
    userId: USER_ID,
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

function makeService(params: { today: string; checkIns?: CheckIn[]; limits?: Limit[] }) {
  const profile: Profile = {
    userId: USER_ID,
    onboardingCompletedAt: '2026-08-31T21:30:00+02:00',
    interventionStartDate: START,
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
  }
  const limitStore: Limit[] = params.limits ?? [
    {
      limitId: 'l1',
      userId: USER_ID,
      weekNo: 1,
      weeklyLimitTimeMin: 480,
      weeklyLimitStakesCzk: 8_000,
      limitSetAt: '2026-08-31T21:30:00+02:00',
    },
  ]
  const reviewStore: Review[] = []
  let seq = 0

  const profiles: ProfileRepository = {
    get: (u) => Promise.resolve(u === USER_ID ? profile : undefined),
    getCurrent: () => Promise.resolve(profile),
    save: () => Promise.resolve(),
  }
  const limits: LimitRepository = {
    listByUser: () => Promise.resolve([...limitStore]),
    save: (l) => {
      limitStore.push(l)
      return Promise.resolve()
    },
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns ?? []),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const reviews: ReviewRepository = {
    listByUser: () => Promise.resolve([...reviewStore]),
    getByWeek: (_u, w) => Promise.resolve(reviewStore.find((r) => r.reviewWeekNo === w)),
    save: (r) => {
      reviewStore.push(r)
      return Promise.resolve()
    },
  }
  const deps: ReviewServiceDeps = {
    profiles,
    limits,
    checkIns,
    reviews,
    newId: () => `id-${String((seq += 1))}`,
  }
  // "today" is the calendar date of the instant passed per call; a fixed 09:00Z
  // instant keeps the day stable and doubles as the `reviewCompletedAt` stamp.
  const time = `${params.today}T09:00:00.000Z`
  return { service: new ReviewServiceImpl(deps), time, reviewStore, limitStore }
}

describe('ReviewServiceImpl', () => {
  const week1CheckIns = [
    checkIn({ behaviorDate: '2026-09-01T00:00:00.000Z', timeMin: 350, stakesCzk: 6_500 }),
  ]

  it('surfaces the elapsed, unreviewed week with totals, missing days, suggested limits', async () => {
    const { service, time } = makeService({ today: '2026-09-08', checkIns: week1CheckIns })
    await expect(service.getPendingReview(USER_ID, time)).resolves.toEqual(
      ok({
        weekNo: 1,
        time: { used: 350, limit: 480, status: 'OK' },
        stakes: { used: 6_500, limit: 8_000, status: 'POZOR' },
        missingDays: [
          '2026-09-02T00:00:00.000Z',
          '2026-09-03T00:00:00.000Z',
          '2026-09-04T00:00:00.000Z',
          '2026-09-05T00:00:00.000Z',
          '2026-09-06T00:00:00.000Z',
          '2026-09-07T00:00:00.000Z',
        ],
        // The week's last day (07, "yesterday" on day 8) is unfilled and still
        // fillable, so it blocks the review until filled. Earlier gaps don't.
        blockingCheckInDay: '2026-09-07T00:00:00.000Z',
        suggestedNextLimits: { timeMinutes: 480, stakesAmount: 8_000 },
      }),
    )
  })

  it('returns null while the current week has not elapsed', async () => {
    const { service, time } = makeService({ today: '2026-09-04', checkIns: week1CheckIns })
    await expect(service.getPendingReview(USER_ID, time)).resolves.toEqual(ok(null))
  })

  it('blocks the review on day 7 when it is the sole gap at review time (day 8)', async () => {
    // The reported case: days 1–6 checked in on their own mornings, day 7 still
    // due when the week-1 review opens. The review must send the user to fill
    // day 7 before it can close the week.
    const daysOneToSix = [1, 2, 3, 4, 5, 6].map((d) =>
      checkIn({ behaviorDate: `2026-09-0${String(d)}T00:00:00.000Z` }),
    )
    const { service, time } = makeService({ today: '2026-09-08', checkIns: daysOneToSix })
    const review = data(await service.getPendingReview(USER_ID, time))
    expect(review.missingDays).toEqual(['2026-09-07T00:00:00.000Z'])
    expect(review.blockingCheckInDay).toBe('2026-09-07T00:00:00.000Z')
  })

  it('does not block on an earlier gap once the last day itself is filled (day 8)', async () => {
    // Only the week's last day gates the review. Day 7 filled, day 6 still an
    // in-window gap — the review proceeds (day 6 stays NA), so no block.
    const withoutDaySix = [1, 2, 3, 4, 5, 7].map((d) =>
      checkIn({ behaviorDate: `2026-09-0${String(d)}T00:00:00.000Z` }),
    )
    const { service, time } = makeService({ today: '2026-09-08', checkIns: withoutDaySix })
    const review = data(await service.getPendingReview(USER_ID, time))
    expect(review.missingDays).toEqual(['2026-09-06T00:00:00.000Z'])
    expect(review.blockingCheckInDay).toBeNull()
  })

  it('stops blocking once the last day has aged out of the window (day 13)', async () => {
    // On day 13 the 5-day window reaches back only to day 8; day 7 is NA now, so
    // it no longer blocks — the review can close the week as incomplete.
    const { service, time } = makeService({ today: '2026-09-13', checkIns: week1CheckIns })
    const review = data(await service.getPendingReview(USER_ID, time))
    expect(review.missingDays).toContain('2026-09-07T00:00:00.000Z')
    expect(review.blockingCheckInDay).toBeNull()
  })

  it('completeReview writes a review + next week limit and closes the week', async () => {
    const { service, time, reviewStore, limitStore } = makeService({
      today: '2026-09-08',
      checkIns: week1CheckIns,
    })
    await service.completeReview(
      {
        reviewWeekNo: 1,
        nextLimits: { timeMinutes: 460, stakesAmount: 7_500 },
        incomplete: false,
      },
      USER_ID,
      time,
    )
    expect(reviewStore[0]).toMatchObject({
      reviewWeekNo: 1,
      limitChanged: true,
      incomplete: false,
      reviewCompletedAt: '2026-09-08T09:00:00.000Z',
    })
    expect(limitStore.find((l) => l.weekNo === 2)).toMatchObject({
      weeklyLimitTimeMin: 460,
      weeklyLimitStakesCzk: 7_500,
    })
    await expect(service.getPendingReview(USER_ID, time)).resolves.toEqual(ok(null))
  })

  it('reports a validation error for next limits above the 90% cap', async () => {
    const { service, time } = makeService({ today: '2026-09-08', checkIns: week1CheckIns })
    const res = await service.completeReview(
      {
        reviewWeekNo: 1,
        nextLimits: { timeMinutes: 541, stakesAmount: 7_500 },
        incomplete: false,
      },
      USER_ID,
      time,
    )
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('REVIEW_TIME_CAP')
  })

  it('getFinalSummary reports per-week statuses without setting limits', async () => {
    const { service, time } = makeService({ today: '2026-10-01', checkIns: week1CheckIns })
    const summary = data(await service.getFinalSummary(USER_ID, time))
    expect(summary.weeks).toHaveLength(4)
    expect(summary.weeks[0]).toMatchObject({
      weekNo: 1,
      timeStatus: 'OK',
      stakesStatus: 'POZOR',
      overall: 'POZOR',
    })
    expect(summary.weeks[1]).toMatchObject({
      weekNo: 2,
      timeStatus: 'OK',
      stakesStatus: 'OK',
      overall: 'OK',
    })
  })

  it('getFinalSummary carries the usage the statuses were derived from', async () => {
    const { service, time } = makeService({ today: '2026-10-01', checkIns: week1CheckIns })
    const summary = data(await service.getFinalSummary(USER_ID, time))

    // Without these the screens could only show a verdict, not the numbers behind it.
    expect(summary.weeks[0]?.time.limit).toBeGreaterThan(0)
    expect(summary.weeks[0]?.stakes.used).toBeGreaterThan(0)
  })

  it('getFinalSummary marks days without a record as missing, never as zeros', async () => {
    const { service, time } = makeService({ today: '2026-10-01', checkIns: week1CheckIns })
    const summary = data(await service.getFinalSummary(USER_ID, time))
    const week1 = summary.weeks[0]

    expect(week1?.days).toHaveLength(7)
    expect(week1?.days.map((d) => d.studyDay)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(week1?.filledDays).toBe(week1?.days.filter((d) => d.state === 'completed').length)
    // A week with gaps must not report itself as fully filled.
    expect(week1?.filledDays).toBeLessThan(7)
  })

  it('getFinalSummary reports the programme day it was read on', async () => {
    const { service, time } = makeService({ today: '2026-10-01', checkIns: week1CheckIns })
    const summary = data(await service.getFinalSummary(USER_ID, time))

    expect(summary.studyDay).toBeGreaterThan(28)
  })
})
