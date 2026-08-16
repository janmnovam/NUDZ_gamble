/**
 * ReminderService — inbound (driving) port. See docs/architecture.md
 * §ReminderService. Content only ("is there a check-in to prompt for");
 * whether/when to actually pop a system notification is `NotificationService`.
 */
import type { Result } from '@/app/result.ts'
import type { ReminderResponse } from '@domain/reminder.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export type { ReminderResponse } from '@domain/reminder.ts'

export interface ReminderService {
  /** The one working reminder scenario, if due: the earliest missing check-in this week. */
  getDueReminder(userId: UserId, time: ISOTimestamp): Promise<Result<ReminderResponse>>
}
