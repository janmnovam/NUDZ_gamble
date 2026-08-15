import { OnboardingAdapter } from '@data/adapters/onboardingAdapter.ts'
import { AppDatabase } from '@data/db.ts'
import type { CopingStrategy, Limit, Profile } from '@domain/model.ts'

const NOW = '2026-09-01T22:30:00.000Z'

const profile: Profile = {
  userId: 'A001',
  onboardingCompletedAt: NOW,
  interventionStartDate: '2026-09-02',
  referenceTimeMin: 600,
  referenceStakesCzk: 10_000,
}

const limit: Limit = {
  limitId: 'limit-1',
  userId: 'A001',
  weekNo: 1,
  weeklyLimitTimeMin: 480,
  weeklyLimitStakesCzk: 8_000,
  limitSetAt: NOW,
}

const coping: CopingStrategy[] = [
  {
    copingStrategyId: 'c1',
    userId: 'A001',
    label: 'Jít na 15 minut ven',
    type: 'default',
    priority: 1,
    active: true,
    createdAt: NOW,
    updatedAt: null,
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
    await expect(adapter.save(profile, { ...limit, limitId: 'limit-2' }, coping)).rejects.toThrow()
  })

  it('rolls back the whole write when the limit is a duplicate week', async () => {
    await adapter.save(profile, limit, coping)
    // Second attempt changes the profile AND reuses week 1 -> limits.add throws,
    // so the profile.put in the same transaction must be rolled back.
    await expect(
      adapter.save({ ...profile, referenceTimeMin: 999 }, { ...limit, limitId: 'limit-2' }, coping),
    ).rejects.toThrow()
    expect(await db.profile.get('A001')).toMatchObject({ reference_time_min: 600 })
    expect(await db.coping_strategy.where('user_id').equals('A001').count()).toBe(1)
  })
})
