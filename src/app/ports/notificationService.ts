/**
 * NotificationService — inbound (driving) port. Decides *when* the installed
 * app should pop a system notification: a configured wall-clock slot
 * (`config.ts`'s `REMINDER_TIMES`) must have been crossed since the last
 * firing, *and* `ReminderService` must actually have something to prompt
 * for. Showing the popup itself (permission + `Notification`) is a UI
 * concern (`src/ui/notifications/`), not this port's job.
 */
import type { ReminderResponse } from '@domain/reminder.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export interface NotificationCheckRequest {
  userId: UserId
  /** Caller-supplied instant (offset-bearing — see `clock.ts`'s timezone warning). */
  time: ISOTimestamp
  /** The instant a notification last actually fired for this user, or `null`. */
  lastFiredAt: ISOTimestamp | null
}

export interface NotificationCheckResult {
  /** Whether the caller should show a popup right now. */
  due: boolean
  /** What it would be about — present whenever `due` is true. */
  reminder: ReminderResponse
}

export interface NotificationService {
  checkSchedule(request: NotificationCheckRequest): Promise<NotificationCheckResult>
}
