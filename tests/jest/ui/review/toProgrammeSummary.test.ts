import type { FinalSummaryResponse, FinalSummaryWeekDto } from '@/app/dto/review.ts'
import { toProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'

/** Day 1 is Tue 2026-09-01, so the grid must pad back to Mon 2026-08-31. */
const DAY_ONE = Date.UTC(2026, 8, 1)
const DAY_MS = 86_400_000

function iso(offsetDays: number): string {
  return new Date(DAY_ONE + offsetDays * DAY_MS).toISOString()
}

function week(weekNo: number, overrides: Partial<FinalSummaryWeekDto> = {}): FinalSummaryWeekDto {
  const days = Array.from({ length: 7 }, (_, index) => {
    const studyDay = (weekNo - 1) * 7 + index + 1
    return { studyDay, date: iso(studyDay - 1), state: 'completed' as const }
  })
  return {
    weekNo,
    time: { used: 100, limit: 480 },
    stakes: { used: 1000, limit: 8000 },
    timeStatus: 'OK',
    stakesStatus: 'OK',
    overall: 'OK',
    days,
    filledDays: 7,
    elapsed: true,
    started: true,
    closed: true,
    ...overrides,
  }
}

function build(todayIso = iso(0)) {
  const response: FinalSummaryResponse = {
    studyDay: 29,
    weeks: [week(1), week(2), week(3), week(4)],
  }
  return toProgrammeSummary(response, () => 'po', todayIso)
}

describe('toProgrammeSummary', () => {
  it('totals every week into one programme figure', () => {
    const s = build()

    expect(s.timeUsed).toBe(400)
    expect(s.timeLimit).toBe(1920)
    expect(s.stakesUsed).toBe(4000)
    expect(s.filledDays).toBe(28)
    expect(s.totalDays).toBe(28)
  })

  it('lays the programme out in whole Monday-to-Sunday rows', () => {
    const s = build()

    expect(s.weeks.every((row) => row.length === 7)).toBe(true)
    // 28 days starting on a Tuesday span five calendar weeks.
    expect(s.weeks).toHaveLength(5)
  })

  it('starts the grid on the Monday before day 1', () => {
    const first = build().weeks[0]?.[0]

    // Day 1 is Tue 1 Sep, so the grid opens on Mon 31 Aug.
    expect(first?.dayOfMonth).toBe(31)
  })

  it('locks calendar days before the programme, rather than calling them missing', () => {
    const first = build().weeks[0]?.[0]

    // "missing" means a gap in the record; a day before day 1 is not a gap.
    expect(first?.state).toBe('locked')
  })

  it('marks calendar days after the programme as outside', () => {
    const lastRow = build().weeks.at(-1)
    const trailing = lastRow?.at(-1)

    expect(trailing?.state).toBe('outside')
  })

  it('rings today without changing the state it already has', () => {
    const s = build(iso(0))
    const dayOne = s.weeks[0]?.[1]

    expect(dayOne?.today).toBe(true)
    // Day 1 is filled in, so it keeps that state and merely gains the ring.
    expect(dayOne?.state).toBe('completed')
  })

  it('rings nothing when today falls outside the grid', () => {
    const s = build(iso(400))
    expect(s.weeks.flat().some((day) => day.today)).toBe(false)
  })

  it('carries a missing day through as missing', () => {
    const response: FinalSummaryResponse = {
      studyDay: 29,
      weeks: [
        week(1, {
          closed: false,
          days: week(1).days.map((d, i) => (i === 2 ? { ...d, state: 'missing' as const } : d)),
        }),
        week(2),
        week(3),
        week(4),
      ],
    }
    const s = toProgrammeSummary(response, () => 'po', iso(3))

    expect(s.weeks.flat().filter((d) => d.state === 'missing')).toHaveLength(1)
  })

  it('makes a missing day actionable within the last five days, across a week boundary', () => {
    const response: FinalSummaryResponse = {
      studyDay: 9,
      weeks: [
        week(1, {
          closed: false,
          days: week(1).days.map((day, index) =>
            index === 3 ? { ...day, state: 'missing' as const } : day,
          ),
        }),
        week(2),
        week(3),
        week(4),
      ],
    }

    const summary = toProgrammeSummary(response, () => 'po', iso(8))
    const programmeDayFour = summary.weeks.flat().find((day) => day.date === iso(3))

    expect(programmeDayFour?.backfillable).toBe(true)
    expect(programmeDayFour?.state).toBe('missing')
  })

  it('does not make an older or review-closed missing day actionable', () => {
    const response: FinalSummaryResponse = {
      studyDay: 9,
      weeks: [
        week(1, {
          closed: false,
          days: week(1).days.map((day, index) =>
            index === 2 ? { ...day, state: 'missing' as const } : day,
          ),
        }),
        week(2, {
          closed: true,
          days: week(2).days.map((day, index) =>
            index === 0 ? { ...day, state: 'missing' as const } : day,
          ),
        }),
        week(3),
        week(4),
      ],
    }

    const summary = toProgrammeSummary(response, () => 'po', iso(8))
    const dayThree = summary.weeks.flat().find((day) => day.date === iso(2))
    const dayEight = summary.weeks.flat().find((day) => day.date === iso(7))

    expect(dayThree?.backfillable).toBe(false)
    expect(dayEight?.backfillable).toBe(false)
    expect(dayThree?.state).toBe('locked')
    expect(dayEight?.state).toBe('locked')
  })

  it('on day 14 locks every older day and keeps only the previous five days statusful', () => {
    const response: FinalSummaryResponse = {
      studyDay: 14,
      weeks: [
        week(1, { closed: false }),
        week(2, {
          closed: false,
          days: week(2).days.map((day, index) => ({
            ...day,
            state:
              index === 0 || index === 1
                ? ('completed' as const)
                : index < 6
                  ? ('missing' as const)
                  : ('future' as const),
          })),
        }),
        week(3),
        week(4),
      ],
    }

    const summary = toProgrammeSummary(response, () => 'po', iso(13))
    const programmeDays = summary.weeks.flat().filter((day) => day.date >= iso(0))
    const active = programmeDays.filter((day) => day.backfillable)

    expect(active.map((day) => day.date)).toEqual([iso(9), iso(10), iso(11), iso(12)])
    // Days 1–8 are older than five days. Day 1 and day 8 were completed, but
    // both deliberately lose their green state once their window has elapsed.
    expect(programmeDays.find((day) => day.date === iso(0))?.state).toBe('locked')
    expect(programmeDays.find((day) => day.date === iso(7))?.state).toBe('locked')
    // Day 9 is exactly five days back, so its completed state still shows.
    expect(programmeDays.find((day) => day.date === iso(8))?.state).toBe('completed')
    expect(programmeDays.find((day) => day.date === iso(12))?.state).toBe('missing')
    expect(programmeDays.find((day) => day.date === iso(13))?.state).toBe('future')
  })
})
