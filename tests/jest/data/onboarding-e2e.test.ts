import { AppDatabase, createDataLayer, newId } from '@/core'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { OnboardingInput } from '@domain/onboarding.ts'

const NOW = '2026-09-01T22:30:00.000Z'

const input: OnboardingInput = {
  userId: 'A001',
  referenceTimeMin: 600,
  referenceStakesCzk: 10_000,
  limitTimeMin: 480,
  limitStakesCzk: 8_000,
  coping: [{ label: 'Jít na 15 minut ven', type: 'default' }],
}

describe('onboarding end to end', () => {
  let db: AppDatabase

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('completeOnboarding writes profile, limit, and coping via data.onboarding', async () => {
    const data = createDataLayer(db)
    await completeOnboarding(input, {
      repo: data.onboarding,
      time: NOW,
      newId,
    })

    const profile = await data.profiles.get('A001')
    expect(profile?.interventionStartDate).toBe('2026-09-02T00:00:00.000Z')

    const limits = await data.limits.listByUser('A001')
    expect(limits).toHaveLength(1)
    expect(limits[0]?.weekNo).toBe(1)
    expect(limits[0]?.weeklyLimitStakesCzk).toBe(8_000)

    const strategies = await data.copingStrategies.listByUser('A001')
    expect(strategies).toHaveLength(1)
    expect(strategies[0]?.active).toBe(true)
  })
})
