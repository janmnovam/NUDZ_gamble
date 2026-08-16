import type { FinalSummaryResponse, FinalSummaryWeekDto } from '@/app/dto/review.ts'
import { toFinalSummaryViewModel, type SummaryLabels } from '@ui/review/toFinalSummaryViewModel.ts'

const LABELS: SummaryLabels = {
  hourUnit: 'h',
  minuteUnit: 'min',
  currency: 'Kč',
  programmeDay: (studyDay) => `DEN ${String(studyDay)}`,
}

function week(overrides: Partial<FinalSummaryWeekDto> = {}): FinalSummaryWeekDto {
  const days = Array.from({ length: 7 }, (_, index) => ({
    studyDay: index + 1,
    date: `2026-09-0${String(index + 1)}T00:00:00.000Z`,
    state: 'completed' as const,
  }))
  return {
    weekNo: 1,
    time: { used: 350, limit: 480 },
    stakes: { used: 6500, limit: 8000 },
    timeStatus: 'OK',
    stakesStatus: 'POZOR',
    overall: 'POZOR',
    days,
    filledDays: 7,
    elapsed: true,
    ...overrides,
  }
}

function build(weeks: FinalSummaryWeekDto[], studyDay = 29) {
  const response: FinalSummaryResponse = { studyDay, weeks }
  return toFinalSummaryViewModel(response, 'cs', LABELS)
}

describe('toFinalSummaryViewModel', () => {
  it('labels usage and limits in the units each axis uses', () => {
    const vm = build([week()])

    expect(vm.weeks[0]?.timeUsedLabel).toBe('5 h 50 min')
    expect(vm.weeks[0]?.timeLimitLabel).toBe('8 h')
    expect(vm.weeks[0]?.stakesUsedLabel).toBe('6\u00A0500\u00A0Kč')
    expect(vm.weeks[0]?.stakesLimitLabel).toBe('8\u00A0000\u00A0Kč')
  })

  it('labels the programme day for the overline', () => {
    expect(build([week()]).programmeDayLabel).toBe('DEN 29')
  })

  it('never reads DEN 0 before the programme has started', () => {
    expect(build([week()], 0).programmeDayLabel).toBe('DEN 1')
  })

  it('keeps the limit verdict when every day is filled in', () => {
    expect(build([week()]).weeks[0]?.status).toBe('POZOR')
  })

  it('reports a week with gaps as NEUPLNE, since the totals are only a floor', () => {
    const days = week().days.map((d, i) => (i === 2 ? { ...d, state: 'missing' as const } : d))
    const vm = build([week({ days, filledDays: 6 })])

    expect(vm.weeks[0]?.status).toBe('NEUPLNE')
    expect(vm.weeks[0]?.filledDays).toBe(6)
    expect(vm.weeks[0]?.totalDays).toBe(7)
  })

  it('still reports an exceeded week as exceeded despite gaps', () => {
    const days = week().days.map((d, i) => (i === 2 ? { ...d, state: 'missing' as const } : d))
    const vm = build([week({ days, filledDays: 6, overall: 'PREKROCENO' })])

    // Going over is certain even with days missing — NEUPLNE must not hide it.
    expect(vm.weeks[0]?.status).toBe('PREKROCENO')
  })

  it('locks a week that has not elapsed, and gives it no verdict', () => {
    const vm = build([week({ elapsed: false })])

    expect(vm.weeks[0]?.locked).toBe(true)
    // A status here would read as a result, when the week simply hasn't happened.
    expect(vm.weeks[0]?.status).toBeUndefined()
  })

  it('leaves an elapsed week unlocked and judged', () => {
    const vm = build([week()])

    expect(vm.weeks[0]?.locked).toBe(false)
    expect(vm.weeks[0]?.status).toBe('POZOR')
  })

  it('numbers the day strip by programme day and localises the weekday', () => {
    const vm = build([week()])

    expect(vm.weeks[0]?.days.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(vm.weeks[0]?.days[0]?.dayLabel).toBe('út')
  })
})
