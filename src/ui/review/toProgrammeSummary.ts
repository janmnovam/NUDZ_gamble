import type { FinalSummaryResponse } from '@/app/dto/review.ts'
import type { DayCellState } from '@ui/components/DayCell.tsx'

export interface ProgrammeDay {
  /** Day of the month, as the calendar shows it. */
  dayOfMonth: number
  /** Localised weekday abbreviation. */
  weekday: string
  state: DayCellState
  /** Rings the cell without changing its state. */
  today: boolean
  /** ISO date, used as a stable key. */
  date: string
  /** UI hint: a missing day from the last five days in a still-open week. */
  backfillable: boolean
}

export interface ProgrammeSummary {
  timeUsed: number
  timeLimit: number
  stakesUsed: number
  stakesLimit: number
  filledDays: number
  totalDays: number
  /** Calendar rows of 7, Monday-first, padding the programme out to whole weeks. */
  weeks: ProgrammeDay[][]
}

const DAY_MS = 86_400_000
const BACKFILL_WINDOW_DAYS = 5

/** UTC parts, because the DTO's dates are timestamps pinned to UTC midnight. */
function utcNoon(date: string): Date {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** Monday = 0 … Sunday = 6, matching the grid's column order. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

/**
 * Lays the programme's 28 days out as calendar weeks.
 *
 * The grid is padded to whole Monday–Sunday rows, so days on either side of the
 * programme appear too: before it they read as `locked` (the programme hadn't
 * started), after it as `outside`. Neither is a gap in the record — only a day
 * *inside* the programme with no check-in is `missing`.
 */
export function toProgrammeSummary(
  response: FinalSummaryResponse,
  weekdayOf: (isoDate: string) => string,
  todayIso: string,
): ProgrammeSummary {
  const days = response.weeks.flatMap((week) =>
    week.days.map((day) => ({ ...day, weekClosed: week.closed })),
  )
  const totals = response.weeks.reduce(
    (acc, week) => ({
      timeUsed: acc.timeUsed + week.time.used,
      timeLimit: acc.timeLimit + week.time.limit,
      stakesUsed: acc.stakesUsed + week.stakes.used,
      stakesLimit: acc.stakesLimit + week.stakes.limit,
      filledDays: acc.filledDays + week.filledDays,
    }),
    { timeUsed: 0, timeLimit: 0, stakesUsed: 0, stakesLimit: 0, filledDays: 0 },
  )

  const first = days[0]
  const last = days[days.length - 1]
  if (first === undefined || last === undefined) {
    return { ...totals, totalDays: 0, weeks: [] }
  }

  const byDate = new Map(days.map((day) => [utcNoon(day.date).getTime(), day]))
  const start = utcNoon(first.date).getTime() - mondayIndex(utcNoon(first.date)) * DAY_MS
  const end = utcNoon(last.date).getTime() + (6 - mondayIndex(utcNoon(last.date))) * DAY_MS
  const todayTime = utcNoon(todayIso).getTime()

  const weeks: ProgrammeDay[][] = []
  for (let time = start; time <= end; time += DAY_MS) {
    const day = byDate.get(time)
    const iso = new Date(time).toISOString()
    const state: DayCellState =
      day === undefined ? (time < utcNoon(first.date).getTime() ? 'locked' : 'outside') : day.state

    const cell: ProgrammeDay = {
      dayOfMonth: new Date(time).getUTCDate(),
      weekday: weekdayOf(iso),
      state,
      today: time === todayTime,
      date: iso,
      backfillable:
        day?.state === 'missing' &&
        !day.weekClosed &&
        (todayTime - time) / DAY_MS >= 1 &&
        (todayTime - time) / DAY_MS <= BACKFILL_WINDOW_DAYS,
    }
    const row = weeks[weeks.length - 1]
    if (row === undefined || row.length === 7) weeks.push([cell])
    else row.push(cell)
  }

  return { ...totals, totalDays: days.length, weeks }
}
