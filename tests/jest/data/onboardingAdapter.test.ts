import { OnboardingAdapter } from '@data/adapters/onboardingAdapter.ts'
import { AppDatabase } from '@data/db.ts'
import type { CopingStrategy, Limit, Profile } from '@domain/model.ts'

const NOW = '2026-09-01T22:30:00.000Z'

const profile: Profile = {
  user_id: 'A001',
  onboarding_completed_at: NOW,
  intervention_start_date: '2026-09-02',
  reference_time_min: 600,
  reference_stakes_czk: 10_000,
}

const limit: Limit = {
  limit_id: 'limit-1',
  user_id: 'A001',
  week_no: 1,
  weekly_limit_time_min: 480,
  weekly_limit_stakes_czk: 8_000,
  limit_set_at: NOW,
}

const coping: CopingStrategy[] = [
  {
    coping_strategy_id: 'c1',
    user_id: 'A001',
    label: 'Jít na 15 minut ven',
    type: 'default',
    priority: 1,
    active: true,
    created_at: NOW,
    updated_at: null,
  },
]

describe('OnboardingAdapter', () => {
  let db: AppDatabase
  let adapter: OnboardingAdapter

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    adapter = new OnboardingAdapter(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('persists profile, week-1 limit, and coping together', async () => {
    await adapter.save(profile, limit, coping)
    expect(await db.profile.get('A001')).toMatchObject({ reference_time_min: 600 })
    expect(await db.limits.where('user_id').equals('A001').count()).toBe(1)
    expect(await db.coping_strategy.where('user_id').equals('A001').count()).toBe(1)
  })

  it('rejects a second onboarding for the same week (append-only index)', async () => {
    await adapter.save(profile, limit, coping)
    await expect(adapter.save(profile, { ...limit, limit_id: 'limit-2' }, coping)).rejects.toThrow()
  })

  it('rolls back the whole write when the limit is a duplicate week', async () => {
    await adapter.save(profile, limit, coping)
    // Second attempt changes the profile AND reuses week 1 -> limits.add throws,
    // so the profile.put in the same transaction must be rolled back.
    await expect(
      adapter.save(
        { ...profile, reference_time_min: 999 },
        { ...limit, limit_id: 'limit-2' },
        coping,
      ),
    ).rejects.toThrow()
    expect(await db.profile.get('A001')).toMatchObject({ reference_time_min: 600 })
    expect(await db.coping_strategy.where('user_id').equals('A001').count()).toBe(1)
  })
})
