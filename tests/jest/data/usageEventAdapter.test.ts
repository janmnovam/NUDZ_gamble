import type { UsageEvent } from '@domain/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('UsageEventAdapter', () => {
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

  const opened: UsageEvent = {
    usageEventId: 'ue-1',
    userId: 'A001',
    eventType: 'app_opened',
    occurredAt: '2026-09-02T08:00:00.000Z',
    screen: null,
    detail: null,
  }

  it('saves and reads a usage event by id', async () => {
    await data.usageEvents.save(opened)
    await expect(data.usageEvents.get('ue-1')).resolves.toEqual(opened)
  })

  it('lists a user’s events ordered by occurredAt', async () => {
    await data.usageEvents.save({
      ...opened,
      usageEventId: 'ue-2',
      occurredAt: '2026-09-03T20:00:00.000Z',
    })
    await data.usageEvents.save(opened)
    const list = await data.usageEvents.listByUser('A001')
    expect(list.map((e) => e.occurredAt)).toEqual([
      '2026-09-02T08:00:00.000Z',
      '2026-09-03T20:00:00.000Z',
    ])
  })

  it('records a review milestone with a day detail', async () => {
    await data.usageEvents.save({
      usageEventId: 'ue-3',
      userId: 'A001',
      eventType: 'review_reached',
      occurredAt: '2026-09-09T09:00:00.000Z',
      screen: 'review',
      detail: JSON.stringify({ day: 7 }),
    })
    const event = await data.usageEvents.get('ue-3')
    expect(event?.eventType).toBe('review_reached')
    expect(JSON.parse(event?.detail ?? '{}')).toEqual({ day: 7 })
  })
})
