/**
 * Dashboard read model (doc 08) — one function builds this from source
 * records + limit history on every render. Nothing in here is persisted.
 */
import { createStudyCalendar, type StudyDay, type TodayClock, type WeekNo } from '@domain/clock.ts'
import { dayStateOf, type DayState } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'
import { resolvePendingAction, type PendingAction } from '@domain/guards.ts'
import { classifyStatus, worseStatus } from '@domain/limits.ts'
import type { CheckIn, ISODate, UserId } from '@domain/model.ts'
import type { CheckInRepository, LimitRepository, ProfileRepository } from '@domain/ports.ts'

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
  study_day: StudyDay
  date: ISODate
  state: DayState
  /** Present for `completed` / `backfilled` cells only. */
  played?: boolean
  time_min?: number
  stakes_czk?: number
}

export interface DashboardVM {
  study_day: StudyDay
  week_no: WeekNo
  limits: { time_min: number; stakes_czk: number }
  time: AxisView
  stakes: AxisView
  overall_status: Status
  /** Always 7 entries: the current week's days. */
  days: DayCell[]
  /** Only days ≤ `today - 1` — future days are "not yet due", never missing. */
  missing_days: ISODate[]
  pending_action: PendingAction
}

export type BuildDashboardVM = () => DashboardVM

/**
 * One day, once — the building block reused for both the dashboard's 7-cell
 * week strip and (later) a 28-cell month/final-summary view. The caller
 * loops over as many study days as it needs; this only ever knows about one.
 */
export function buildDayCell(params: {
  study_day: StudyDay
  date: ISODate
  today: ISODate
  check_in: CheckIn | undefined
}): DayCell {
  const { study_day, date, today, check_in } = params
  const state = dayStateOf({ behavior_date: date, today, check_in })
  if (check_in && (state === 'completed' || state === 'backfilled')) {
    return {
      study_day,
      date,
      state,
      played: check_in.played,
      time_min: check_in.time_min,
      stakes_czk: check_in.stakes_czk,
    }
  }
  return { study_day, date, state }
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
  user_id: UserId
  profileRepo: ProfileRepository
  limitRepo: LimitRepository
  checkInRepo: CheckInRepository
  /** Local calendar "today" — same source the study calendar reads back with. */
  today: TodayClock
  config?: DomainConfig
}

/**
 * The dashboard use-case: current week's 7-day strip + both axes' cumulative
 * status, derived fresh from check-ins and limit history every call (CQRS-lite
 * read model, doc 08) — nothing here is ever persisted.
 */
export async function buildDashboardVM(deps: DashboardDeps): Promise<DashboardVM> {
  const config = deps.config ?? DEFAULT_CONFIG
  const profile = await deps.profileRepo.get(deps.user_id)
  if (!profile) {
    throw new Error(`buildDashboardVM: no profile for user ${deps.user_id}`)
  }

  const calendar = createStudyCalendar(profile.intervention_start_date, deps.today, config)
  const today = deps.today.today()
  const study_day = calendar.currentDay()
  // Before day 1, currentDay() is <= 0 and weekNo() throws — clamp to week 1
  // (its days all classify as `future` against `today`, so this reads as the
  // doc-08 "waiting state", not a divide-by-zero week).
  const week_no = calendar.weekNo(Math.max(study_day, 1))

  const limits = await deps.limitRepo.listByUser(deps.user_id)
  const limit = limits.find((l) => l.week_no === week_no)
  if (!limit) {
    throw new Error(`buildDashboardVM: no limit set for week ${String(week_no)}`)
  }

  const checkIns = await deps.checkInRepo.listByUser(deps.user_id)
  const checkInsByDate = new Map(checkIns.map((c) => [c.behavior_date, c]))

  const days: DayCell[] = []
  for (let day = calendar.firstDay(week_no); day <= calendar.lastDay(week_no); day += 1) {
    const date = calendar.dateOf(day)
    days.push(buildDayCell({ study_day: day, date, today, check_in: checkInsByDate.get(date) }))
  }

  const missing_days = days.filter((d) => d.state === 'missing').map((d) => d.date)
  const used_time_min = days.reduce((sum, d) => sum + (d.time_min ?? 0), 0)
  const used_stakes_czk = days.reduce((sum, d) => sum + (d.stakes_czk ?? 0), 0)

  const time = axisView(used_time_min, limit.weekly_limit_time_min, config)
  const stakes = axisView(used_stakes_czk, limit.weekly_limit_stakes_czk, config)

  return {
    study_day,
    week_no,
    limits: { time_min: limit.weekly_limit_time_min, stakes_czk: limit.weekly_limit_stakes_czk },
    time,
    stakes,
    overall_status: worseStatus(time.status, stakes.status),
    days,
    missing_days,
    pending_action: resolvePendingAction({
      in_final_summary: calendar.isFinalSummary(),
      // ReviewRepository/ReviewService don't exist yet (architecture.md TODO
      // #4/#7) — always "none due" until that's wired in.
      reviewable_weeks: [],
      checkin_due: missing_days.length > 0,
    }),
  }
}
