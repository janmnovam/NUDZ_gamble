import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'
import { FinalSummaryFlow } from '@ui/review/FinalSummaryFlow.tsx'
import { MOCK_FINAL_SUMMARY } from '@ui/review/mockFinalSummary.ts'

function renderFinalSummary(onExport = jest.fn()) {
  render(
    <I18nProvider>
      <FinalSummaryFlow summary={MOCK_FINAL_SUMMARY} onExport={onExport} />
    </I18nProvider>,
  )
}

describe('FinalSummaryFlow', () => {
  it('renders the final summary overview and emits export requests', () => {
    const onExport = jest.fn()
    renderFinalSummary(onExport)

    expect(screen.getByRole('heading', { name: 'Přehledy' })).toBeTruthy()
    expect(screen.getByText('Měsíční souhrn · DEN 29')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Týden 1/ })).toBeTruthy()
    expect(screen.getByText('PŘEKROČENO')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Exportovat data' }))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('opens a read-only week summary and can navigate back', () => {
    renderFinalSummary()

    fireEvent.click(screen.getByRole('button', { name: /Týden 1/ }))

    expect(screen.getByText('Týden 1 je uzavřený')).toBeTruthy()
    expect(screen.getByText('9h 30 min z 10h 0 min')).toBeTruthy()
    expect(screen.getByText('6 ze 7 dnů')).toBeTruthy()
    expect(screen.getByText('Průběh týdne')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Zpět' }))
    expect(screen.getByText('Měsíční souhrn · DEN 29')).toBeTruthy()
  })
})
