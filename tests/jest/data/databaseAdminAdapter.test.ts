import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('DatabaseAdminAdapter.clearAll', () => {
  it('wipes every table', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)

    // Seed a couple of tables directly so we have something to wipe.
    await data.profiles.save({
      userId: 'demo-user',
      onboardingCompletedAt: '2026-08-01T21:00:00.000Z',
      interventionStartDate: '2026-08-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10000,
    })
    await data.contacts.seed()
    expect(await db.profile.count()).toBe(1)
    expect(await db.contacts.count()).toBeGreaterThan(0)

    await data.databaseAdmin.clearAll()

    for (const table of db.tables) {
      expect(await table.count()).toBe(0)
    }

    db.close()
    await db.delete()
  })
})
