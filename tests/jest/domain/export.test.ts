import { buildExportBundle, type ExportDeps } from '@domain/export.ts'
import type { CheckIn, CopingStrategy, Limit } from '@domain/model.ts'
import type { CheckInRepository, CopingStrategyRepository, LimitRepository } from '@domain/ports.ts'

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
    behaviorDate: '2026-09-01',
    ...overrides,
  }
}

function limit(overrides: Partial<Limit>): Limit {
  return {
    limitId: `l-${String(overrides.weekNo ?? 1)}`,
    userId: USER_ID,
    weekNo: 1,
    weeklyLimitTimeMin: 480,
    weeklyLimitStakesCzk: 8_000,
    limitSetAt: '2026-08-31T21:30:00+02:00',
    ...overrides,
  }
}

function coping(overrides: Partial<CopingStrategy>): CopingStrategy {
  return {
    copingStrategyId: `cs-${String(overrides.priority ?? 1)}`,
    userId: USER_ID,
    label: 'Jít na 15 minut ven',
    type: 'default',
    priority: 1,
    active: true,
    createdAt: '2026-08-31T21:30:00+02:00',
    updatedAt: null,
    ...overrides,
  }
}

function fakeDeps(params: {
  checkIns: CheckIn[]
  limits: Limit[]
  copingStrategies: CopingStrategy[]
}): ExportDeps {
  const checkInRepo: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const limitRepo: LimitRepository = {
    listByUser: () => Promise.resolve(params.limits),
    save: () => Promise.resolve(),
  }
  const copingStrategyRepo: CopingStrategyRepository = {
    listByUser: () => Promise.resolve(params.copingStrategies),
    loadDefaults: () => Promise.resolve([]),
    create: (input) =>
      Promise.resolve({
        copingStrategyId: 'new',
        active: true,
        createdAt: '2026-08-31T21:30:00+02:00',
        updatedAt: null,
        ...input,
      }),
    setActive: () => Promise.resolve(),
  }
  return { userId: USER_ID, checkInRepo, limitRepo, copingStrategyRepo }
}

describe('buildExportBundle', () => {
  it('sorts check-ins by behavior_date, limits by week_no, coping strategies by priority', async () => {
    const bundle = await buildExportBundle(
      fakeDeps({
        checkIns: [
          checkIn({ behaviorDate: '2026-09-03' }),
          checkIn({ behaviorDate: '2026-09-01' }),
        ],
        limits: [limit({ weekNo: 2, limitId: 'l2' }), limit({ weekNo: 1, limitId: 'l1' })],
        copingStrategies: [
          coping({ priority: 2, copingStrategyId: 'cs2' }),
          coping({ priority: 1, copingStrategyId: 'cs1' }),
        ],
      }),
    )

    expect(bundle.checkIns.map((c) => c.behaviorDate)).toEqual(['2026-09-01', '2026-09-03'])
    expect(bundle.limits.map((l) => l.weekNo)).toEqual([1, 2])
    expect(bundle.copingStrategies.map((c) => c.copingStrategyId)).toEqual(['cs1', 'cs2'])
  })

  it('passes through an empty table as an empty array, not an error', async () => {
    const bundle = await buildExportBundle(
      fakeDeps({ checkIns: [], limits: [], copingStrategies: [] }),
    )
    expect(bundle).toEqual({ checkIns: [], limits: [], copingStrategies: [] })
  })
})
