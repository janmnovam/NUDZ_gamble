import type { CopingStrategy, Limit, Profile } from '@domain/model.ts'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { OnboardingDeps, OnboardingInput } from '@domain/onboarding.ts'

const FIXED_NOW = '2026-09-01T22:30:00.000Z'

function fakeDeps() {
  const saved: { profile?: Profile; limit?: Limit; coping?: CopingStrategy[] } = {}
  let counter = 0
  const deps: OnboardingDeps = {
    time: FIXED_NOW,
    newId: () => `id-${String((counter += 1))}`,
    repo: {
      save: (profile, limit, coping) => {
        saved.profile = profile
        saved.limit = limit
        saved.coping = coping
        return Promise.resolve()
      },
    },
  }
  return { deps, saved }
}

const baseInput: OnboardingInput = {
  userId: 'A001',
  referenceTimeMin: 600,
  referenceStakesCzk: 10_000,
  limitTimeMin: 480,
  limitStakesCzk: 8_000,
  coping: [
    { label: 'Jít na 15 minut ven', type: 'default' },
    { label: 'Zavolat bratrovi', type: 'custom' },
  ],
}

describe('completeOnboarding', () => {
  it('writes a profile that starts the intervention on the onboarding day', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding(baseInput, deps)
    expect(saved.profile).toMatchObject({
      userId: 'A001',
      onboardingCompletedAt: FIXED_NOW,
      // Day 1 is the day onboarding was completed, not the day after.
      interventionStartDate: '2026-09-01T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10_000,
    })
  })

  it('writes the week-1 limit from the adjusted values', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding(baseInput, deps)
    expect(saved.limit).toMatchObject({
      userId: 'A001',
      weekNo: 1,
      weeklyLimitTimeMin: 480,
      weeklyLimitStakesCzk: 8_000,
      limitSetAt: FIXED_NOW,
    })
    expect(saved.limit?.limitId).toBeTruthy()
  })

  it('writes coping strategies in order, active, priority 1..n', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding(baseInput, deps)
    expect(saved.coping?.map((c) => [c.label, c.priority, c.active, c.type])).toEqual([
      ['Jít na 15 minut ven', 1, true, 'default'],
      ['Zavolat bratrovi', 2, true, 'custom'],
    ])
  })

  it('accepts a limit exactly at the 90% cap', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding({ ...baseInput, limitTimeMin: 540, limitStakesCzk: 9_000 }, deps)
    expect(saved.limit?.weeklyLimitTimeMin).toBe(540)
  })

  it('rejects a time limit above the 90% cap and writes nothing', async () => {
    const { deps, saved } = fakeDeps()
    await expect(completeOnboarding({ ...baseInput, limitTimeMin: 541 }, deps)).rejects.toThrow(
      /time limit/,
    )
    expect(saved.profile).toBeUndefined()
  })

  it('rejects a stakes limit above the 90% cap', async () => {
    const { deps } = fakeDeps()
    await expect(completeOnboarding({ ...baseInput, limitStakesCzk: 9_001 }, deps)).rejects.toThrow(
      /stakes limit/,
    )
  })

  it('requires at least one coping strategy', async () => {
    const { deps } = fakeDeps()
    await expect(completeOnboarding({ ...baseInput, coping: [] }, deps)).rejects.toThrow(/coping/)
  })

  it("starts the intervention on the instant's local date, not its UTC date", async () => {
    // Same instant as FIXED_NOW (22:30Z on the 1st) but expressed with a +02:00
    // offset, so its local date is already the 2nd. The start must follow that
    // local date, proving `dateOf` reads the offset rather than the UTC day —
    // otherwise onboarding late in the evening would start a day early.
    const { deps, saved } = fakeDeps()
    deps.time = '2026-09-02T00:30:00.000+02:00'
    await completeOnboarding(baseInput, deps)
    expect(saved.profile?.interventionStartDate).toBe('2026-09-02T00:00:00.000Z')
  })
})
