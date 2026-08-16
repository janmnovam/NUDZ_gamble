import { type Status } from '@domain/config.ts'

export type ReviewStatus = Status | 'NEUPLNE'
export type DayReviewState = 'completed' | 'missing' | 'future'

export interface ReviewDayCell {
  dayLabel: string
  dayNumber: number
  state: DayReviewState
}

/**
 * Where a week sits in the programme:
 * - `locked` — not reached yet; nothing to show, not openable
 * - `running` — the week you are in; openable, days still fillable
 * - `awaiting-close` — over, but its review hasn't closed it, so nothing final
 * - `closed` — reviewed; carries the verdict
 */
export type WeekState = 'locked' | 'running' | 'awaiting-close' | 'closed'

export interface FinalSummaryWeek {
  weekNo: number
  state: WeekState
  /** Present only on a `closed` week — the others have no verdict to give. */
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
