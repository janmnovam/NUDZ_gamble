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
  submitCheckIn as buildRecord,
  validateCheckIn,
  type CheckInDraft,
} from '@domain/checkin.ts'
import { buildCheckInFeedback } from '@domain/feedback.ts'
import { calendarDate, createStudyCalendar, type StudyCalendar } from '@domain/clock.ts'
import { DomainError } from '@domain/errors.ts'
import type { CheckIn, ISOCalendarTimestamp, ISODate, ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInEditRepository,
  CheckInRepository,
  CopingStrategyRepository,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

export interface CheckInServiceDeps {
  checkIns: CheckInRepository
  checkInEdits: CheckInEditRepository
  limits: LimitRepository
  profiles: ProfileRepository
  /** Needed for the doc-07 coping reminder. */
  copingStrategies: CopingStrategyRepository
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
      throw new DomainError('not_found', 'CHECKIN_NO_PROFILE', `checkin: no profile for ${userId}`)

    const calendar = createStudyCalendar(profile.interventionStartDate, time)
    const today = calendarDate(time)
    // Entry is popup-gated to day ≥ 1, so `currentWeek()` never hits the day-0 throw.
    const weekFirstDay = calendar.dateOf(calendar.firstDay(calendar.currentWeek()))

    const draft: CheckInDraft = {
      behaviorDate: req.behaviorDate,
      played: req.played,
      timeMin: req.timeMin,
      stakesCzk: req.stakesCzk,
      winningsCzk: req.winningsCzk,
    }
    const validation = validateCheckIn(draft, { today, weekFirstDay })
    if (!validation.valid) return { ok: false, errors: validation.errors }

    // doc 05's "can't add/edit a closed week" is already enforced by the
    // validation above: `behaviorDate` must fall in the current week, which by
    // definition hasn't elapsed and so can't be review-closed yet. So no
    // separate `canEditCheckIn`/reviews check is reachable here — the field
    // error IS the visible refusal for any earlier (closed) week.
    const behaviorWeek = calendar.weekNo(calendar.studyDay(req.behaviorDate))
    const all = await this.deps.checkIns.listByUser(userId)
    const existing = all.find(
      (c) => calendarDate(c.behaviorDate) === calendarDate(req.behaviorDate),
    )
    if (requireExisting && !existing) {
      throw new DomainError(
        'not_found',
        'CHECKIN_NOTHING_TO_EDIT',
        'checkin: nothing to edit for that day',
      )
    }

    const record = buildRecord(userId, draft, behaviorWeek, time, this.deps.newId, existing)
    await this.deps.checkIns.save(record)

    await this.deps.checkInEdits.save({
      checkInEditId: this.deps.newId(),
      userId,
      checkInId: record.checkInId,
      action: existing ? 'updated' : 'created',
      editedAt: time,
      changedFields: changedFields(existing, record),
      before: existing ? JSON.stringify(existing) : null,
      after: JSON.stringify(record),
    })

    const feedback = await this.buildFeedback(userId, calendar, behaviorWeek, today)
    return { ok: true, checkIn: record, feedback }
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
