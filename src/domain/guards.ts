/**
 * Policy/guard objects (docs 05 & 09) — the "is this allowed right now"
 * checks reused across the check-in form, the dashboard's fill-in links,
 * and the review flow. One implementation each, so a second slightly
 * different copy never creeps in at a second call site.
 */
import type { ISODate, Review } from '@domain/model.ts'
import type { WeekNo } from '@domain/clock.ts'
import { DEFAULT_CONFIG, limitPercentView, type DomainConfig } from '@domain/config.ts'
import { isWithinCap, maxLimit, suggestLimit } from '@domain/limits.ts'

export type CheckInEditability = 'allowed' | 'locked_week' | 'future_date'

/**
 * Doc 09: a week is closed by its completed review, not by the calendar
 * (the "ordering trap") — pass `week_closed` in via `IsWeekClosed`, don't
 * derive it from the day number here. No separate day-count cutoff on top:
 * `config.ts`'s `EDIT_WINDOW_DAYS` is set equal to `WEEK_LENGTH_DAYS`, so
 * `week_closed` alone already enforces it.
 */
export type CanEditCheckIn = (params: {
  behavior_date: ISODate
  today: ISODate
  week_closed: boolean
}) => CheckInEditability

/** `isWeekClosed(N) = review_for(N).completed` — a review row exists for that week. */
export type IsWeekClosed = (week_no: WeekNo, reviews: readonly Review[]) => boolean

/** Doc 09: review N opens once day 7N has elapsed, and stays open until it's completed. */
export type CanReview = (params: {
  week_no: WeekNo
  week_elapsed: boolean
  already_reviewed: boolean
}) => boolean

/** Doc 08: exactly one primary call-to-action, resolved by a fixed priority order. */
export type PendingAction = 'final_summary' | 'review_available' | 'checkin_due' | 'none'

/** Priority: `final_summary > review_available > checkin_due > none`. */
export type ResolvePendingAction = (params: {
  in_final_summary: boolean
  reviewable_weeks: readonly WeekNo[]
  checkin_due: boolean
}) => PendingAction

/**
 * Doc 04: what the limit-adjustment slider (onboarding + every review)
 * renders — exact bounds in the reference's unit (minutes or CZK), the
 * 80%/90% labels, and whether the user's current value is allowed. One
 * implementation, reused at both call sites, so the review screen can't
 * grow a second, slightly different 90% check.
 */
export interface LimitAdjustmentView {
  suggested: number
  suggested_pct: number
  max: number
  max_pct: number
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
  const { suggested_pct, max_pct } = limitPercentView(config)
  return {
    suggested: suggestLimit(reference, config),
    suggested_pct,
    max: maxLimit(reference, config),
    max_pct,
    allowed: isWithinCap(proposed, reference, config),
  }
}
