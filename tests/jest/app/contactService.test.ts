import { jest } from '@jest/globals'

import { ContactServiceImpl } from '@/app/services/contactServiceImpl.ts'
import { AppDatabase, createApp, createDataLayer } from '@/core/index.ts'
import type { ContactRepository } from '@domain/ports.ts'

describe('ContactServiceImpl', () => {
  it('idempotently seeds and maps the ordered contact directory', async () => {
    const seed = jest.fn(() => Promise.resolve())
    const list = jest.fn(() =>
      Promise.resolve([
        {
          contactId: 'narodni_linka',
          name: 'Národní linka pro odvykání',
          purpose: 'Telefonická podpora.',
          phone: '800350000',
          url: null,
          availability: 'pondělí až pátek, 10:00–18:00',
          category: 'counselling' as const,
          priority: 1,
        },
      ]),
    )
    const repo = { seed, list } as unknown as ContactRepository
    const service = new ContactServiceImpl({ repo })

    await expect(service.list()).resolves.toEqual([
      {
        id: 'narodni_linka',
        name: 'Národní linka pro odvykání',
        purpose: 'Telefonická podpora.',
        phone: '800350000',
        url: null,
        availability: 'pondělí až pátek, 10:00–18:00',
        category: 'counselling',
        priority: 1,
      },
    ])
    expect(seed).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledTimes(1)
    expect(seed.mock.invocationCallOrder[0]).toBeLessThan(list.mock.invocationCallOrder[0] ?? 0)
  })

  it('is wired through createApp and reads the existing IndexedDB contact store', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const app = createApp(createDataLayer(db))

    const contacts = await app.contacts.list()

    expect(contacts.some((contact) => contact.category === 'counselling')).toBe(true)
    expect(contacts.some((contact) => contact.category === 'emergency')).toBe(true)

    db.close()
    await db.delete()
  })
})
