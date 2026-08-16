import { jest } from '@jest/globals'

import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import { AppDatabase, createApp, createDataLayer, type DataLayer } from '@/core'
import type { DatabaseAdmin } from '@domain/ports.ts'

describe('AdminServiceImpl.dropAllData', () => {
  it('delegates to the DatabaseAdmin port', async () => {
    const clearAll = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const databaseAdmin = { clearAll } as unknown as DatabaseAdmin
    const service = new AdminServiceImpl({ databaseAdmin })

    await service.dropAllData()

    expect(clearAll).toHaveBeenCalledTimes(1)
  })

  it('wipes every table when wired through createApp', async () => {
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
    expect(await db.profile.count()).toBe(1)

    await app.admin.dropAllData()

    for (const table of db.tables) {
      expect(await table.count()).toBe(0)
    }

    db.close()
    await db.delete()
  })
})
