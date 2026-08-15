/**
 * Policy/guard objects (docs 05 & 09) — the "is this allowed right now"
 * checks reused across the check-in form, the dashboard's fill-in links,
 * and the review flow. One implementation each, so a second slightly
 * different copy never creeps in at a second call site.
 */
import type { ISODate, Review } from '@domain/model.ts'
import type { WeekNo } from '@domain/clock.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import { isWithinCap, limitPercentView, maxLimit, suggestLimit } from '@domain/limits.ts'

export type CheckInEditability = 'allowed' | 'locked_week' | 'future_date'

/**
 * Doc 09: a week is closed by its completed review, not by the calendar
 * (the "ordering trap") — pass `weekClosed` in via `IsWeekClosed`, don't
 * derive it from the day number here. No separate day-count cutoff on top:
 * `config.ts`'s `EDIT_WINDOW_DAYS` is set equal to `WEEK_LENGTH_DAYS`, so
 * `weekClosed` alone already enforces it.
 */
export type CanEditCheckIn = (params: {
  behaviorDate: ISODate
  today: ISODate
  weekClosed: boolean
}) => CheckInEditability

/**
 * Future/today first (a day that isn't over yet can't be checked in), then a
 * review-closed week, else editable. ISO dates compare lexicographically.
 */
export const canEditCheckIn: CanEditCheckIn = ({ behaviorDate, today, weekClosed }) => {
  if (behaviorDate >= today) return 'future_date'
  if (weekClosed) return 'locked_week'
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
