/**
 * Policy/guard objects (docs 05 & 09) — the "is this allowed right now"
 * checks reused across the check-in form, the dashboard's fill-in links,
 * and the review flow. One implementation each, so a second slightly
 * different copy never creeps in at a second call site.
 */
import type { ISODate, Review } from '@domain/model.ts'
import type { WeekNo } from '@domain/clock.ts'

export type CheckInEditability = 'allowed' | 'locked_week' | 'future_date'

/**
 * Doc 09: a week is closed by its completed review, not by the calendar
 * (the "ordering trap") — pass `week_closed` in via `IsWeekClosed`, don't
 * derive it from the day number here.
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
