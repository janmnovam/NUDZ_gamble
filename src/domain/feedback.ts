/**
 * Post-check-in feedback presenter (doc 07) — turns the current week's totals,
 * the week's limit, and the user's coping strategies into a flat payload the UI
 * renders after every save. Pure; reuses `classifyStatus`/`worseStatus` from
 * `@domain/limits.ts` so the thresholds never fork from the dashboard's.
 *
 * The axis shape matches the app layer's `AxisDto` field-for-field, so the
 * service returns it directly (no rename mapper), same convention as the review
 * VMs. Formatting (h/min, thousands separators, exact wording) is the UI's job.
 */
import { dayStateOf } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'
import { classifyStatus, worseStatus } from '@domain/limits.ts'
import type { CheckIn, CopingStrategy, ISOCalendarTimestamp, ISODate, Limit } from '@domain/model.ts'

export interface FeedbackAxis {
  used: number
  limit: number
  /** Integer percent for display; null when `limit` is 0 (no percentage shown). */
  percent: number | null
  /** `limit - used`, unclamped — can read negative ("over by"). */
  remaining: number
  status: Status
}

export interface CheckInFeedback {
  weekNo: number
  time: FeedbackAxis
  stakes: FeedbackAxis
  overall: Status
  /** Top-priority active coping label at POZOR/PREKROCENO, else null (doc 07). */
  copingReminder: string | null
  /** True when a past day of the week has no record — the "data incomplete" note. */
  incompleteWeek: boolean
}

export interface CheckInFeedbackInput {
  weekNo: number
  /** The current week's check-ins (already filtered to the week). */
  checkIns: readonly CheckIn[]
  limit: Limit | undefined
  copingStrategies: readonly CopingStrategy[]
  /** The week's 7 canonical day timestamps, for the missing-day check. */
  weekDays: readonly ISOCalendarTimestamp[]
  today: ISODate
  config?: DomainConfig
}

function axis(used: number, limit: number, config: DomainConfig): FeedbackAxis {
  return {
    used,
    limit,
    percent: limit > 0 ? Math.round((used / limit) * 100) : null,
    remaining: limit - used,
    status: classifyStatus(used, limit, config),
  }
}

export function buildCheckInFeedback(input: CheckInFeedbackInput): CheckInFeedback {
  const config = input.config ?? DEFAULT_CONFIG
  const timeLimit = input.limit?.weeklyLimitTimeMin ?? 0
  const stakesLimit = input.limit?.weeklyLimitStakesCzk ?? 0

  const usedTime = input.checkIns.reduce((s, c) => s + c.timeMin, 0)
  const usedStakes = input.checkIns.reduce((s, c) => s + c.stakesCzk, 0)

  const time = axis(usedTime, timeLimit, config)
  const stakes = axis(usedStakes, stakesLimit, config)
  const overall = worseStatus(time.status, stakes.status)

  const byDate = new Map(input.checkIns.map((c) => [c.behaviorDate, c]))
  const incompleteWeek = input.weekDays.some(
    (d) => dayStateOf({ behaviorDate: d, today: input.today, checkIn: byDate.get(d) }) === 'missing',
  )

  const topActive = input.copingStrategies
    .filter((s) => s.active)
    .sort((a, b) => a.priority - b.priority)[0]
  const copingReminder =
    (overall === 'POZOR' || overall === 'PREKROCENO') && topActive ? topActive.label : null

  return { weekNo: input.weekNo, time, stakes, overall, copingReminder, incompleteWeek }
}
