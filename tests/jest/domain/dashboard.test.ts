import { buildDashboardVM, buildDayCell, type DashboardDeps } from '@domain/dashboard.ts'
import type { CheckIn, Limit, Profile } from '@domain/model.ts'
import type { CheckInRepository, LimitRepository, ProfileRepository } from '@domain/ports.ts'

const USER_ID = 'A001'

function checkIn(overrides: Partial<CheckIn>): CheckIn {
  return {
    check_in_id: `c-${overrides.behavior_date ?? ''}`,
    user_id: USER_ID,
    week_no: 1,
    played: true,
    winnings_czk: 0,
    submitted_at: '2026-09-01T08:00:00+02:00',
    updated_at: null,
    time_min: 0,
    stakes_czk: 0,
    behavior_date: '2026-09-01',
    ...overrides,
  }
}

function fakeDeps(params: { checkIns: CheckIn[]; today: string }): DashboardDeps {
  const profile: Profile = {
    user_id: USER_ID,
    onboarding_completed_at: '2026-08-31T21:30:00+02:00',
    intervention_start_date: '2026-09-01',
    reference_time_min: 600,
    reference_stakes_czk: 10_000,
  }
  const limit: Limit = {
    limit_id: 'l1',
    user_id: USER_ID,
    week_no: 1,
    weekly_limit_time_min: 480,
    weekly_limit_stakes_czk: 8_000,
    limit_set_at: '2026-08-31T21:30:00+02:00',
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
    user_id: USER_ID,
    profileRepo,
    limitRepo,
    checkInRepo,
    today: { today: () => params.today },
  }
}

describe('buildDayCell', () => {
  it('carries played/time/stakes only for completed or backfilled cells', () => {
    const record = checkIn({
      behavior_date: '2026-09-02',
      submitted_at: '2026-09-03T08:00:00+02:00',
      time_min: 60,
      stakes_czk: 500,
    })
    expect(
      buildDayCell({ study_day: 2, date: '2026-09-02', today: '2026-09-04', check_in: record }),
    ).toEqual({
      study_day: 2,
      date: '2026-09-02',
      state: 'completed',
      played: true,
      time_min: 60,
      stakes_czk: 500,
    })
  })

  it('is a bare cell (no usage fields) for missing and future days', () => {
    expect(
      buildDayCell({ study_day: 3, date: '2026-09-03', today: '2026-09-04', check_in: undefined }),
    ).toEqual({ study_day: 3, date: '2026-09-03', state: 'missing' })
    expect(
      buildDayCell({ study_day: 5, date: '2026-09-05', today: '2026-09-04', check_in: undefined }),
    ).toEqual({ study_day: 5, date: '2026-09-05', state: 'future' })
  })
})

describe('buildDashboardVM', () => {
  it('reproduces the CLAUDE.md reference scenario, missing day included', async () => {
    const deps = fakeDeps({
      today: '2026-09-05',
      checkIns: [
        checkIn({
          behavior_date: '2026-09-01',
          submitted_at: '2026-09-02T08:00:00+02:00',
          time_min: 60,
          stakes_czk: 500,
        }),
        // 2026-09-02 deliberately has no record — the missing-record case.
        checkIn({
          behavior_date: '2026-09-03',
          submitted_at: '2026-09-04T08:00:00+02:00',
          time_min: 150,
          stakes_czk: 3_000,
        }),
        checkIn({
          behavior_date: '2026-09-04',
          submitted_at: '2026-09-05T08:00:00+02:00',
          time_min: 140,
          stakes_czk: 3_000,
        }),
      ],
    })

    const vm = await buildDashboardVM(deps)

    expect(vm.study_day).toBe(5)
    expect(vm.week_no).toBe(1)
    expect(vm.days).toHaveLength(7)
    expect(vm.missing_days).toEqual(['2026-09-02'])
    expect(vm.time).toEqual({ used: 350, limit: 480, pct: 73, status: 'OK', remaining: 130 })
    expect(vm.stakes).toEqual({
      used: 6_500,
      limit: 8_000,
      pct: 81,
      status: 'POZOR',
      remaining: 1_500,
    })
    expect(vm.overall_status).toBe('POZOR')
    expect(vm.pending_action).toBe('checkin_due')
  })

  it('clamps to week 1 before day 1, reading as all-future rather than a broken 0/0 week', async () => {
    const deps = fakeDeps({ today: '2026-08-31', checkIns: [] })
    const vm = await buildDashboardVM(deps)

    expect(vm.study_day).toBeLessThanOrEqual(0)
    expect(vm.week_no).toBe(1)
    expect(vm.days.every((d) => d.state === 'future')).toBe(true)
    expect(vm.missing_days).toEqual([])
    expect(vm.pending_action).toBe('none')
  })
})
