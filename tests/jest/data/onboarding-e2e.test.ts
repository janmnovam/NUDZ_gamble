import { AppDatabase, createDataLayer, newId } from '@/core'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { OnboardingInput } from '@domain/onboarding.ts'

const NOW = '2026-09-01T22:30:00.000Z'

const input: OnboardingInput = {
  user_id: 'A001',
  reference_time_min: 600,
  reference_stakes_czk: 10_000,
  limit_time_min: 480,
  limit_stakes_czk: 8_000,
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
    const data = createDataLayer(db, () => NOW)
    await completeOnboarding(input, { repo: data.onboarding, now: () => NOW, newId })

    const profile = await data.profiles.get('A001')
    expect(profile?.intervention_start_date).toBe('2026-09-02')

    const limits = await data.limits.listByUser('A001')
    expect(limits).toHaveLength(1)
    expect(limits[0]?.week_no).toBe(1)
    expect(limits[0]?.weekly_limit_stakes_czk).toBe(8_000)

    const strategies = await data.copingStrategies.listByUser('A001')
    expect(strategies).toHaveLength(1)
    expect(strategies[0]?.active).toBe(true)
  })
})
