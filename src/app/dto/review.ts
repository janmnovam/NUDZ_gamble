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

export interface FinalSummaryDayDto {
  /** 1..28 — the day's position in the programme. */
  studyDay: number
  date: ISOCalendarTimestamp
  /** `missing` is a gap in the record (NA), never a zero-filled day. */
  state: 'completed' | 'missing'
}

export interface FinalSummaryWeekDto {
  weekNo: number
  /** Cumulative usage against that week's limit; 0 limit when none was set. */
  time: { used: number; limit: number }
  stakes: { used: number; limit: number }
  timeStatus: Status
  stakesStatus: Status
  overall: Status
  /** Always 7 entries, in study-day order. */
  days: FinalSummaryDayDto[]
  filledDays: number
}

export interface FinalSummaryResponse {
  /** The programme day the summary is read on — 29 once it has finished. */
  studyDay: number
  weeks: FinalSummaryWeekDto[]
}
