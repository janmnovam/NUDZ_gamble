import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('DatabaseAdminAdapter.clearUserData', () => {
  it("deletes the target user's rows across user-scoped tables, preserving other users and the global contacts directory", async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)

    const profile = (userId: string) => ({
      userId,
      onboardingCompletedAt: '2026-08-01T21:00:00.000Z',
      interventionStartDate: '2026-08-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10000,
    })
    await data.profiles.save(profile('user-a'))
    await data.profiles.save(profile('user-b'))
    await data.copingStrategies.create(
      { userId: 'user-a', label: 'jdu se projít', type: 'custom', priority: 1 },
      '2026-08-02T08:00:00.000Z',
    )
    await data.contacts.seed()
    expect(await db.contacts.count()).toBeGreaterThan(0)

    await data.databaseAdmin.clearUserData('user-a')

    // user-a wiped across every user-scoped table it had rows in
    expect(await data.profiles.get('user-a')).toBeUndefined()
    expect(await data.copingStrategies.listByUser('user-a')).toHaveLength(0)
    // other users untouched
    expect(await data.profiles.get('user-b')).toBeDefined()
    // global contacts directory (no user_id) preserved
    expect(await db.contacts.count()).toBeGreaterThan(0)

    db.close()
    await db.delete()
  })
})
