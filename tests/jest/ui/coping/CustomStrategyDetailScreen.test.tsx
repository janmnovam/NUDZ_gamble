import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { CustomStrategyDetailScreen } from '@ui/coping/CustomStrategyDetailScreen.tsx'

describe('CustomStrategyDetailScreen', () => {
  it('validates duplicate names and saves trimmed changes', () => {
    const onSave = jest.fn()

    render(
      <CustomStrategyDetailScreen
        mode="edit"
        strategy={{
          id: 'custom-1',
          kind: 'custom',
          title: 'Zavolám sestře',
          whenToUse: 'Když jsem večer sám a nudím se.',
          sub: 'Napíšu jí, že mám nutkání hrát.',
        }}
        existingStrategyTitles={['Omezím si přístup ke hraní']}
        onBack={jest.fn()}
        onSave={onSave}
      />,
    )

    const titleInput = screen.getByRole('textbox', { name: 'Název' })
    const whenInput = screen.getByRole('textbox', { name: 'Kdy ji chci použít?' })
    const startInput = screen.getByRole('textbox', { name: 'Jak začnu?' })
    const saveButton = screen.getByRole('button', { name: 'Uložit změny' })

    expect(titleInput.getAttribute('maxlength')).toBe('80')
    expect(whenInput.getAttribute('maxlength')).toBe('240')
    expect(startInput.getAttribute('maxlength')).toBe('240')

    fireEvent.change(titleInput, { target: { value: '  OMEZÍM SI PŘÍSTUP KE HRANÍ  ' } })
    expect(
      screen.getByText('Strategie s tímto názvem už existuje. Zvolte prosím jiný název.'),
    ).not.toBeNull()
    expect(saveButton.hasAttribute('disabled')).toBe(true)
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.change(titleInput, { target: { value: '  Zavolám kamarádovi  ' } })
    fireEvent.change(whenInput, { target: { value: '  Když přijde nutkání.  ' } })
    fireEvent.change(startInput, { target: { value: '  Napíšu krátkou zprávu.  ' } })
    fireEvent.click(saveButton)

    expect(onSave).toHaveBeenCalledWith({
      title: 'Zavolám kamarádovi',
      whenToUse: 'Když přijde nutkání.',
      howToStart: 'Napíšu krátkou zprávu.',
    })
  })

  it('returns without saving changes', () => {
    const onBack = jest.fn()
    const onSave = jest.fn()

    render(
      <CustomStrategyDetailScreen
        mode="edit"
        strategy={{ id: 'custom-1', kind: 'custom', title: 'Zavolám sestře' }}
        existingStrategyTitles={[]}
        onBack={onBack}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Název' }), {
      target: { value: 'Rozepsaná změna' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Zpět do knihovny' }))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})
