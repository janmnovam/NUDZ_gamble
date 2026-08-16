import { DashboardServiceImpl } from '@/app/services/dashboardServiceImpl.ts'
import type { DashboardServiceDeps } from '@/app/services/dashboardServiceImpl.ts'
import type { Result } from '@/app/result.ts'
import type { CheckIn, Limit, Profile, Review } from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

const USER_ID = 'demo-user'

/** Unwrap a service `Result`, failing the test if it carried an envelope error. */
function data<T>(r: Result<T>): T {
  if (r.error) throw new Error(`unexpected error envelope: ${r.error.type}:${r.error.code}`)
  if (r.data === null) throw new Error('expected data, got null')
  return r.data
}

function checkIn(overrides: Partial<CheckIn>): CheckIn {
  return {
    checkInId: `c-${overrides.behaviorDate ?? ''}`,
    userId: USER_ID,
    weekNo: 1,
    played: true,
    winningsCzk: 0,
    submittedAt: '2026-09-01T08:00:00+02:00',
    updatedAt: null,
    timeMin: 0,
    stakesCzk: 0,
    behaviorDate: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeService(params: { checkIns: CheckIn[]; today: string; noProfile?: boolean }) {
  const profile: Profile = {
    userId: USER_ID,
    onboardingCompletedAt: '2026-08-31T21:30:00+02:00',
    interventionStartDate: '2026-09-01T00:00:00.000Z',
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
  }
  const limit: Limit = {
    limitId: 'l1',
    userId: USER_ID,
    weekNo: 1,
    weeklyLimitTimeMin: 480,
    weeklyLimitStakesCzk: 8_000,
    limitSetAt: '2026-08-31T21:30:00+02:00',
  }
  const profiles: ProfileRepository = {
    get: (userId) => Promise.resolve(!params.noProfile && userId === USER_ID ? profile : undefined),
    getCurrent: () => Promise.resolve(params.noProfile ? undefined : profile),
    save: () => Promise.resolve(),
  }
  const limits: LimitRepository = {
    listByUser: () => Promise.resolve([limit]),
    save: () => Promise.resolve(),
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const reviews: ReviewRepository = {
    listByUser: () => Promise.resolve([]),
    getByWeek: () => Promise.resolve(undefined as unknown as Review | undefined),
    save: () => Promise.resolve(),
  }
  const deps: DashboardServiceDeps = {
    profiles,
    limits,
    checkIns,
    reviews,
  }
  return { service: new DashboardServiceImpl(deps), time: `${params.today}T12:00:00.000Z` }
}

describe('DashboardServiceImpl.getDashboard', () => {
  it('maps the CLAUDE.md reference scenario to the camelCase DTO, missing day included', async () => {
    const { service, time } = makeService({
      today: '2026-09-05',
      checkIns: [
        checkIn({
          behaviorDate: '2026-09-01T00:00:00.000Z',
          submittedAt: '2026-09-02T08:00:00+02:00',
          timeMin: 60,
          stakesCzk: 500,
        }),
        // 2026-09-02 deliberately has no record — the missing-record case.
        checkIn({
          behaviorDate: '2026-09-03T00:00:00.000Z',
          submittedAt: '2026-09-04T08:00:00+02:00',
          timeMin: 150,
          stakesCzk: 3_000,
        }),
        checkIn({
          behaviorDate: '2026-09-04T00:00:00.000Z',
          submittedAt: '2026-09-05T08:00:00+02:00',
          timeMin: 140,
          stakesCzk: 3_000,
        }),
      ],
    })

    const res = data(await service.getDashboard(USER_ID, time))

    expect(res.studyDay).toBe(5)
    expect(res.weekNo).toBe(1)
    expect(res.days).toHaveLength(7)
    expect(res.missingDays).toEqual(['2026-09-02T00:00:00.000Z'])
    expect(res.time).toEqual({ used: 350, limit: 480, percent: 73, status: 'OK', remaining: 130 })
    expect(res.stakes).toEqual({
      used: 6_500,
      limit: 8_000,
      percent: 81,
      status: 'POZOR',
      remaining: 1_500,
    })
    expect(res.overallStatus).toBe('POZOR')
    expect(res.pendingAction).toBe('checkin_due')

    expect(res.days[0]).toEqual({
      studyDay: 1,
      date: '2026-09-01T00:00:00.000Z',
      state: 'completed',
      backfillable: false,
      played: true,
      timeMinutes: 60,
      stakesAmount: 500,
    })
    // Missing day 2 is 3 days back on day 5 → inside the rolling window.
    expect(res.days[1]).toEqual({
      studyDay: 2,
      date: '2026-09-02T00:00:00.000Z',
      state: 'missing',
      backfillable: true,
    })
  })

  it('rejects when no profile has been onboarded yet', async () => {
    const { service, time } = makeService({ today: '2026-09-05', checkIns: [], noProfile: true })
    const res = await service.getDashboard(USER_ID, time)
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('not_found')
    expect(res.error?.code).toBe('DASHBOARD_NO_PROFILE')
  })
})
