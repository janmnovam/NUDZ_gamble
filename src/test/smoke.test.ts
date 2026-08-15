import { describe, expect, it } from 'vitest'

import { AppDatabase } from '@data/db.ts'

/** Verifies the test runner and the IndexedDB layer are wired up. */
describe('bootstrap', () => {
  it('opens the IndexedDB database', async () => {
    const db = new AppDatabase('nudz-gamble-test')
    await db.open()

    expect(db.isOpen()).toBe(true)

    db.close()
    await db.delete()
  })
})
