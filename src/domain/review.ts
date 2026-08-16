/**
 * ReviewService domain logic (doc 09) — the weekly review: surface a closed
 * week's outcome, complete it (writing next week's limit), and the final
 * summary after day 28. Pure; repos, calendar sources, time, and id injected.
 * The camelCase VMs here match the app-layer DTOs field-for-field, so the
 * service returns them directly (no rename mapper needed, unlike the dashboard).
 */
import {
  calendarDate,
  createStudyCalendar,
  type StudyCalendar,
  type StudyDay,
} from '@domain/clock.ts'
import { DEFAULT_CONFIG, type DomainConfig, type Status } from '@domain/config.ts'
import { DomainError } from '@domain/errors.ts'
import { canReview, isWeekClosed } from '@domain/guards.ts'
import { classifyStatus, isWithinCap, suggestLimit, worseStatus } from '@domain/limits.ts'
import type {
  CheckIn,
  ISOCalendarTimestamp,
  ISODate,
  ISOTimestamp,
  Limit,
  Review,
  UserId,
} from '@domain/model.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

const TOTAL_WEEKS = DEFAULT_CONFIG.PROGRAMME_DAYS / DEFAULT_CONFIG.WEEK_LENGTH_DAYS // 4

export interface AxisSummary {
  used: number
  limit: number
  status: Status
}

export interface ReviewVM {
  weekNo: number
  time: AxisSummary
  stakes: AxisSummary
  missingDays: ISOCalendarTimestamp[]
  suggestedNextLimits: { timeMinutes: number; stakesAmount: number }
}

/**
 * One day of the programme. `missing` is a gap in the record — a day that has
 * passed with no check-in — and never a zero. A day that simply hasn't arrived
 * yet is `future`: the summary is reachable from day 1, so most of the
 * programme is still ahead and must not read as missing data.
 */
export interface FinalSummaryDayVM {
  /** 1..28 — the day's position in the programme. */
  studyDay: StudyDay
  date: ISOCalendarTimestamp
  state: 'completed' | 'missing' | 'future'
}

export interface FinalSummaryWeekVM {
  weekNo: number
  /** Cumulative usage against that week's limit; 0 limit when none was set. */
  time: { used: number; limit: number }
  stakes: { used: number; limit: number }
  timeStatus: Status
  stakesStatus: Status
  overall: Status
  /** Always 7 entries, in study-day order. */
  days: FinalSummaryDayVM[]
  /** How many of the week's 7 days have a record. */
  filledDays: number
  /**
   * Whether the week's seven days have all passed. A week still ahead carries
   * no verdict — its statuses are computed against no data and mean nothing.
   */
  elapsed: boolean
}

export interface FinalSummaryVM {
  /** The programme day the summary is being read on — 29 once it has finished. */
  studyDay: StudyDay
  weeks: FinalSummaryWeekVM[]
}

export interface CompleteReviewInput {
  reviewWeekNo: number
  nextLimits: { timeMinutes: number; stakesAmount: number }
  incomplete: boolean
}

export interface ReviewDeps {
  userId: UserId
  profiles: ProfileRepository
  limits: LimitRepository
  checkIns: CheckInRepository
  reviews: ReviewRepository
  /** Caller-supplied instant; "today" is its calendar date (see `calendarDate`). */
  time: ISOTimestamp
  newId: () => string
  config?: DomainConfig
}

function weekTotals(
  checkIns: readonly CheckIn[],
  weekNo: number,
): { timeMin: number; stakesCzk: number } {
  const week = checkIns.filter((c) => c.weekNo === weekNo)
  return {
    timeMin: week.reduce((s, c) => s + c.timeMin, 0),
    stakesCzk: week.reduce((s, c) => s + c.stakesCzk, 0),
  }
}

function missingDaysForWeek(
  calendar: StudyCalendar,
  weekNo: number,
  today: ISODate,
  checkIns: readonly CheckIn[],
): ISOCalendarTimestamp[] {
  const days: ISOCalendarTimestamp[] = []
  for (let day = calendar.firstDay(weekNo); day <= calendar.lastDay(weekNo); day += 1) {
    const date = calendar.dateOf(day)
    // Compare only the YYYY-MM-DD portion — `dateOf`/`behaviorDate` are canonical
    // timestamps, `today` is a bare date (see @domain/clock.ts).
    if (calendarDate(date) >= today) continue // future / today: not yet due
    if (!checkIns.some((c) => calendarDate(c.behaviorDate) === calendarDate(date))) days.push(date)
  }
  return days
}

export async function getPendingReview(deps: ReviewDeps): Promise<ReviewVM | null> {
  const config = deps.config ?? DEFAULT_CONFIG
  const profile = await deps.profiles.get(deps.userId)
  if (!profile)
    throw new DomainError('not_found', 'REVIEW_NO_PROFILE', `review: no profile for ${deps.userId}`)

  const calendar = createStudyCalendar(profile.interventionStartDate, deps.time, config)
  const reviews = await deps.reviews.listByUser(deps.userId)

  let week = 0
  for (let w = 1; w <= TOTAL_WEEKS; w += 1) {
    if (
      canReview({
        weekNo: w,
        weekElapsed: calendar.isWeekElapsed(w),
        alreadyReviewed: isWeekClosed(w, reviews),
      })
    ) {
      week = w
      break
    }
  }
  if (week === 0) return null

  const checkIns = await deps.checkIns.listByUser(deps.userId)
  const limits = await deps.limits.listByUser(deps.userId)
  const limit = limits.find((l) => l.weekNo === week)
  const timeLimit = limit?.weeklyLimitTimeMin ?? 0
  const stakesLimit = limit?.weeklyLimitStakesCzk ?? 0
  const totals = weekTotals(checkIns, week)
  const today = calendarDate(deps.time)

  return {
    weekNo: week,
    time: {
      used: totals.timeMin,
      limit: timeLimit,
      status: classifyStatus(totals.timeMin, timeLimit, config),
    },
    stakes: {
      used: totals.stakesCzk,
      limit: stakesLimit,
      status: classifyStatus(totals.stakesCzk, stakesLimit, config),
    },
    missingDays: missingDaysForWeek(calendar, week, today, checkIns),
    suggestedNextLimits: {
      timeMinutes: suggestLimit(profile.referenceTimeMin, config),
      stakesAmount: suggestLimit(profile.referenceStakesCzk, config),
    },
  }
}

export async function completeReview(input: CompleteReviewInput, deps: ReviewDeps): Promise<void> {
  const config = deps.config ?? DEFAULT_CONFIG
  const profile = await deps.profiles.get(deps.userId)
  if (!profile)
    throw new DomainError('not_found', 'REVIEW_NO_PROFILE', `review: no profile for ${deps.userId}`)

  if (!isWithinCap(input.nextLimits.timeMinutes, profile.referenceTimeMin, config)) {
    throw new DomainError(
      'validation',
      'REVIEW_TIME_CAP',
      'review: next time limit exceeds the 90% cap',
    )
  }
  if (!isWithinCap(input.nextLimits.stakesAmount, profile.referenceStakesCzk, config)) {
    throw new DomainError(
      'validation',
      'REVIEW_STAKES_CAP',
      'review: next stakes limit exceeds the 90% cap',
    )
  }

  const limits = await deps.limits.listByUser(deps.userId)
  const current = limits.find((l) => l.weekNo === input.reviewWeekNo)
  // Undefined `current` ⇒ the first comparison is `undefined !== number` ⇒ true
  // (changed) and short-circuits, so the plain `current.` on the right is safe.
  const limitChanged =
    current?.weeklyLimitTimeMin !== input.nextLimits.timeMinutes ||
    current.weeklyLimitStakesCzk !== input.nextLimits.stakesAmount

  const at = deps.time

  // ponytail: two non-transactional writes — a crash between them leaves next
  // week's limit set without a review row. Acceptable for a local single-user
  // PWA; upgrade to an atomic repo (like OnboardingRepository) if it matters.
  if (input.reviewWeekNo < TOTAL_WEEKS) {
    const nextLimit: Limit = {
      limitId: deps.newId(),
      userId: deps.userId,
      weekNo: input.reviewWeekNo + 1,
      weeklyLimitTimeMin: input.nextLimits.timeMinutes,
      weeklyLimitStakesCzk: input.nextLimits.stakesAmount,
      limitSetAt: at,
    }
    await deps.limits.save(nextLimit)
  }

  const review: Review = {
    reviewId: deps.newId(),
    userId: deps.userId,
    reviewWeekNo: input.reviewWeekNo,
    reviewCompletedAt: at,
    limitChanged,
    incomplete: input.incomplete,
  }
  await deps.reviews.save(review)
}

export async function getFinalSummary(deps: ReviewDeps): Promise<FinalSummaryVM> {
  const config = deps.config ?? DEFAULT_CONFIG
  const profile = await deps.profiles.get(deps.userId)
  if (!profile) throw new Error(`review: no profile for ${deps.userId}`)

  const calendar = createStudyCalendar(profile.interventionStartDate, deps.time, config)
  const today = calendarDate(deps.time)
  const checkIns = await deps.checkIns.listByUser(deps.userId)
  const limits = await deps.limits.listByUser(deps.userId)
  const recorded = new Set(checkIns.map((c) => calendarDate(c.behaviorDate)))

  const weeks: FinalSummaryWeekVM[] = []
  for (let w = 1; w <= TOTAL_WEEKS; w += 1) {
    const totals = weekTotals(checkIns, w)
    const limit = limits.find((l) => l.weekNo === w)
    const timeStatus = classifyStatus(totals.timeMin, limit?.weeklyLimitTimeMin ?? 0, config)
    const stakesStatus = classifyStatus(totals.stakesCzk, limit?.weeklyLimitStakesCzk ?? 0, config)

    const days: FinalSummaryDayVM[] = []
    for (let day = calendar.firstDay(w); day <= calendar.lastDay(w); day += 1) {
      const date = calendar.dateOf(day)
      // Same cutoff as `missingDaysForWeek`: today is not yet due either, since
      // a check-in always covers the previous day.
      const due = calendarDate(date) < today
      days.push({
        studyDay: day,
        date,
        state: recorded.has(calendarDate(date)) ? 'completed' : due ? 'missing' : 'future',
      })
    }

    weeks.push({
      weekNo: w,
      time: { used: totals.timeMin, limit: limit?.weeklyLimitTimeMin ?? 0 },
      stakes: { used: totals.stakesCzk, limit: limit?.weeklyLimitStakesCzk ?? 0 },
      timeStatus,
      stakesStatus,
      overall: worseStatus(timeStatus, stakesStatus),
      days,
      filledDays: days.filter((d) => d.state === 'completed').length,
      elapsed: calendar.isWeekElapsed(w),
    })
  }

  return { studyDay: calendar.currentDay(), weeks }
}
