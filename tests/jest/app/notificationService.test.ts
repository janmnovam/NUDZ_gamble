import { NotificationServiceImpl } from '@/app/services/notificationServiceImpl.ts'
import type { ReminderService } from '@/app/ports/reminderService.ts'
import { ok } from '@/app/result.ts'
import type { ReminderResponse } from '@domain/reminder.ts'
import { DEFAULT_CONFIG } from '@domain/config.ts'

const USER_ID = 'demo-user'

function makeService(reminder: ReminderResponse) {
  const reminders: ReminderService = {
    getDueReminder: () => Promise.resolve(ok(reminder)),
  }
  return new NotificationServiceImpl({ reminders })
}

describe('NotificationServiceImpl.checkSchedule', () => {
  it('is not due before any configured slot, regardless of content', async () => {
    const service = makeService({ kind: 'checkin_due', behaviorDate: '2026-09-01T00:00:00.000Z' })
    const result = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T08:59:00+02:00',
      lastFiredAt: null,
    })
    expect(result).toEqual({ due: false, reminder: null })
  })

  it('is not due once a slot passes if there is nothing to remind about', async () => {
    const service = makeService(null)
    const result = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T09:00:00+02:00',
      lastFiredAt: null,
    })
    expect(result).toEqual({ due: false, reminder: null })
  })

  it('is due once a slot passes and a check-in is missing', async () => {
    const reminder: ReminderResponse = {
      kind: 'checkin_due',
      behaviorDate: '2026-09-01T00:00:00.000Z',
    }
    const service = makeService(reminder)
    const result = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T09:00:00+02:00',
      lastFiredAt: null,
    })
    expect(result).toEqual({ due: true, reminder })
  })

  it("doesn't refire the same slot on the same day", async () => {
    const reminder: ReminderResponse = {
      kind: 'checkin_due',
      behaviorDate: '2026-09-01T00:00:00.000Z',
    }
    const service = makeService(reminder)
    const result = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T09:30:00+02:00',
      lastFiredAt: '2026-09-05T09:00:00+02:00',
    })
    expect(result).toEqual({ due: false, reminder: null })
  })

  it('uses REMINDER_TIMES from the injected config', async () => {
    const reminder: ReminderResponse = {
      kind: 'checkin_due',
      behaviorDate: '2026-09-01T00:00:00.000Z',
    }
    const service = new NotificationServiceImpl({
      reminders: { getDueReminder: () => Promise.resolve(ok(reminder)) },
      config: { ...DEFAULT_CONFIG, REMINDER_TIMES: ['12:00'] },
    })
    const early = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T09:00:00+02:00',
      lastFiredAt: null,
    })
    expect(early.due).toBe(false)

    const onTime = await service.checkSchedule({
      userId: USER_ID,
      time: '2026-09-05T12:00:00+02:00',
      lastFiredAt: null,
    })
    expect(onTime.due).toBe(true)
  })
})
