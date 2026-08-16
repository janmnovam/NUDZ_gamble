import { buildDashboardVM, buildDayCell, type DashboardDeps } from '@domain/dashboard.ts'
import type { CheckIn, Limit, Profile } from '@domain/model.ts'
import type { CheckInRepository, LimitRepository, ProfileRepository } from '@domain/ports.ts'

const USER_ID = 'A001'

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

function fakeDeps(params: { checkIns: CheckIn[]; today: string }): DashboardDeps {
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
  const profileRepo: ProfileRepository = {
    get: (userId) => Promise.resolve(userId === USER_ID ? profile : undefined),
    save: () => Promise.resolve(),
  }
  const limitRepo: LimitRepository = {
    listByUser: () => Promise.resolve([limit]),
    save: () => Promise.resolve(),
  }
  const checkInRepo: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  return {
    userId: USER_ID,
    profileRepo,
    limitRepo,
    checkInRepo,
    time: `${params.today}T12:00:00.000Z`,
  }
}

describe('buildDayCell', () => {
  it('carries played/time/stakes only for completed or backfilled cells', () => {
    const record = checkIn({
      behaviorDate: '2026-09-02T00:00:00.000Z',
      submittedAt: '2026-09-03T08:00:00+02:00',
      timeMin: 60,
      stakesCzk: 500,
    })
    expect(
      buildDayCell({
        studyDay: 2,
        date: '2026-09-02T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: record,
      }),
    ).toEqual({
      studyDay: 2,
      date: '2026-09-02T00:00:00.000Z',
      state: 'completed',
      played: true,
      timeMin: 60,
      stakesCzk: 500,
    })
  })

  it('is a bare cell (no usage fields) for missing and future days', () => {
    expect(
      buildDayCell({
        studyDay: 3,
        date: '2026-09-03T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: undefined,
      }),
    ).toEqual({ studyDay: 3, date: '2026-09-03T00:00:00.000Z', state: 'missing' })
    expect(
      buildDayCell({
        studyDay: 5,
        date: '2026-09-05T00:00:00.000Z',
        today: '2026-09-04',
        checkIn: undefined,
      }),
    ).toEqual({ studyDay: 5, date: '2026-09-05T00:00:00.000Z', state: 'future' })
  })
})

describe('buildDashboardVM', () => {
  it('reproduces the CLAUDE.md reference scenario, missing day included', async () => {
    const deps = fakeDeps({
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

    const vm = await buildDashboardVM(deps)

    expect(vm.studyDay).toBe(5)
    expect(vm.weekNo).toBe(1)
    expect(vm.days).toHaveLength(7)
    expect(vm.missingDays).toEqual(['2026-09-02T00:00:00.000Z'])
    expect(vm.time).toEqual({ used: 350, limit: 480, pct: 73, status: 'OK', remaining: 130 })
    expect(vm.stakes).toEqual({
      used: 6_500,
      limit: 8_000,
      pct: 81,
      status: 'POZOR',
      remaining: 1_500,
    })
    expect(vm.overallStatus).toBe('POZOR')
    expect(vm.pendingAction).toBe('checkin_due')
  })

  it('clamps to week 1 before day 1, reading as all-future rather than a broken 0/0 week', async () => {
    const deps = fakeDeps({ today: '2026-08-31', checkIns: [] })
    const vm = await buildDashboardVM(deps)

    expect(vm.studyDay).toBeLessThanOrEqual(0)
    expect(vm.weekNo).toBe(1)
    expect(vm.days.every((d) => d.state === 'future')).toBe(true)
    expect(vm.missingDays).toEqual([])
    expect(vm.pendingAction).toBe('none')
  })
})
