/**
 * CheckInService — inbound (driving) port. Wiring stub: the contract follows
 * docs/architecture.md §CheckInService, but the request/response DTO shapes are
 * placeholders until the service is implemented.
 */
// TODO(app): replace with the documented shapes when CheckInService is built.
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export type CheckInRequest = Record<string, unknown>
export type CheckInResultResponse = Record<string, unknown>

export interface CheckInService {
  /** Record a day's check-in. */
  submitCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<CheckInResultResponse>
  /** Edit an existing check-in (sets `updatedAt`). */
  editCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<CheckInResultResponse>
}
