import { jest } from '@jest/globals'

import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import { AppDatabase, createApp, createDataLayer, type DataLayer } from '@/core'
import type { DatabaseAdmin } from '@domain/ports.ts'

describe('AdminServiceImpl.dropUserData', () => {
  it('delegates to the DatabaseAdmin port with the given userId', async () => {
    const clearUserData = jest.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined)
    const databaseAdmin = { clearUserData } as unknown as DatabaseAdmin
    const service = new AdminServiceImpl({ databaseAdmin })

    await service.dropUserData('demo-user')

    expect(clearUserData).toHaveBeenCalledTimes(1)
    expect(clearUserData).toHaveBeenCalledWith('demo-user')
  })

  it("drops the user's data but keeps the global contacts directory when wired through createApp", async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const app = createApp(data)

    await data.profiles.save({
      userId: 'demo-user',
      onboardingCompletedAt: '2026-08-01T21:00:00.000Z',
      interventionStartDate: '2026-08-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10000,
    })
    await data.contacts.seed()
    expect(await db.profile.count()).toBe(1)

    await app.admin.dropUserData('demo-user')

    expect(await db.profile.count()).toBe(0)
    expect(await db.contacts.count()).toBeGreaterThan(0)

    db.close()
    await db.delete()
  })
})
