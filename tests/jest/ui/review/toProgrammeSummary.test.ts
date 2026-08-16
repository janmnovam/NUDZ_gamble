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
          days: week(1).days.map((d, i) => (i === 2 ? { ...d, state: 'missing' as const } : d)),
        }),
        week(2),
        week(3),
        week(4),
      ],
    }
    const s = toProgrammeSummary(response, () => 'po', iso(0))

    expect(s.weeks.flat().filter((d) => d.state === 'missing')).toHaveLength(1)
  })
})
