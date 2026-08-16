/**
 * CheckInService DTOs (docs/architecture.md §CheckInService), camelCase boundary.
 * `CheckInRequest` mirrors the domain `CheckInDraft`; the feedback axes reuse the
 * dashboard's `AxisDto`, and the domain `CheckInFeedback` matches this shape
 * field-for-field, so the service returns it directly (no rename mapper).
 */
import type { AxisDto } from '@/app/dto/dashboard.ts'
import type { Status } from '@domain/config.ts'
import type { CheckIn, ISOCalendarTimestamp } from '@domain/model.ts'

export interface CheckInRequest {
  behaviorDate: ISOCalendarTimestamp
  played: boolean
  timeMin: number
  stakesCzk: number
  winningsCzk: number
}

export interface CheckInFieldErrorDto {
  field: string
  message: string
}

export interface CheckInFeedbackDto {
  weekNo: number
  time: AxisDto
  stakes: AxisDto
  overall: Status
  copingReminder: string | null
  incompleteWeek: boolean
}

export type CheckInResultResponse =
  | { ok: true; checkIn: CheckIn; feedback: CheckInFeedbackDto; backfilled: boolean }
  | { ok: false; errors: CheckInFieldErrorDto[] }
