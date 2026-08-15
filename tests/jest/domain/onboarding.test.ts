import type { CopingStrategy, Limit, Profile } from '@domain/model.ts'
import { completeOnboarding } from '@domain/onboarding.ts'
import type { OnboardingDeps, OnboardingInput } from '@domain/onboarding.ts'

const FIXED_NOW = '2026-09-01T22:30:00.000Z'
const FIXED_TODAY = '2026-09-01'

function fakeDeps() {
  const saved: { profile?: Profile; limit?: Limit; coping?: CopingStrategy[] } = {}
  let counter = 0
  const deps: OnboardingDeps = {
    now: () => FIXED_NOW,
    today: { today: () => FIXED_TODAY },
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
  user_id: 'A001',
  reference_time_min: 600,
  reference_stakes_czk: 10_000,
  limit_time_min: 480,
  limit_stakes_czk: 8_000,
  coping: [
    { label: 'Jít na 15 minut ven', type: 'default' },
    { label: 'Zavolat bratrovi', type: 'custom' },
  ],
}

describe('completeOnboarding', () => {
  it('writes a profile with the reference and next-day intervention start', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding(baseInput, deps)
    expect(saved.profile).toMatchObject({
      user_id: 'A001',
      onboarding_completed_at: FIXED_NOW,
      intervention_start_date: '2026-09-02',
      reference_time_min: 600,
      reference_stakes_czk: 10_000,
    })
  })

  it('writes the week-1 limit from the adjusted values', async () => {
    const { deps, saved } = fakeDeps()
    await completeOnboarding(baseInput, deps)
    expect(saved.limit).toMatchObject({
      user_id: 'A001',
      week_no: 1,
      weekly_limit_time_min: 480,
      weekly_limit_stakes_czk: 8_000,
      limit_set_at: FIXED_NOW,
    })
    expect(saved.limit?.limit_id).toBeTruthy()
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
    await completeOnboarding({ ...baseInput, limit_time_min: 540, limit_stakes_czk: 9_000 }, deps)
    expect(saved.limit?.weekly_limit_time_min).toBe(540)
  })

  it('rejects a time limit above the 90% cap and writes nothing', async () => {
    const { deps, saved } = fakeDeps()
    await expect(completeOnboarding({ ...baseInput, limit_time_min: 541 }, deps)).rejects.toThrow(
      /time limit/,
    )
    expect(saved.profile).toBeUndefined()
  })

  it('rejects a stakes limit above the 90% cap', async () => {
    const { deps } = fakeDeps()
    await expect(
      completeOnboarding({ ...baseInput, limit_stakes_czk: 9_001 }, deps),
    ).rejects.toThrow(/stakes limit/)
  })

  it('requires at least one coping strategy', async () => {
    const { deps } = fakeDeps()
    await expect(completeOnboarding({ ...baseInput, coping: [] }, deps)).rejects.toThrow(/coping/)
  })

  it('starts the intervention the day after the local today, not the UTC instant', async () => {
    // Late-evening UTC instant whose local date (in a zone ahead of UTC) is
    // already the next day — proves the start date follows `today`, not `now`.
    const { deps, saved } = fakeDeps()
    deps.today = { today: () => '2026-09-02' }
    await completeOnboarding(baseInput, deps)
    expect(saved.profile?.intervention_start_date).toBe('2026-09-03')
  })
})
