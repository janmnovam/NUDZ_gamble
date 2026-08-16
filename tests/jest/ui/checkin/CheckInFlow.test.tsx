import { fireEvent, render, screen } from '@testing-library/react'

import { CheckInFlow, type CheckInFlowResult } from '@ui/checkin/CheckInFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

function renderFlow(onComplete: (result: CheckInFlowResult) => void) {
  render(
    <I18nProvider>
      <CheckInFlow
        userId="A001"
        behaviorDate="2026-09-05T00:00:00.000Z"
        behaviorDateLabel="sobotu 5. 9."
        weekNo={2}
        today="2026-09-06"
        time="2026-09-06T10:00:00+02:00"
        programDayLabel="Den 10 Vašeho programu"
        weekLabel="Týden 2 – Den 3"
        onComplete={onComplete}
      />
    </I18nProvider>,
  )
}

describe('CheckInFlow', () => {
  it('emits a valid zero draft when the user did not play', () => {
    const completed: CheckInFlowResult[] = []
    renderFlow((result) => completed.push(result))

    fireEvent.click(screen.getByRole('button', { name: /Ne\s+nehrál jsem/ }))

    expect(completed).toEqual([
      {
        userId: 'A001',
        weekNo: 2,
        submittedAt: '2026-09-06T10:00:00+02:00',
        previousDayState: 'missing',
        draft: {
          behaviorDate: '2026-09-05T00:00:00.000Z',
          played: false,
          timeMin: 0,
          stakesCzk: 0,
          winningsCzk: 0,
        },
      },
    ])
  })

  it('collects time and stakes before emitting a played draft', () => {
    const completed: CheckInFlowResult[] = []
    renderFlow((result) => completed.push(result))

    fireEvent.click(screen.getByRole('button', { name: /Ano\s+hrál jsem/ }))
    expect(screen.getByText('Kolik jste vsadil/a?')).toBeTruthy()

    const continueButton = screen.getByRole('button', { name: 'Pokračovat' })
    expect(continueButton.hasAttribute('disabled')).toBe(true)

    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Hodiny' }), { key: 'ArrowDown' })

    fireEvent.change(screen.getByLabelText('Sázky'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))

    expect(completed).toHaveLength(1)
    expect(completed[0]?.draft).toEqual({
      behaviorDate: '2026-09-05T00:00:00.000Z',
      played: true,
      timeMin: 60,
      stakesCzk: 2500,
      winningsCzk: 0,
    })
  })
})
