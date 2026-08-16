/**
 * Dashboard read model (doc 08) — one function builds this from source
 * records + limit history on every render. Nothing in here is persisted.
 */
import { calendarDate, createStudyCalendar, type StudyDay, type WeekNo } from '@domain/clock.ts'
import { dayStateOf, type DayState } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'
import { resolvePendingAction, type PendingAction } from '@domain/guards.ts'
import { classifyStatus, worseStatus } from '@domain/limits.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, UserId } from '@domain/model.ts'
import type { Clock, CheckInRepository, LimitRepository, ProfileRepository } from '@domain/ports.ts'

export interface AxisView {
  used: number
  limit: number
  /** Integer percent for display; null when `limit` is 0 (doc 04: no percentage shown). Classify on the raw ratio, not this. */
  pct: number | null
  status: Status
  /** `max(0, limit - used)` — or the overage, if the negative reading is chosen instead (doc 06, undecided). */
  remaining: number
}

export interface DayCell {
  studyDay: StudyDay
  date: ISOCalendarTimestamp
  state: DayState
  /** Present for `completed` / `backfilled` cells only. */
  played?: boolean
  timeMin?: number
  stakesCzk?: number
}

export interface DashboardVM {
  studyDay: StudyDay
  weekNo: WeekNo
  limits: { timeMin: number; stakesCzk: number }
  time: AxisView
  stakes: AxisView
  overallStatus: Status
  /** Always 7 entries: the current week's days. */
  days: DayCell[]
  /** Only days ≤ `today - 1` — future days are "not yet due", never missing. */
  missingDays: ISOCalendarTimestamp[]
  pendingAction: PendingAction
}

export type BuildDashboardVM = () => DashboardVM

/**
 * One day, once — the building block reused for both the dashboard's 7-cell
 * week strip and (later) a 28-cell month/final-summary view. The caller
 * loops over as many study days as it needs; this only ever knows about one.
 */
export function buildDayCell(params: {
  studyDay: StudyDay
  date: ISOCalendarTimestamp
  today: ISODate
  checkIn: CheckIn | undefined
}): DayCell {
  const { studyDay, date, today, checkIn } = params
  const state = dayStateOf({ behaviorDate: date, today, checkIn })
  if (checkIn && (state === 'completed' || state === 'backfilled')) {
    return {
      studyDay,
      date,
      state,
      played: checkIn.played,
      timeMin: checkIn.timeMin,
      stakesCzk: checkIn.stakesCzk,
    }
  }
  return { studyDay, date, state }
}

/**
 * doc 06: raw used/limit ratio drives `status`; `remaining` is left
 * unclamped (can read negative, i.e. "over by") per doc 06's edge-case call
 * that the overage is more informative than clamping to zero — the
 * alternative the `AxisView.remaining` doc comment above still flags as
 * undecided.
 */
function axisView(used: number, limit: number, config: DomainConfig): AxisView {
  return {
    used,
    limit,
    pct: limit > 0 ? Math.round((used / limit) * 100) : null,
    status: classifyStatus(used, limit, config),
    remaining: limit - used,
  }
}

export interface DashboardDeps {
  userId: UserId
  profileRepo: ProfileRepository
  limitRepo: LimitRepository
  checkInRepo: CheckInRepository
  /** Time source; "today" is the calendar date of `time()` (see `calendarDate`). */
  time: Clock
  config?: DomainConfig
}

/**
 * The dashboard use-case: current week's 7-day strip + both axes' cumulative
 * status, derived fresh from check-ins and limit history every call (CQRS-lite
 * read model, doc 08) — nothing here is ever persisted.
 */
export async function buildDashboardVM(deps: DashboardDeps): Promise<DashboardVM> {
  const config = deps.config ?? DEFAULT_CONFIG
  const profile = await deps.profileRepo.get(deps.userId)
  if (!profile) {
    throw new Error(`buildDashboardVM: no profile for user ${deps.userId}`)
  }

  const calendar = createStudyCalendar(profile.interventionStartDate, deps.time, config)
  const today = calendarDate(deps.time())
  const studyDay = calendar.currentDay()
  // Before day 1, currentDay() is <= 0 and weekNo() throws — clamp to week 1
  // (its days all classify as `future` against `today`, so this reads as the
  // doc-08 "waiting state", not a divide-by-zero week).
  const weekNo = calendar.weekNo(Math.max(studyDay, 1))

  const limits = await deps.limitRepo.listByUser(deps.userId)
  const limit = limits.find((l) => l.weekNo === weekNo)
  if (!limit) {
    throw new Error(`buildDashboardVM: no limit set for week ${String(weekNo)}`)
  }

  const checkIns = await deps.checkInRepo.listByUser(deps.userId)
  const checkInsByDate = new Map(checkIns.map((c) => [c.behaviorDate, c]))

  const days: DayCell[] = []
  for (let day = calendar.firstDay(weekNo); day <= calendar.lastDay(weekNo); day += 1) {
    const date = calendar.dateOf(day)
    days.push(buildDayCell({ studyDay: day, date, today, checkIn: checkInsByDate.get(date) }))
  }

  const missingDays = days.filter((d) => d.state === 'missing').map((d) => d.date)
  const usedTimeMin = days.reduce((sum, d) => sum + (d.timeMin ?? 0), 0)
  const usedStakesCzk = days.reduce((sum, d) => sum + (d.stakesCzk ?? 0), 0)

  const time = axisView(usedTimeMin, limit.weeklyLimitTimeMin, config)
  const stakes = axisView(usedStakesCzk, limit.weeklyLimitStakesCzk, config)

  return {
    studyDay,
    weekNo,
    limits: { timeMin: limit.weeklyLimitTimeMin, stakesCzk: limit.weeklyLimitStakesCzk },
    time,
    stakes,
    overallStatus: worseStatus(time.status, stakes.status),
    days,
    missingDays,
    pendingAction: resolvePendingAction({
      inFinalSummary: calendar.isFinalSummary(),
      // ReviewRepository/ReviewService don't exist yet (architecture.md TODO
      // #4/#7) — always "none due" until that's wired in.
      reviewableWeeks: [],
      checkinDue: missingDays.length > 0,
    }),
  }
}
