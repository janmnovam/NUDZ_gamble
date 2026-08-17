/**
 * Reminder domain (doc 08's "one working reminder scenario", now two) — two
 * separate pure questions, kept apart on purpose:
 *
 *   1. `getDueReminder` — is there anything to prompt the user about right
 *      now: a pending weekly review, or else a missing check-in in the
 *      current study week? Content only, no notion of clock time.
 *   2. `isReminderTimeDue` — has a configured wall-clock slot
 *      (`config.ts`'s `REMINDER_TIMES`) just been crossed, so it's time to
 *      check #1 and, if it says yes, pop a system notification?
 *
 * Both are framework-free: nothing here touches `Notification`, a timer, or
 * storage. The app layer (`NotificationService`) composes them; the UI is
 * the one that actually shows a popup.
 */
import { calendarDate, createStudyCalendar, type WeekNo } from '@domain/clock.ts'
import { dayStateOf } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import { canReview, isWeekClosed } from '@domain/guards.ts'
import type { CheckIn, ISOCalendarTimestamp, ISOTimestamp, Profile, Review } from '@domain/model.ts'

export type ReminderKind = 'checkin_due' | 'review_due'

/**
 * Discriminated on `kind`: `checkin_due` names the missing day, `review_due`
 * names the week whose review is open. Two shapes rather than one loose bag
 * so a caller can't read `weekNo` off a check-in reminder or vice versa.
 */
export type ReminderDue =
  | { kind: 'checkin_due'; behaviorDate: ISOCalendarTimestamp }
  | { kind: 'review_due'; weekNo: WeekNo }

/** `null` when nothing is due. */
export type ReminderResponse = ReminderDue | null

export interface GetDueReminderParams {
  profile: Profile
  checkIns: readonly CheckIn[]
  /** Completed reviews for this user — decides which week (if any) is still open for review. */
  reviews: readonly Review[]
  time: ISOTimestamp
  config?: DomainConfig
}

/**
 * The one thing to prompt about right now, if anything — same priority order
 * as `guards.ts`'s `resolvePendingAction` (review before check-in; this
 * function doesn't surface `final_summary`, since that screen has no
 * notification copy of its own today):
 *
 *   1. `review_due` — the earliest elapsed week that hasn't been reviewed
 *      yet. Stays due across the final-summary boundary (day 29+) until the
 *      user actually completes it — an open review doesn't expire.
 *   2. `checkin_due` — the earliest still-missing day in the current study
 *      week, once there's no open review left to nudge about.
 *
 * `null` before day 1 has started, once the programme is over with every
 * week reviewed, and any time neither of the above applies.
 */
export function getDueReminder({
  profile,
  checkIns,
  reviews,
  time,
  config = DEFAULT_CONFIG,
}: GetDueReminderParams): ReminderResponse {
  const calendar = createStudyCalendar(profile.interventionStartDate, time, config)
  const studyDay = calendar.currentDay()
  if (studyDay <= 0) return null

  const totalWeeks = config.PROGRAMME_DAYS / config.WEEK_LENGTH_DAYS
  for (let week = 1; week <= totalWeeks; week += 1) {
    const reviewDue = canReview({
      weekNo: week,
      weekElapsed: calendar.isWeekElapsed(week),
      alreadyReviewed: isWeekClosed(week, reviews),
    })
    if (reviewDue) return { kind: 'review_due', weekNo: week }
  }

  if (calendar.isFinalSummary()) return null

  const today = calendarDate(time)
  const weekNo = calendar.weekNo(studyDay)
  const checkInsByDate = new Map(checkIns.map((c) => [c.behaviorDate, c]))

  for (let day = calendar.firstDay(weekNo); day <= calendar.lastDay(weekNo); day += 1) {
    const behaviorDate = calendar.dateOf(day)
    const state = dayStateOf({ behaviorDate, today, checkIn: checkInsByDate.get(behaviorDate) })
    if (state === 'missing') return { kind: 'checkin_due', behaviorDate }
  }
  return null
}

export interface GetLastChanceDueParams {
  profile: Profile
  checkIns: readonly CheckIn[]
  time: ISOTimestamp
  config?: DomainConfig
}

/**
 * The last-chance nudge (independent of `getDueReminder`): is `time` the final
 * day of the current study week (day 7/14/21/28), and is at least one earlier
 * day of that week still missing a check-in? Tomorrow the week closes and those
 * records lock (CLAUDE.md: backfill only for the current week), so this is the
 * user's last chance to edit them. `false` before day 1 and once the programme
 * is over. The current day itself is always `future` (its check-in is done the
 * next day), so it never counts as missing here.
 */
export function getLastChanceDue({
  profile,
  checkIns,
  time,
  config = DEFAULT_CONFIG,
}: GetLastChanceDueParams): boolean {
  const calendar = createStudyCalendar(profile.interventionStartDate, time, config)
  const studyDay = calendar.currentDay()
  if (studyDay <= 0 || calendar.isFinalSummary()) return false

  const weekNo = calendar.weekNo(studyDay)
  if (studyDay !== calendar.lastDay(weekNo)) return false

  const today = calendarDate(time)
  const checkInsByDate = new Map(checkIns.map((c) => [c.behaviorDate, c]))
  for (let day = calendar.firstDay(weekNo); day <= calendar.lastDay(weekNo); day += 1) {
    const behaviorDate = calendar.dateOf(day)
    const state = dayStateOf({ behaviorDate, today, checkIn: checkInsByDate.get(behaviorDate) })
    if (state === 'missing') return true
  }
  return false
}

export interface IsReminderTimeDueParams {
  /** "HH:mm", 24h, local wall-clock — `config.ts`'s `REMINDER_TIMES` by default. */
  times: readonly string[]
  /** The instant a reminder last actually fired, or `null` if it never has. */
  lastFiredAt: ISOTimestamp | null
  /** Caller-supplied instant (offset-bearing, doc 02's timezone warning — see `clock.ts`). */
  now: ISOTimestamp
}

/**
 * Has any configured time-of-day slot been crossed since the last firing?
 * "HH:mm" is sliced straight off the instant, so `now` and `lastFiredAt`
 * must both carry the caller's local offset for this to mean local time, not
 * UTC. A slot only re-arms the next calendar day — once fired today at or
 * after a slot, that slot stays quiet until tomorrow.
 */
export function isReminderTimeDue({ times, lastFiredAt, now }: IsReminderTimeDueParams): boolean {
  const nowClock = now.slice(11, 16)
  const nowDay = calendarDate(now)
  const lastDay = lastFiredAt ? calendarDate(lastFiredAt) : null
  const lastClock = lastFiredAt ? lastFiredAt.slice(11, 16) : null

  return times.some((slot) => {
    if (nowClock < slot) return false
    if (lastDay === nowDay && lastClock !== null && lastClock >= slot) return false
    return true
  })
}
