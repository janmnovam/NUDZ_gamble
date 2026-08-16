/**
 * Concrete ReminderService. Wraps `getDueReminder` (`@domain/reminder.ts`).
 * See docs/architecture.md §ReminderService.
 */
import type { ReminderService } from '@/app/ports/reminderService.ts'
import { type Result, run } from '@/app/result.ts'
import { getDueReminder, type ReminderResponse } from '@domain/reminder.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type { CheckInRepository, ProfileRepository, ReviewRepository } from '@domain/ports.ts'

export interface ReminderServiceDeps {
  checkIns: CheckInRepository
  profiles: ProfileRepository
  reviews: ReviewRepository
}

export class ReminderServiceImpl implements ReminderService {
  protected readonly deps: ReminderServiceDeps

  constructor(deps: ReminderServiceDeps) {
    this.deps = deps
  }

  getDueReminder(userId: UserId, time: ISOTimestamp): Promise<Result<ReminderResponse>> {
    return run(async () => {
      const profile = await this.deps.profiles.get(userId)
      if (!profile) return null
      const [checkIns, reviews] = await Promise.all([
        this.deps.checkIns.listByUser(userId),
        this.deps.reviews.listByUser(userId),
      ])
      return getDueReminder({ profile, checkIns, reviews, time })
    })
  }
}
