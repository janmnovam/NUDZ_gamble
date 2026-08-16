import { jest } from '@jest/globals'

import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import { AppDatabase, createApp, createDataLayer, type DataLayer } from '@/core'
import type { DatabaseAdmin } from '@domain/ports.ts'

describe('AdminServiceImpl.dropUserData', () => {
  it('delegates to the DatabaseAdmin port with the given userId and resolves ok', async () => {
    const clearUserData = jest.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined)
    const databaseAdmin = { clearUserData } as unknown as DatabaseAdmin
    const service = new AdminServiceImpl({ databaseAdmin })

    const result = await service.dropUserData('demo-user')

    expect(result.error).toBeNull()
    expect(clearUserData).toHaveBeenCalledTimes(1)
    expect(clearUserData).toHaveBeenCalledWith('demo-user')
  })

  it('resolves to an internal error envelope (never throws) when the drop fails', async () => {
    const clearUserData = jest
      .fn<(userId: string) => Promise<void>>()
      .mockRejectedValue(new Error('boom'))
    const databaseAdmin = { clearUserData } as unknown as DatabaseAdmin
    const service = new AdminServiceImpl({ databaseAdmin })

    const result = await service.dropUserData('demo-user')

    expect(result.data).toBeNull()
    expect(result.error?.type).toBe('internal')
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

    const result = await app.admin.dropUserData('demo-user')

    expect(result.error).toBeNull()
    expect(await db.profile.count()).toBe(0)
    expect(await db.contacts.count()).toBeGreaterThan(0)

    db.close()
    await db.delete()
  })
})
