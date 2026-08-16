/**
 * ReminderService wiring stub. Depends on `@domain/reminder.ts` (not built yet);
 * method body is TODO. See docs/architecture.md §ReminderService.
 */
import type { ReminderResponse, ReminderService } from '@/app/ports/reminderService.ts'
import type { CheckInRepository, ProfileRepository } from '@domain/ports.ts'

export interface ReminderServiceDeps {
  checkIns: CheckInRepository
  profiles: ProfileRepository
}

export class ReminderServiceImpl implements ReminderService {
  protected readonly deps: ReminderServiceDeps

  constructor(deps: ReminderServiceDeps) {
    this.deps = deps
  }

  getDueReminder(): Promise<ReminderResponse | null> {
    return Promise.reject(
      new Error('ReminderService.getDueReminder: not implemented (wiring only)'),
    )
  }
}
