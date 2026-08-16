import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { FinalSummaryFlow } from '@ui/review/FinalSummaryFlow.tsx'
import type { ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'

/** The month grid has its own tests; this flow only needs something to render. */
const PROGRAMME: ProgrammeSummary = {
  timeUsed: 0,
  timeLimit: 0,
  stakesUsed: 0,
  stakesLimit: 0,
  filledDays: 0,
  totalDays: 28,
  weeks: [],
}
import type { FinalSummaryViewModel } from '@ui/review/types.ts'

const TEST_SUMMARY: FinalSummaryViewModel = {
  programmeDayLabel: 'TEST DAY',
  weeks: [
    {
      weekNo: 1,
      state: 'closed' as const,
      status: 'PREKROCENO',
      timeUsedLabel: 'test time used',
      timeLimitLabel: 'test time limit',
      stakesUsedLabel: 'test stakes used',
      stakesLimitLabel: 'test stakes limit',
      filledDays: 6,
      totalDays: 7,
      days: [
        { dayLabel: 'PO', dayNumber: 1, state: 'completed' },
        { dayLabel: 'ÚT', dayNumber: 2, state: 'completed' },
        { dayLabel: 'ST', dayNumber: 3, state: 'missing' },
      ],
    },
  ],
}

function renderFinalSummary(summary = TEST_SUMMARY, onExport: jest.Mock = jest.fn()) {
  render(
    <I18nProvider>
      <FinalSummaryFlow programme={PROGRAMME} summary={summary} onExport={onExport} />
    </I18nProvider>,
  )
}

describe('FinalSummaryFlow', () => {
  it('renders the final summary overview and emits export requests', () => {
    const onExport = jest.fn()
    renderFinalSummary(TEST_SUMMARY, onExport)

    expect(screen.getByRole('heading', { name: 'Přehledy' })).toBeTruthy()
    expect(screen.getByText('Měsíční souhrn · TEST DAY')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Týden 1/ })).toBeTruthy()
    expect(screen.getByText('PŘEKROČENO')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Exportovat data' }))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('opens a read-only week summary and can navigate back', () => {
    renderFinalSummary()

    fireEvent.click(screen.getByRole('button', { name: /Týden 1/ }))

    expect(screen.getByText('Týden 1 je uzavřený')).toBeTruthy()
    expect(screen.getByText('Souhrn týdne 1')).toBeTruthy()
    expect(screen.getByText('Průběh týdne')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Zpět' }))
    expect(screen.getByText('Měsíční souhrn · TEST DAY')).toBeTruthy()
  })
})
