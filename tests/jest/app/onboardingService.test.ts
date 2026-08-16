import type { OnboardingProfileRequest, ReferenceWeekRequest } from '@/app/dto/onboarding.ts'
import { OnboardingServiceImpl } from '@/app/services/onboardingServiceImpl.ts'
import type { OnboardingServiceDeps } from '@/app/services/onboardingServiceImpl.ts'
import { ok } from '@/app/result.ts'
import type { CopingStrategy, Limit, Profile } from '@domain/model.ts'

const FIXED_NOW = '2026-09-01T22:30:00.000Z'

function makeService(existingProfile?: Profile) {
  const saved: { profile?: Profile; limit?: Limit; coping?: CopingStrategy[] } = {}
  let counter = 0
  const deps: OnboardingServiceDeps = {
    newId: () => `id-${String((counter += 1))}`,
    repo: {
      save: (profile, limit, coping) => {
        saved.profile = profile
        saved.limit = limit
        saved.coping = coping
        return Promise.resolve()
      },
    },
    profiles: {
      get: () => Promise.resolve(saved.profile ?? existingProfile),
      getCurrent: () => Promise.resolve(saved.profile ?? existingProfile),
      save: () => Promise.resolve(),
    },
  }
  return { service: new OnboardingServiceImpl(deps), saved }
}

const reference: ReferenceWeekRequest = { timeMinutes: 600, stakesAmount: 10_000 }

const completeRequest: OnboardingProfileRequest = {
  reference: { timeMinutes: 600, stakesAmount: 10_000 },
  limits: { timeMinutes: 480, stakesAmount: 8_000 },
  coping: [
    { id: 'go_outside', label: 'Jít na 15 minut ven', type: 'default' },
    { id: 'custom', label: 'Zavolat bratrovi', type: 'custom' },
  ],
}

describe('OnboardingServiceImpl.getStatus', () => {
  it('reports not completed when no profile is stored', async () => {
    const { service } = makeService()
    await expect(service.getStatus(FIXED_NOW)).resolves.toEqual(
      ok({
        userId: null,
        completed: false,
        completedAt: null,
      }),
    )
  })

  it('reports completed once a profile exists', async () => {
    const profile: Profile = {
      userId: 'demo-user',
      onboardingCompletedAt: FIXED_NOW,
      interventionStartDate: '2026-09-01T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10_000,
    }
    const { service } = makeService(profile)
    await expect(service.getStatus(FIXED_NOW)).resolves.toEqual(
      ok({
        userId: 'demo-user',
        completed: true,
        completedAt: FIXED_NOW,
      }),
    )
  })

  it('reports completed right after complete() persists the profile', async () => {
    const { service } = makeService()
    const created = await service.complete(completeRequest, FIXED_NOW)
    // getStatus resolves the current user from the stored profile — the id the
    // service just minted.
    await expect(service.getStatus(FIXED_NOW)).resolves.toEqual(
      ok({
        userId: created.data?.userId ?? '',
        completed: true,
        completedAt: FIXED_NOW,
      }),
    )
  })
})

describe('OnboardingServiceImpl.getSuggestedLimits', () => {
  it('suggests 80% of the reference for time and money, with percentages', async () => {
    const { service } = makeService()
    await expect(service.getSuggestedLimits(reference, FIXED_NOW)).resolves.toEqual(
      ok({
        timeMinutes: 480,
        stakesAmount: 8_000,
        timePercent: 80,
        stakePercent: 80,
        timeCapMinutes: 540,
        stakesCapAmount: 9_000,
        capPercent: 90,
      }),
    )
  })
})

describe('OnboardingServiceImpl.complete', () => {
  it('persists profile + week-1 limit + coping and echoes the onboarding-day start', async () => {
    const { service, saved } = makeService()
    const res = await service.complete(completeRequest, FIXED_NOW)

    expect(saved.profile).toMatchObject({
      referenceTimeMin: 600,
      referenceStakesCzk: 10_000,
      interventionStartDate: '2026-09-01T00:00:00.000Z',
    })
    expect(saved.limit).toMatchObject({
      weekNo: 1,
      weeklyLimitTimeMin: 480,
      weeklyLimitStakesCzk: 8_000,
    })
    expect(saved.coping?.map((c) => [c.label, c.priority])).toEqual([
      ['Jít na 15 minut ven', 1],
      ['Zavolat bratrovi', 2],
    ])

    // The service mints the id (first `newId()` call → `id-1` in this fake).
    expect(res).toEqual(
      ok({
        userId: 'id-1',
        reference: { timeMinutes: 600, stakesAmount: 10_000 },
        limits: { timeMinutes: 480, stakesAmount: 8_000 },
        coping: completeRequest.coping,
        interventionStartDate: '2026-09-01T00:00:00.000Z',
      }),
    )
  })

  it('reports a validation error for a time limit above the 90% cap and writes nothing', async () => {
    const { service, saved } = makeService()
    const res = await service.complete(
      { ...completeRequest, limits: { timeMinutes: 541, stakesAmount: 8_000 } },
      FIXED_NOW,
    )
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('ONBOARDING_TIME_CAP')
    expect(saved.profile).toBeUndefined()
  })

  it('reports a validation error for a stakes limit above the 90% cap', async () => {
    const { service } = makeService()
    const res = await service.complete(
      { ...completeRequest, limits: { timeMinutes: 480, stakesAmount: 9_001 } },
      FIXED_NOW,
    )
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('ONBOARDING_STAKES_CAP')
  })
})
