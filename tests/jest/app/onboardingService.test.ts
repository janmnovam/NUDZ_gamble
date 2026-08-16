import type { OnboardingProfileRequest, ReferenceWeekRequest } from '@/app/dto/onboarding.ts'
import { OnboardingServiceImpl } from '@/app/services/onboardingServiceImpl.ts'
import type { OnboardingServiceDeps } from '@/app/services/onboardingServiceImpl.ts'
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
    await expect(service.getStatus('demo-user', FIXED_NOW)).resolves.toEqual({
      userId: 'demo-user',
      completed: false,
      completedAt: null,
    })
  })

  it('reports completed once a profile exists', async () => {
    const profile: Profile = {
      userId: 'demo-user',
      onboardingCompletedAt: FIXED_NOW,
      interventionStartDate: '2026-09-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10_000,
    }
    const { service } = makeService(profile)
    await expect(service.getStatus('demo-user', FIXED_NOW)).resolves.toEqual({
      userId: 'demo-user',
      completed: true,
      completedAt: FIXED_NOW,
    })
  })

  it('reports completed right after complete() persists the profile', async () => {
    const { service } = makeService()
    await service.complete(completeRequest, 'demo-user', FIXED_NOW)
    await expect(service.getStatus('demo-user', FIXED_NOW)).resolves.toEqual({
      userId: 'demo-user',
      completed: true,
      completedAt: FIXED_NOW,
    })
  })
})

describe('OnboardingServiceImpl.getSuggestedLimits', () => {
  it('suggests 80% of the reference for time and money, with percentages', async () => {
    const { service } = makeService()
    await expect(service.getSuggestedLimits(reference, 'demo-user', FIXED_NOW)).resolves.toEqual({
      timeMinutes: 480,
      stakesAmount: 8_000,
      timePercent: 80,
      stakePercent: 80,
      timeCapMinutes: 540,
      stakesCapAmount: 9_000,
      capPercent: 90,
    })
  })
})

describe('OnboardingServiceImpl.complete', () => {
  it('persists profile + week-1 limit + coping and echoes the next-day start', async () => {
    const { service, saved } = makeService()
    const res = await service.complete(completeRequest, 'demo-user', FIXED_NOW)

    expect(saved.profile).toMatchObject({
      referenceTimeMin: 600,
      referenceStakesCzk: 10_000,
      interventionStartDate: '2026-09-02T00:00:00.000Z',
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

    expect(res).toEqual({
      reference: { timeMinutes: 600, stakesAmount: 10_000 },
      limits: { timeMinutes: 480, stakesAmount: 8_000 },
      coping: completeRequest.coping,
      interventionStartDate: '2026-09-02T00:00:00.000Z',
    })
  })

  it('rejects a time limit above the 90% cap and writes nothing', async () => {
    const { service, saved } = makeService()
    await expect(
      service.complete(
        { ...completeRequest, limits: { timeMinutes: 541, stakesAmount: 8_000 } },
        'demo-user',
        FIXED_NOW,
      ),
    ).rejects.toThrow(/time limit/)
    expect(saved.profile).toBeUndefined()
  })

  it('rejects a stakes limit above the 90% cap', async () => {
    const { service } = makeService()
    await expect(
      service.complete(
        { ...completeRequest, limits: { timeMinutes: 480, stakesAmount: 9_001 } },
        'demo-user',
        FIXED_NOW,
      ),
    ).rejects.toThrow(/stakes limit/)
  })
})
