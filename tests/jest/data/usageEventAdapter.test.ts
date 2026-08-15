import { type UsageEventEntity } from '@data/model.ts'
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

  const opened: UsageEventEntity = {
    usage_event_id: 'ue-1',
    user_id: 'A001',
    event_type: 'app_opened',
    occurred_at: '2026-09-02T08:00:00.000Z',
    screen: null,
    detail: null,
  }

  it('saves and reads a usage event by id', async () => {
    await data.usageEvents.save(opened)
    await expect(data.usageEvents.get('ue-1')).resolves.toEqual(opened)
  })

  it('lists a user’s events ordered by occurred_at', async () => {
    await data.usageEvents.save({
      ...opened,
      usage_event_id: 'ue-2',
      occurred_at: '2026-09-03T20:00:00.000Z',
    })
    await data.usageEvents.save(opened)
    const list = await data.usageEvents.listByUser('A001')
    expect(list.map((e) => e.occurred_at)).toEqual([
      '2026-09-02T08:00:00.000Z',
      '2026-09-03T20:00:00.000Z',
    ])
  })

  it('records a review milestone with a day detail', async () => {
    await data.usageEvents.save({
      usage_event_id: 'ue-3',
      user_id: 'A001',
      event_type: 'review_reached',
      occurred_at: '2026-09-09T09:00:00.000Z',
      screen: 'review',
      detail: JSON.stringify({ day: 7 }),
    })
    const event = await data.usageEvents.get('ue-3')
    expect(event?.event_type).toBe('review_reached')
    expect(JSON.parse(event?.detail ?? '{}')).toEqual({ day: 7 })
  })
})
