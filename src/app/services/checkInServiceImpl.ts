/**
 * Concrete CheckInService. Validates a draft, upserts the day's record (keyed on
 * `behaviorDate`), writes an audit row, and returns the doc-07 feedback payload.
 * Pure logic lives in `@domain/checkin.ts` + `@domain/feedback.ts`; this class
 * only orchestrates repos and the injected `newId`. `userId` and `time` are
 * caller-supplied per request. See docs/architecture.md §CheckInService.
 */
import type {
  CheckInRequest,
  CheckInResultResponse,
  CheckInService,
} from '@/app/ports/checkInService.ts'
import type { CheckInFeedbackDto } from '@/app/dto/checkin.ts'
import { type Result, run } from '@/app/result.ts'
import {
  isBackfill,
  submitCheckIn as buildRecord,
  validateCheckIn,
  type CheckInDraft,
} from '@domain/checkin.ts'
import { buildCheckInFeedback } from '@domain/feedback.ts'
import { calendarDate, createStudyCalendar, type StudyCalendar } from '@domain/clock.ts'
import { ERROR_CODES } from '@domain/errorCodes.ts'
import { DomainError, ERROR_TYPES } from '@domain/errors.ts'
import { canEditCheckIn, isWeekClosed } from '@domain/guards.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInEditRepository,
  CheckInRepository,
  CopingStrategyRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

export interface CheckInServiceDeps {
  checkIns: CheckInRepository
  checkInEdits: CheckInEditRepository
  limits: LimitRepository
  profiles: ProfileRepository
  /** Needed for the doc-07 coping reminder. */
  copingStrategies: CopingStrategyRepository
  /** Needed to reject backfill of a review-closed week. */
  reviews: ReviewRepository
  newId: () => string
}

/** Behavioral fields the audit trail tracks — timestamps/ids are excluded as noise. */
const TRACKED_FIELDS = ['played', 'timeMin', 'stakesCzk', 'winningsCzk'] as const

function changedFields(before: CheckIn | undefined, after: CheckIn): string[] {
  if (!before) return []
  return TRACKED_FIELDS.filter((f) => before[f] !== after[f])
}

export class CheckInServiceImpl implements CheckInService {
  private readonly deps: CheckInServiceDeps

  constructor(deps: CheckInServiceDeps) {
    this.deps = deps
  }

  submitCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<CheckInResultResponse>> {
    return run(() => this.write(req, userId, time, false))
  }

  editCheckIn(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<CheckInResultResponse>> {
    return run(() => this.write(req, userId, time, true))
  }

  private async write(
    req: CheckInRequest,
    userId: UserId,
    time: ISOTimestamp,
    requireExisting: boolean,
  ): Promise<CheckInResultResponse> {
    const profile = await this.deps.profiles.get(userId)
    if (!profile)
      throw new DomainError(
        ERROR_TYPES.NOT_FOUND,
        ERROR_CODES.checkin.NO_PROFILE,
        `checkin: no profile for ${userId}`,
      )

    const calendar = createStudyCalendar(profile.interventionStartDate, time)
    const today = calendarDate(time)

    const draft: CheckInDraft = {
      behaviorDate: req.behaviorDate,
      played: req.played,
      timeMin: req.timeMin,
      stakesCzk: req.stakesCzk,
      winningsCzk: req.winningsCzk,
    }
    // Form-actionable input problems (future date, numeric bounds) → field errors.
    const validation = validateCheckIn(draft, { today })
    if (!validation.valid) return { ok: false, errors: validation.errors }

    // Backfill eligibility for this fixed date — the rolling window and closed
    // week (doc 05, now a 5-day window rather than "current week"). These are
    // not form errors the user can fix, so they surface as thrown DomainErrors.
    const behaviorStudyDay = calendar.studyDay(req.behaviorDate)
    if (behaviorStudyDay < 1) {
      throw new DomainError(
        ERROR_TYPES.VALIDATION,
        ERROR_CODES.checkin.OUTSIDE_WINDOW,
        'checkin: behaviorDate is before the programme start',
      )
    }
    const behaviorWeek = calendar.weekNo(behaviorStudyDay)
    const reviews = await this.deps.reviews.listByUser(userId)
    const studyDayDiff = calendar.studyDay(today) - behaviorStudyDay
    const editability = canEditCheckIn({
      studyDayDiff,
      weekClosed: isWeekClosed(behaviorWeek, reviews),
    })
    if (editability === 'locked_week') {
      throw new DomainError(
        ERROR_TYPES.VALIDATION,
        ERROR_CODES.checkin.WEEK_CLOSED,
        `checkin: week ${String(behaviorWeek)} is closed`,
      )
    }
    if (editability === 'outside_window') {
      throw new DomainError(
        ERROR_TYPES.VALIDATION,
        ERROR_CODES.checkin.OUTSIDE_WINDOW,
        `checkin: ${String(studyDayDiff)} days back is outside the backfill window`,
      )
    }

    const all = await this.deps.checkIns.listByUser(userId)
    const existing = all.find(
      (c) => calendarDate(c.behaviorDate) === calendarDate(req.behaviorDate),
    )
    if (requireExisting && !existing) {
      throw new DomainError(
        ERROR_TYPES.NOT_FOUND,
        ERROR_CODES.checkin.NOTHING_TO_EDIT,
        'checkin: nothing to edit for that day',
      )
    }

    const record = buildRecord(userId, draft, behaviorWeek, time, this.deps.newId, existing)
    // Derived (never stored on the record): submitted more than a day after the
    // day it covers. Flagged on the audit row, the result, and the CSV export.
    const backfilled = isBackfill(record.behaviorDate, record.submittedAt)
    await this.deps.checkIns.save(record)

    await this.deps.checkInEdits.save({
      checkInEditId: this.deps.newId(),
      userId,
      checkInId: record.checkInId,
      action: existing ? 'updated' : 'created',
      backfill: backfilled,
      editedAt: time,
      changedFields: changedFields(existing, record),
      before: existing ? JSON.stringify(existing) : null,
      after: JSON.stringify(record),
    })

    const feedback = await this.buildFeedback(userId, calendar, behaviorWeek, today)
    return { ok: true, checkIn: record, feedback, backfilled }
  }

  private async buildFeedback(
    userId: UserId,
    calendar: StudyCalendar,
    week: number,
    today: ISODate,
  ): Promise<CheckInFeedbackDto> {
    // Re-list so the just-saved record is included in the week totals.
    const all = await this.deps.checkIns.listByUser(userId)
    const weekCheckIns = all.filter((c) => c.weekNo === week)
    const limits = await this.deps.limits.listByUser(userId)
    const limit = limits.find((l) => l.weekNo === week)
    const copingStrategies = await this.deps.copingStrategies.listByUser(userId)

    const weekDays: ISOCalendarTimestamp[] = []
    for (let d = calendar.firstDay(week); d <= calendar.lastDay(week); d += 1) {
      weekDays.push(calendar.dateOf(d))
    }

    return buildCheckInFeedback({
      weekNo: week,
      checkIns: weekCheckIns,
      limit,
      copingStrategies,
      weekDays,
      today,
    })
  }
}
