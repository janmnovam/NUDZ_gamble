/**
 * ReviewService DTOs (docs/architecture.md §ReviewService), camelCase boundary.
 * Shapes coincide with the domain VMs in `@domain/review.ts`, so the service
 * returns those directly — no rename mapper needed (unlike the dashboard).
 */
import type { Status } from '@domain/config.ts'
import type { ISOCalendarTimestamp } from '@domain/model.ts'

export interface ReviewAxisDto {
  used: number
  limit: number
  status: Status
}

export interface ReviewResponse {
  weekNo: number
  time: ReviewAxisDto
  stakes: ReviewAxisDto
  missingDays: ISOCalendarTimestamp[]
  suggestedNextLimits: { timeMinutes: number; stakesAmount: number }
}

export interface CompleteReviewRequest {
  reviewWeekNo: number
  nextLimits: { timeMinutes: number; stakesAmount: number }
  incomplete: boolean
}

export interface FinalSummaryWeekDto {
  weekNo: number
  timeStatus: Status
  stakesStatus: Status
  overall: Status
}

export interface FinalSummaryResponse {
  weeks: FinalSummaryWeekDto[]
}
