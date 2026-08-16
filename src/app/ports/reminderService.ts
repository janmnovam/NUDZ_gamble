/**
 * ReminderService — inbound (driving) port. Wiring stub: the contract follows
 * docs/architecture.md §ReminderService, but the DTO shape is a placeholder
 * until the service (and `@domain/reminder.ts`) are implemented.
 */
// TODO(app): replace with the documented shape when ReminderService is built.
export type ReminderResponse = Record<string, unknown>

export interface ReminderService {
  /** The one working reminder scenario, if due. */
  getDueReminder(): Promise<ReminderResponse | null>
}
