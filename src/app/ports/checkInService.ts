/**
 * CheckInService — inbound (driving) port. Records or edits a day's check-in and
 * returns the doc-07 feedback payload (or field errors). See
 * docs/architecture.md §CheckInService.
 */
import type { CheckInRequest, CheckInResultResponse } from '@/app/dto/checkin.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export type { CheckInRequest, CheckInResultResponse }

export interface CheckInService {
  /**
   * Record a day's check-in (upsert on `behaviorDate`). `userId` and `time`
   * (an offset-bearing instant that anchors "today" and stamps `submittedAt`)
   * are caller-supplied per request. Returns `{ ok: false, errors }` on invalid
   * input.
   */
  submitCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<CheckInResultResponse>
  /** Edit an existing check-in (sets `updatedAt`); rejects a closed/future day. */
  editCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<CheckInResultResponse>
}
