import { ReminderServiceImpl } from '@/app/services/reminderServiceImpl.ts'
import type { CheckIn, Profile } from '@domain/model.ts'
import type { CheckInRepository, ProfileRepository } from '@domain/ports.ts'

const USER_ID = 'demo-user'

function profile(): Profile {
  return {
    userId: USER_ID,
    onboardingCompletedAt: '2026-08-31T21:30:00+02:00',
    interventionStartDate: '2026-09-01T00:00:00.000Z',
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
  }
}

function makeService(params: { profile?: Profile; checkIns: CheckIn[] }) {
  const profiles: ProfileRepository = {
    get: (userId) => Promise.resolve(userId === USER_ID ? params.profile : undefined),
    save: () => Promise.resolve(),
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  return new ReminderServiceImpl({ profiles, checkIns })
}

describe('ReminderServiceImpl.getDueReminder', () => {
  it('is null when there is no profile yet (onboarding not done)', async () => {
    const service = makeService({ checkIns: [] })
    await expect(service.getDueReminder(USER_ID, '2026-09-02T08:00:00+02:00')).resolves.toEqual({
      data: null,
      error: null,
    })
  })

  it('reports the missing day once onboarding is done and a day was skipped', async () => {
    const service = makeService({ profile: profile(), checkIns: [] })
    await expect(service.getDueReminder(USER_ID, '2026-09-02T08:00:00+02:00')).resolves.toEqual({
      data: { kind: 'checkin_due', behaviorDate: '2026-09-01T00:00:00.000Z' },
      error: null,
    })
  })
})
