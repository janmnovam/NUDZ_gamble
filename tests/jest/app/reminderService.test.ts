import { ReminderServiceImpl } from '@/app/services/reminderServiceImpl.ts'
import type { CheckIn, Profile, Review } from '@domain/model.ts'
import type { CheckInRepository, ProfileRepository, ReviewRepository } from '@domain/ports.ts'

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

function makeService(params: { profile?: Profile; checkIns: CheckIn[]; reviews?: Review[] }) {
  const profiles: ProfileRepository = {
    get: (userId) => Promise.resolve(userId === USER_ID ? params.profile : undefined),
    getCurrent: () => Promise.resolve(params.profile),
    save: () => Promise.resolve(),
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve(params.checkIns),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const reviews: ReviewRepository = {
    listByUser: () => Promise.resolve(params.reviews ?? []),
    getByWeek: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  return new ReminderServiceImpl({ profiles, checkIns, reviews })
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

describe('ReminderServiceImpl.getLastChance', () => {
  it('is true on the last day of the week with a missing day', async () => {
    const checkIn: CheckIn = {
      checkInId: 'c1',
      userId: USER_ID,
      behaviorDate: '2026-09-01T00:00:00.000Z',
      weekNo: 1,
      played: false,
      timeMin: 0,
      stakesCzk: 0,
      winningsCzk: 0,
      submittedAt: '2026-09-02T08:00:00+02:00',
      updatedAt: null,
    }
    const service = makeService({ profile: profile(), checkIns: [checkIn] })
    await expect(service.getLastChance(USER_ID, '2026-09-07T21:00:00+02:00')).resolves.toEqual({
      data: true,
      error: null,
    })
  })

  it('is false mid-week', async () => {
    const service = makeService({ profile: profile(), checkIns: [] })
    await expect(service.getLastChance(USER_ID, '2026-09-05T21:00:00+02:00')).resolves.toEqual({
      data: false,
      error: null,
    })
  })
})
