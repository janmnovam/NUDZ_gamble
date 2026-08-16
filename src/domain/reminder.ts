/**
 * Reminder domain (doc 08's "one working reminder scenario") — two separate
 * pure questions, kept apart on purpose:
 *
 *   1. `getDueReminder` — is there anything to prompt the user about right
 *      now (a missing check-in in the current study week)? Content only, no
 *      notion of clock time.
 *   2. `isReminderTimeDue` — has a configured wall-clock slot
 *      (`config.ts`'s `REMINDER_TIMES`) just been crossed, so it's time to
 *      check #1 and, if it says yes, pop a system notification?
 *
 * Both are framework-free: nothing here touches `Notification`, a timer, or
 * storage. The app layer (`NotificationService`) composes them; the UI is
 * the one that actually shows a popup.
 */
import { calendarDate, createStudyCalendar } from '@domain/clock.ts'
import { dayStateOf } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import type { CheckIn, ISOCalendarTimestamp, ISOTimestamp, Profile } from '@domain/model.ts'

export type ReminderKind = 'checkin_due'

export interface ReminderDue {
  kind: ReminderKind
  behaviorDate: ISOCalendarTimestamp
}

/** `null` when nothing is due. */
export type ReminderResponse = ReminderDue | null

export interface GetDueReminderParams {
  profile: Profile
  checkIns: readonly CheckIn[]
  time: ISOTimestamp
  config?: DomainConfig
}

/**
 * The earliest still-missing day in the current study week, if any — the one
 * thing the reminder currently prompts for. `null` before day 1 has started
 * and once the programme is over (day 29's final summary has its own prompt,
 * resolved separately by `guards.ts`'s `resolvePendingAction`, not this).
 */
export function getDueReminder({
  profile,
  checkIns,
  time,
  config = DEFAULT_CONFIG,
}: GetDueReminderParams): ReminderResponse {
  const calendar = createStudyCalendar(profile.interventionStartDate, time, config)
  const studyDay = calendar.currentDay()
  if (studyDay <= 0 || calendar.isFinalSummary()) return null

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
