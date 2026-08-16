import { DashboardServiceImpl } from '@/app/services/dashboardServiceImpl.ts'
import type { DashboardServiceDeps } from '@/app/services/dashboardServiceImpl.ts'
import type { CheckIn, Limit, Profile, Review } from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

const USER_ID = 'demo-user'

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
    time: () => `${params.today}T12:00:00.000Z`,
    userId: USER_ID,
  }
  return new DashboardServiceImpl(deps)
}

describe('DashboardServiceImpl.getDashboard', () => {
  it('maps the CLAUDE.md reference scenario to the camelCase DTO, missing day included', async () => {
    const service = makeService({
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

    const res = await service.getDashboard()

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
      played: true,
      timeMinutes: 60,
      stakesAmount: 500,
    })
    expect(res.days[1]).toEqual({
      studyDay: 2,
      date: '2026-09-02T00:00:00.000Z',
      state: 'missing',
    })
  })

  it('rejects when no profile has been onboarded yet', async () => {
    const service = makeService({ today: '2026-09-05', checkIns: [], noProfile: true })
    await expect(service.getDashboard()).rejects.toThrow(/no profile/)
  })
})
