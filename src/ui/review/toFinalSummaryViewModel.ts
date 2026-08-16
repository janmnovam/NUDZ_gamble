import { type FinalSummaryResponse, type FinalSummaryWeekDto } from '@/app/dto/review.ts'
import {
  type FinalSummaryViewModel,
  type FinalSummaryWeek,
  type ReviewStatus,
  type WeekState,
} from '@ui/review/types.ts'
import { weekdayAbbrev } from '@ui/lib/date.ts'
import { formatDurationCompact } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

export interface SummaryLabels {
  hourUnit: string
  minuteUnit: string
  currency: string
  /** Rendered as the overline, e.g. "DEN 29". */
  programmeDay: (studyDay: number) => string
}

/**
 * A week with a gap in its record reads as `NEÚPLNÉ` rather than a limit
 * verdict: with days missing, the totals are a floor, not a fact, so claiming
 * "OK" would overstate what the data supports. An exceeded limit still wins —
 * that much is certain even with days missing.
 */
function weekStatus(week: FinalSummaryWeekDto): ReviewStatus {
  if (week.overall === 'PREKROCENO') return 'PREKROCENO'
  // Only a day that was actually due can be a gap; a day still ahead isn't one.
  const gaps = week.days.filter((day) => day.state === 'missing').length
  return gaps > 0 ? 'NEUPLNE' : week.overall
}

function weekState(week: FinalSummaryWeekDto): WeekState {
  if (!week.started) return 'locked'
  if (!week.elapsed) return 'running'
  return week.closed ? 'closed' : 'awaiting-close'
}

function toWeek(
  week: FinalSummaryWeekDto,
  locale: string,
  labels: SummaryLabels,
): FinalSummaryWeek {
  const minutes = (value: number) =>
    formatDurationCompact(value, labels.hourUnit, labels.minuteUnit)
  const czk = (value: number) => `${groupThousands(value)}\u00A0${labels.currency}`

  return {
    weekNo: week.weekNo,
    state: weekState(week),
    // Only a closed week has a verdict: while it is running the numbers still
    // move, and until the review closes it they are not final.
    ...(week.closed && { status: weekStatus(week) }),
    timeUsedLabel: minutes(week.time.used),
    timeLimitLabel: minutes(week.time.limit),
    stakesUsedLabel: czk(week.stakes.used),
    stakesLimitLabel: czk(week.stakes.limit),
    filledDays: week.filledDays,
    totalDays: week.days.length,
    days: week.days.map((day) => ({
      dayLabel: weekdayAbbrev(day.date, locale),
      // The review strip numbers days by their place in the programme (1–28),
      // unlike the dashboard's strip, which shows the day of the month.
      dayNumber: day.studyDay,
      state: day.state,
    })),
  }
}

/** Turns the service response into the labelled shape the review screens render. */
export function toFinalSummaryViewModel(
  response: FinalSummaryResponse,
  locale: string,
  labels: SummaryLabels,
): FinalSummaryViewModel {
  return {
    // Before day 1 the study day is <= 0; the dashboard header clamps the same
    // way, so neither screen ever reads "DEN 0".
    programmeDayLabel: labels.programmeDay(Math.max(response.studyDay, 1)),
    weeks: response.weeks.map((week) => toWeek(week, locale, labels)),
  }
}
