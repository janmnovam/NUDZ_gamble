import type { Status } from '@domain/config.ts'

export type ReviewStatus = Status | 'NEUPLNE'
export type DayReviewState = 'completed' | 'missing'

export interface ReviewDayCell {
  dayLabel: string
  dayNumber: number
  state: DayReviewState
}

export interface FinalSummaryWeek {
  weekNo: number
  /**
   * A week still ahead is locked: it shows no status and can't be opened,
   * because there is nothing recorded to show yet.
   */
  locked: boolean
  /** Absent while `locked` — an unreached week carries no verdict. */
  status?: ReviewStatus
  timeUsedLabel: string
  timeLimitLabel: string
  stakesUsedLabel: string
  stakesLimitLabel: string
  filledDays: number
  totalDays: number
  days: ReviewDayCell[]
}

export interface FinalSummaryViewModel {
  programmeDayLabel: string
  weeks: FinalSummaryWeek[]
}
