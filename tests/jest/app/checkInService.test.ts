import { CheckInServiceImpl, type CheckInServiceDeps } from '@/app/services/checkInServiceImpl.ts'
import type { Result } from '@/app/result.ts'
import type { CheckIn, CheckInEdit, CopingStrategy, Limit, Profile } from '@domain/model.ts'
import type {
  CheckInEditRepository,
  CheckInRepository,
  CopingStrategyRepository,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

/** Unwrap a service `Result`, failing the test if it carried an envelope error. */
function payload<T>(r: Result<T>): T {
  if (r.error) throw new Error(`unexpected error envelope: ${r.error.type}:${r.error.code}`)
  if (r.data === null) throw new Error('expected data, got null')
  return r.data
}

const USER_ID = 'demo-user'
const START = '2026-09-01T00:00:00.000Z' // week 1 = 09-01..09-07

function makeService(opts: { checkIns?: CheckIn[]; coping?: CopingStrategy[] } = {}) {
  const profile: Profile = {
    userId: USER_ID,
    onboardingCompletedAt: '2026-08-31T21:30:00+02:00',
    interventionStartDate: START,
    referenceTimeMin: 600,
    referenceStakesCzk: 10_000,
  }
  const checkInStore: CheckIn[] = opts.checkIns ?? []
  const editStore: CheckInEdit[] = []
  const limitStore: Limit[] = [
    {
      limitId: 'l1',
      userId: USER_ID,
      weekNo: 1,
      weeklyLimitTimeMin: 480,
      weeklyLimitStakesCzk: 8_000,
      limitSetAt: '2026-08-31T21:30:00+02:00',
    },
  ]
  let seq = 0

  const profiles: ProfileRepository = {
    get: (u) => Promise.resolve(u === USER_ID ? profile : undefined),
    getCurrent: () => Promise.resolve(profile),
    save: () => Promise.resolve(),
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve([...checkInStore]),
    get: (id) => Promise.resolve(checkInStore.find((c) => c.checkInId === id)),
    save: (c) => {
      const i = checkInStore.findIndex((x) => x.checkInId === c.checkInId)
      if (i >= 0) checkInStore[i] = c
      else checkInStore.push(c)
      return Promise.resolve()
    },
  }
  const checkInEdits: CheckInEditRepository = {
    listByCheckIn: (id) => Promise.resolve(editStore.filter((e) => e.checkInId === id)),
    get: (id) => Promise.resolve(editStore.find((e) => e.checkInEditId === id)),
    save: (e) => {
      editStore.push(e)
      return Promise.resolve()
    },
  }
  const limits: LimitRepository = {
    listByUser: () => Promise.resolve([...limitStore]),
    save: () => Promise.resolve(),
  }
  const copingStrategies: CopingStrategyRepository = {
    loadDefaults: () => Promise.resolve([]),
    create: () => Promise.reject(new Error('unused')),
    setActive: () => Promise.resolve(),
    update: () => Promise.reject(new Error('unused')),
    remove: () => Promise.reject(new Error('unused')),
    listByUser: () => Promise.resolve(opts.coping ?? []),
  }

  const deps: CheckInServiceDeps = {
    checkIns,
    checkInEdits,
    limits,
    profiles,
    copingStrategies,
    newId: () => `id-${String((seq += 1))}`,
  }
  return { service: new CheckInServiceImpl(deps), checkInStore, editStore }
}

// A fixed instant → today = 2026-09-04; 09-03 is a valid past day of week 1.
const TIME = '2026-09-04T08:00:00+02:00'

describe('CheckInServiceImpl.submitCheckIn', () => {
  const req = {
    behaviorDate: '2026-09-03T00:00:00.000Z',
    played: true,
    timeMin: 100,
    stakesCzk: 1_000,
    winningsCzk: 0,
  }

  it('creates a record + a "created" audit row and returns feedback', async () => {
    const { service, checkInStore, editStore } = makeService()
    const res = payload(await service.submitCheckIn(req, USER_ID, TIME))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.checkIn).toMatchObject({
      weekNo: 1,
      timeMin: 100,
      submittedAt: TIME,
      updatedAt: null,
    })
    expect(res.feedback).toMatchObject({ weekNo: 1, overall: 'OK' })
    expect(checkInStore).toHaveLength(1)
    expect(editStore).toHaveLength(1)
    expect(editStore[0]).toMatchObject({ action: 'created', before: null, changedFields: [] })
  })

  it('upserts on the same day: second submit edits, no duplicate, updatedAt set', async () => {
    const { service, checkInStore, editStore } = makeService()
    await service.submitCheckIn(req, USER_ID, TIME)
    const res = payload(await service.submitCheckIn({ ...req, timeMin: 200 }, USER_ID, TIME))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(checkInStore).toHaveLength(1)
    expect(res.checkIn).toMatchObject({ timeMin: 200, updatedAt: TIME })
    expect(editStore).toHaveLength(2)
    const updated = editStore.at(1)
    expect(updated?.action).toBe('updated')
    expect(updated?.changedFields ?? []).toContain('timeMin')
  })

  it('persists a not-played row as zeros', async () => {
    const { service, checkInStore } = makeService()
    const res = payload(
      await service.submitCheckIn(
        {
          behaviorDate: '2026-09-03T00:00:00.000Z',
          played: false,
          timeMin: 0,
          stakesCzk: 0,
          winningsCzk: 0,
        },
        USER_ID,
        TIME,
      ),
    )
    expect(res.ok).toBe(true)
    expect(checkInStore[0]).toMatchObject({ played: false, timeMin: 0, stakesCzk: 0 })
  })

  it('rejects a future behaviorDate with a field error and writes nothing', async () => {
    const { service, checkInStore, editStore } = makeService()
    const res = payload(
      await service.submitCheckIn(
        { ...req, behaviorDate: '2026-09-04T00:00:00.000Z' },
        USER_ID,
        TIME,
      ),
    )
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.errors.map((e) => e.field)).toContain('behaviorDate')
    expect(checkInStore).toHaveLength(0)
    expect(editStore).toHaveLength(0)
  })

  it('refuses a prior (closed) week visibly via a field error', async () => {
    // today still 09-04 (week 1); ask for a week-0 date before the programme.
    const { service, checkInStore } = makeService()
    const res = payload(
      await service.submitCheckIn(
        { ...req, behaviorDate: '2026-08-30T00:00:00.000Z' },
        USER_ID,
        TIME,
      ),
    )
    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.errors.map((e) => e.field)).toContain('behaviorDate')
    expect(checkInStore).toHaveLength(0)
  })

  it('surfaces a coping reminder in feedback at POZOR', async () => {
    const coping: CopingStrategy[] = [
      {
        copingStrategyId: 's1',
        userId: USER_ID,
        label: 'Go for a walk',
        type: 'custom',
        whenToUse: null,
        howToStart: null,
        priority: 0,
        active: true,
        createdAt: '2026-08-31T21:30:00+02:00',
        updatedAt: null,
      },
    ]
    const { service } = makeService({ coping })
    const res = payload(await service.submitCheckIn({ ...req, stakesCzk: 6_600 }, USER_ID, TIME))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.feedback.overall).toBe('POZOR')
    expect(res.feedback.copingReminder).toBe('Go for a walk')
  })
})

describe('CheckInServiceImpl.editCheckIn', () => {
  it('returns a not_found error when there is no record for that day', async () => {
    const { service } = makeService()
    const res = await service.editCheckIn(
      {
        behaviorDate: '2026-09-03T00:00:00.000Z',
        played: true,
        timeMin: 10,
        stakesCzk: 10,
        winningsCzk: 0,
      },
      USER_ID,
      TIME,
    )
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('not_found')
    expect(res.error?.code).toBe('CHECKIN_NOTHING_TO_EDIT')
  })
})
