/**
 * Policy/guard objects (docs 05 & 09) — the "is this allowed right now"
 * checks reused across the check-in form, the dashboard's fill-in links,
 * and the review flow. One implementation each, so a second slightly
 * different copy never creeps in at a second call site.
 */
import type { Review } from '@domain/model.ts'
import { type WeekNo } from '@domain/clock.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import { isWithinCap, limitPercentView, maxLimit, suggestLimit } from '@domain/limits.ts'

export type CheckInEditability = 'allowed' | 'future_date' | 'locked_week' | 'outside_window'

/**
 * Doc 05's backfill/edit policy, in one place (reused by the check-in service
 * and the dashboard's fill-in links). Inputs are already reduced to scalars by
 * the caller via `StudyCalendar`:
 * - `studyDayDiff` = `studyDay(today) - studyDay(behaviorDate)` (1 = yesterday).
 * - `weekClosed` = a review row exists for that day's week (`isWeekClosed`).
 *
 * A missing day is editable iff it is in the past, its week isn't review-closed,
 * and it falls inside the rolling `BACKFILL_WINDOW_DAYS` window. Precedence:
 * `future_date` > `locked_week` > `outside_window`.
 */
export type CanEditCheckIn = (
  params: { studyDayDiff: number; weekClosed: boolean },
  config?: DomainConfig,
) => CheckInEditability

export const canEditCheckIn: CanEditCheckIn = (
  { studyDayDiff, weekClosed },
  config = DEFAULT_CONFIG,
) => {
  if (studyDayDiff <= 0) return 'future_date'
  if (weekClosed) return 'locked_week'
  if (studyDayDiff > config.BACKFILL_WINDOW_DAYS) return 'outside_window'
  return 'allowed'
}

/** `isWeekClosed(N) = review_for(N).completed` — a review row exists for that week. */
export type IsWeekClosed = (weekNo: WeekNo, reviews: readonly Review[]) => boolean

export const isWeekClosed: IsWeekClosed = (weekNo, reviews) =>
  reviews.some((r) => r.reviewWeekNo === weekNo)

/** Doc 09: review N opens once day 7N has elapsed, and stays open until it's completed. */
export type CanReview = (params: {
  weekNo: WeekNo
  weekElapsed: boolean
  alreadyReviewed: boolean
}) => boolean

export const canReview: CanReview = ({ weekElapsed, alreadyReviewed }) =>
  weekElapsed && !alreadyReviewed

/** Doc 08: exactly one primary call-to-action, resolved by a fixed priority order. */
export type PendingAction = 'final_summary' | 'review_available' | 'checkin_due' | 'none'

/** Priority: `final_summary > review_available > checkin_due > none`. */
export type ResolvePendingAction = (params: {
  inFinalSummary: boolean
  reviewableWeeks: readonly WeekNo[]
  checkinDue: boolean
}) => PendingAction

export const resolvePendingAction: ResolvePendingAction = ({
  inFinalSummary,
  reviewableWeeks,
  checkinDue,
}) => {
  if (inFinalSummary) return 'final_summary'
  if (reviewableWeeks.length > 0) return 'review_available'
  if (checkinDue) return 'checkin_due'
  return 'none'
}

/**
 * Doc 04: what the limit-adjustment slider (onboarding + every review)
 * renders — exact bounds in the reference's unit (minutes or CZK), the
 * 80%/90% labels, and whether the user's current value is allowed. One
 * implementation, reused at both call sites, so the review screen can't
 * grow a second, slightly different 90% check.
 */
export interface LimitAdjustmentView {
  suggested: number
  suggestedPct: number
  max: number
  maxPct: number
  allowed: boolean
}

export type EvaluateLimitAdjustment = (params: {
  reference: number
  proposed: number
}) => LimitAdjustmentView

export const evaluateLimitAdjustment = (
  { reference, proposed }: { reference: number; proposed: number },
  config: DomainConfig = DEFAULT_CONFIG,
): LimitAdjustmentView => {
  const { suggestedPct, maxPct } = limitPercentView(config)
  return {
    suggested: suggestLimit(reference, config),
    suggestedPct,
    max: maxLimit(reference, config),
    maxPct,
    allowed: isWithinCap(proposed, reference, config),
  }
}
