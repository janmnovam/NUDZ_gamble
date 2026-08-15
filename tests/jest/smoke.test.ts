import { AppDatabase } from '@data/db'

/** Verifies Jest resolves the path aliases and the IndexedDB layer. */
describe('jest bootstrap', () => {
  it('opens the IndexedDB database', async () => {
    const db = new AppDatabase('nudz-gamble-jest')
    await db.open()

    expect(db.isOpen()).toBe(true)

    db.close()
    await db.delete()
  })
})
