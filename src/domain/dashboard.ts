/**
 * Dashboard read model (doc 08) — one function builds this from source
 * records + limit history on every render. Nothing in here is persisted.
 */
import { calendarDate, createStudyCalendar, type StudyDay, type WeekNo } from '@domain/clock.ts'
import { dayStateOf, type DayState } from '@domain/checkin.ts'
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'
import { ERROR_CODES } from '@domain/errorCodes.ts'
import { DomainError, ERROR_TYPES } from '@domain/errors.ts'
import {
  canEditCheckIn,
  isWeekClosed,
  resolvePendingAction,
  type PendingAction,
} from '@domain/guards.ts'
import { classifyStatus, worseStatus } from '@domain/limits.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

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
  /** A `missing` day still inside the rolling backfill window (tappable to fill in). */
  backfillable: boolean
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
export function buildDayCell(
  params: {
    studyDay: StudyDay
    date: ISOCalendarTimestamp
    today: ISODate
    checkIn: CheckIn | undefined
    /** `studyDay(today) - studyDay(date)`; feeds the rolling backfill window. */
    studyDayDiff: number
    /** A review row exists for this day's week. */
    weekClosed: boolean
  },
  config: DomainConfig = DEFAULT_CONFIG,
): DayCell {
  const { studyDay, date, today, checkIn, studyDayDiff, weekClosed } = params
  const state = dayStateOf({ behaviorDate: date, today, checkIn })
  // Only a missing day is offer-able, and only inside the same window the
  // check-in service enforces (`canEditCheckIn`) — one source of truth.
  const backfillable =
    state === 'missing' && canEditCheckIn({ studyDayDiff, weekClosed }, config) === 'allowed'
  if (checkIn && (state === 'completed' || state === 'backfilled')) {
    return {
      studyDay,
      date,
      state,
      backfillable,
      played: checkIn.played,
      timeMin: checkIn.timeMin,
      stakesCzk: checkIn.stakesCzk,
    }
  }
  return { studyDay, date, state, backfillable }
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
  /** Needed to gate a missing day's `backfillable` flag on a review-closed week. */
  reviewRepo: ReviewRepository
  /** Caller-supplied instant; "today" is its calendar date (see `calendarDate`). */
  time: ISOTimestamp
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
    throw new DomainError(
      ERROR_TYPES.NOT_FOUND,
      ERROR_CODES.dashboard.NO_PROFILE,
      `buildDashboardVM: no profile for user ${deps.userId}`,
    )
  }

  const calendar = createStudyCalendar(profile.interventionStartDate, deps.time, config)
  const today = calendarDate(deps.time)
  const studyDay = calendar.currentDay()
  // Clamp both ends: before day 1, currentDay() is <= 0 and weekNo() throws,
  // so read week 1 (its days all classify as `future` against `today` — the
  // doc-08 "waiting state"). Past day 28 there is no week 5 to look a limit
  // up for (CLAUDE.md: "final summary opens during day 29, no next-week
  // limits") — read week 4's already-closed strip instead of throwing.
  const weekNo = calendar.weekNo(Math.min(Math.max(studyDay, 1), config.PROGRAMME_DAYS))

  const limits = await deps.limitRepo.listByUser(deps.userId)
  const limit = limits.find((l) => l.weekNo === weekNo)
  if (!limit) {
    throw new DomainError(
      ERROR_TYPES.NOT_FOUND,
      ERROR_CODES.dashboard.NO_LIMIT,
      `buildDashboardVM: no limit set for week ${String(weekNo)}`,
    )
  }

  const checkIns = await deps.checkInRepo.listByUser(deps.userId)
  const checkInsByDate = new Map(checkIns.map((c) => [c.behaviorDate, c]))

  const reviews = await deps.reviewRepo.listByUser(deps.userId)
  // The strip is one week, so `weekClosed` is the same for every cell here.
  const weekClosed = isWeekClosed(weekNo, reviews)

  const days: DayCell[] = []
  for (let day = calendar.firstDay(weekNo); day <= calendar.lastDay(weekNo); day += 1) {
    const date = calendar.dateOf(day)
    days.push(
      buildDayCell(
        {
          studyDay: day,
          date,
          today,
          checkIn: checkInsByDate.get(date),
          studyDayDiff: studyDay - day,
          weekClosed,
        },
        config,
      ),
    )
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
