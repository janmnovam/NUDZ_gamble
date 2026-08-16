import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { Limit, Profile } from '@domain/model.ts'

/** Exercises the onboarding write path end to end against fake-indexeddb. */
describe('onboarding adapters', () => {
  const FIXED_NOW = '2026-09-01T08:00:00.000Z'
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db, () => FIXED_NOW)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  const profile: Profile = {
    userId: 'A001',
    onboardingCompletedAt: FIXED_NOW,
    interventionStartDate: '2026-09-02',
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
  }

  it('saves and reads the profile', async () => {
    await data.profiles.save(profile)
    await expect(data.profiles.get('A001')).resolves.toEqual(profile)
  })

  it('loads the predefined coping defaults', async () => {
    const defaults = await data.copingStrategies.loadDefaults()
    expect(defaults.length).toBeGreaterThanOrEqual(1)
    expect(defaults[0]).toHaveProperty('code')
  })

  it('writes custom + adopted-default coping and lists them by priority', async () => {
    await data.copingStrategies.create(
      {
        userId: 'A001',
        label: 'Zavolat bratrovi',
        type: 'custom',
        priority: 2,
      },
      FIXED_NOW,
    )
    const adopted = await data.copingStrategies.create(
      {
        userId: 'A001',
        label: 'Jít na 15 minut ven',
        type: 'default',
        priority: 1,
      },
      FIXED_NOW,
    )

    const list = await data.copingStrategies.listByUser('A001')
    expect(list.map((s) => s.type)).toEqual(['default', 'custom'])
    expect(adopted.copingStrategyId).toHaveLength(36)
    expect(adopted.active).toBe(true)
    expect(adopted.createdAt).toBe(FIXED_NOW)
  })

  it('deactivates a coping strategy', async () => {
    const s = await data.copingStrategies.create(
      {
        userId: 'A001',
        label: 'Dechové cvičení',
        type: 'default',
        priority: 1,
      },
      FIXED_NOW,
    )
    await data.copingStrategies.setActive(s.copingStrategyId, false, FIXED_NOW)

    const [reloaded] = await data.copingStrategies.listByUser('A001')
    expect(reloaded?.active).toBe(false)
    expect(reloaded?.updatedAt).toBe(FIXED_NOW)
  })

  it('rejects setActive on an unknown id', async () => {
    await expect(data.copingStrategies.setActive('nope', true, FIXED_NOW)).rejects.toThrow(
      'not found',
    )
  })

  const week1Limit: Limit = {
    limitId: 'limit-1',
    userId: 'A001',
    weekNo: 1,
    weeklyLimitTimeMin: 480,
    weeklyLimitStakesCzk: 8_000,
    limitSetAt: FIXED_NOW,
  }

  it('saves a weekly limit', async () => {
    await data.limits.save(week1Limit)
    const limits = await data.limits.listByUser('A001')
    expect(limits).toHaveLength(1)
    expect(limits[0]?.weeklyLimitTimeMin).toBe(480)
  })

  it('enforces one limit per week (append-only)', async () => {
    await data.limits.save(week1Limit)
    await expect(
      data.limits.save({ ...week1Limit, limitId: 'limit-2', weeklyLimitTimeMin: 400 }),
    ).rejects.toThrow()
  })
})
