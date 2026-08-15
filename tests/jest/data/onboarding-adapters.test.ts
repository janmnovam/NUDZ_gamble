import { type DataLayer } from '@/core/ports'
import { type Limit, type Profile } from '@/core/model'
import { AppDatabase, createDataLayer } from '@data/index'

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
    user_id: 'A001',
    onboarding_completed_at: FIXED_NOW,
    intervention_start_date: '2026-09-02',
    reference_time_min: 600,
    reference_stakes_czk: 10_000,
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
    await data.copingStrategies.create({
      user_id: 'A001',
      label: 'Zavolat bratrovi',
      type: 'custom',
      priority: 2,
    })
    const adopted = await data.copingStrategies.create({
      user_id: 'A001',
      label: 'Jít na 15 minut ven',
      type: 'default',
      priority: 1,
    })

    const list = await data.copingStrategies.listByUser('A001')
    expect(list.map((s) => s.type)).toEqual(['default', 'custom'])
    expect(adopted.coping_strategy_id).toHaveLength(36)
    expect(adopted.active).toBe(true)
    expect(adopted.created_at).toBe(FIXED_NOW)
  })

  it('deactivates a coping strategy', async () => {
    const s = await data.copingStrategies.create({
      user_id: 'A001',
      label: 'Dechové cvičení',
      type: 'default',
      priority: 1,
    })
    await data.copingStrategies.setActive(s.coping_strategy_id, false)

    const [reloaded] = await data.copingStrategies.listByUser('A001')
    expect(reloaded?.active).toBe(false)
    expect(reloaded?.updated_at).toBe(FIXED_NOW)
  })

  it('rejects setActive on an unknown id', async () => {
    await expect(data.copingStrategies.setActive('nope', true)).rejects.toThrow('not found')
  })

  const week1Limit: Limit = {
    limit_id: 'limit-1',
    user_id: 'A001',
    week_no: 1,
    weekly_limit_time_min: 480,
    weekly_limit_stakes_czk: 8_000,
    limit_set_at: FIXED_NOW,
  }

  it('saves a weekly limit', async () => {
    await data.limits.save(week1Limit)
    const limits = await data.limits.listByUser('A001')
    expect(limits).toHaveLength(1)
    expect(limits[0]?.weekly_limit_time_min).toBe(480)
  })

  it('enforces one limit per week (append-only)', async () => {
    await data.limits.save(week1Limit)
    await expect(
      data.limits.save({ ...week1Limit, limit_id: 'limit-2', weekly_limit_time_min: 400 }),
    ).rejects.toThrow()
  })
})
