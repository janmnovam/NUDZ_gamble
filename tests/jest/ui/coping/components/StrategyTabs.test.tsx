import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { StrategyTabs } from '@ui/coping/components/StrategyTabs.tsx'

describe('StrategyTabs', () => {
  it('exposes which tab is selected', () => {
    render(<StrategyTabs activeTab="contacts" onChange={() => undefined} />)

    expect(screen.getByRole('tab', { name: 'Kontakty', selected: true })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Knihovna', selected: false })).not.toBeNull()
  })

  it('requests the contacts tab when the user selects it', () => {
    const onChange = jest.fn()

    render(<StrategyTabs activeTab="library" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Kontakty' }))

    expect(onChange).toHaveBeenCalledWith('contacts')
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
