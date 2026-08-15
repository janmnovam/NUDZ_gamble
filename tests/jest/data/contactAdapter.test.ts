import { CONTACTS } from '@data/seeds/contacts.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('ContactAdapter', () => {
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  it('is empty until seeded', async () => {
    expect(await data.contacts.list()).toHaveLength(0)
  })

  it('seeds the built-in contacts and lists them by priority', async () => {
    await data.contacts.seed()
    const list = await data.contacts.list()
    expect(list).toHaveLength(CONTACTS.length)
    expect(list.map((c) => c.priority)).toEqual(
      [...list.map((c) => c.priority)].sort((a, b) => a - b),
    )
    expect(list.at(-1)?.category).toBe('emergency')
  })

  it('seeding twice does not duplicate rows', async () => {
    await data.contacts.seed()
    await data.contacts.seed()
    expect(await data.contacts.list()).toHaveLength(CONTACTS.length)
  })

  it('gets a contact by id with its dialable phone', async () => {
    await data.contacts.seed()
    const contact = await data.contacts.get('narodni_linka')
    expect(contact?.phone).toBe('800350000')
    expect(contact?.availability).toBe('pondělí až pátek, 10:00–18:00')
  })
})
