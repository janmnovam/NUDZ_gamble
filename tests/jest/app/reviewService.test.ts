import { ReviewServiceImpl, type ReviewServiceDeps } from '@/app/services/reviewServiceImpl.ts'
import type { CheckIn, Limit, Profile, Review } from '@domain/model.ts'
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
    userId: USER_ID,
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
    await expect(service.getPendingReview(time)).resolves.toEqual({
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
      suggestedNextLimits: { timeMinutes: 480, stakesAmount: 8_000 },
    })
  })

  it('returns null while the current week has not elapsed', async () => {
    const { service, time } = makeService({ today: '2026-09-04', checkIns: week1CheckIns })
    await expect(service.getPendingReview(time)).resolves.toBeNull()
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
    await expect(service.getPendingReview(time)).resolves.toBeNull()
  })

  it('completeReview rejects next limits above the 90% cap', async () => {
    const { service, time } = makeService({ today: '2026-09-08', checkIns: week1CheckIns })
    await expect(
      service.completeReview(
        {
          reviewWeekNo: 1,
          nextLimits: { timeMinutes: 541, stakesAmount: 7_500 },
          incomplete: false,
        },
        time,
      ),
    ).rejects.toThrow(/cap/)
  })

  it('getFinalSummary reports per-week statuses without setting limits', async () => {
    const { service, time } = makeService({ today: '2026-10-01', checkIns: week1CheckIns })
    const summary = await service.getFinalSummary(time)
    expect(summary.weeks).toHaveLength(4)
    expect(summary.weeks[0]).toEqual({
      weekNo: 1,
      timeStatus: 'OK',
      stakesStatus: 'POZOR',
      overall: 'POZOR',
    })
    expect(summary.weeks[1]).toEqual({
      weekNo: 2,
      timeStatus: 'OK',
      stakesStatus: 'OK',
      overall: 'OK',
    })
  })
})
