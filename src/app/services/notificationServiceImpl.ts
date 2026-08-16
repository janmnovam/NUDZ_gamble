/**
 * Concrete NotificationService. Composes `isReminderTimeDue` (the
 * configured-time check, `@domain/reminder.ts`) with the already-wired
 * `ReminderService` (the content check) so a popup only fires once per
 * configured slot per day, and only when there's actually a missing
 * check-in to prompt for.
 */
import type {
  LastChanceCheckResult,
  NotificationCheckRequest,
  NotificationCheckResult,
  NotificationService,
} from '@/app/ports/notificationService.ts'
import type { ReminderService } from '@/app/ports/reminderService.ts'
import { isReminderTimeDue } from '@domain/reminder.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'

export interface NotificationServiceDeps {
  reminders: ReminderService
  config?: DomainConfig
}

export class NotificationServiceImpl implements NotificationService {
  private readonly deps: NotificationServiceDeps

  constructor(deps: NotificationServiceDeps) {
    this.deps = deps
  }

  async checkSchedule({
    userId,
    time,
    lastFiredAt,
  }: NotificationCheckRequest): Promise<NotificationCheckResult> {
    const config = this.deps.config ?? DEFAULT_CONFIG
    const slotDue = isReminderTimeDue({ times: config.REMINDER_TIMES, lastFiredAt, now: time })
    if (!slotDue) return { due: false, reminder: null }

    const result = await this.deps.reminders.getDueReminder(userId, time)
    if (result.error) {
      console.error('[notification] getDueReminder failed', result.error)
      return { due: false, reminder: null }
    }
    return { due: result.data !== null, reminder: result.data }
  }

  async checkLastChance({
    userId,
    time,
    lastFiredAt,
  }: NotificationCheckRequest): Promise<LastChanceCheckResult> {
    const config = this.deps.config ?? DEFAULT_CONFIG
    const slotDue = isReminderTimeDue({
      times: config.LAST_CHANCE_REMINDER_TIMES,
      lastFiredAt,
      now: time,
    })
    if (!slotDue) return { due: false }

    const result = await this.deps.reminders.getLastChance(userId, time)
    if (result.error) {
      console.error('[notification] getLastChance failed', result.error)
      return { due: false }
    }
    return { due: result.data === true }
  }
}
