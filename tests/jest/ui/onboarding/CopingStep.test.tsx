import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { CopingSuggestionDto } from '@/app/dto/coping.ts'
import { CopingStep } from '@ui/onboarding/steps/CopingStep.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const STRATEGIES: CopingSuggestionDto[] = [
  {
    id: 'change_environment',
    label: 'Na chvíli změním prostředí',
    type: 'default',
    summary: 'Katalogový souhrn.',
  },
  {
    id: 'reduce_access',
    label: 'Znesnadním si přístup ke hraní',
    type: 'default',
    summary: 'Jiný katalogový souhrn.',
  },
]

describe('CopingStep', () => {
  it('renders the current Figma copy while preserving the selected catalogue row', () => {
    const onSelectedChange = jest.fn()

    render(
      <I18nProvider>
        <CopingStep
          strategies={STRATEGIES}
          selected={[]}
          onSelectedChange={onSelectedChange}
          customCoping={null}
          onCustomCopingChange={() => undefined}
          onFinish={() => undefined}
          onBack={() => undefined}
        />
      </I18nProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Co uděláte, když budete chtít hrát?' }),
    ).not.toBeNull()
    expect(screen.getByText('Na chvíli odejdu od hraní')).not.toBeNull()
    expect(
      screen.getByText('Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.'),
    ).not.toBeNull()
    expect(screen.getByText('Omezím si přístup ke hraní')).not.toBeNull()
    expect(screen.queryByText('Katalogový souhrn.')).toBeNull()
    expect(screen.queryByText(/Vyberte aspoň jednu strategii/)).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: /Na chvíli odejdu od hraní/ }))

    expect(onSelectedChange).toHaveBeenCalledWith([STRATEGIES[0]])
  })

  it('does not treat whitespace as a custom coping strategy', () => {
    render(
      <I18nProvider>
        <CopingStep
          strategies={[]}
          selected={[]}
          onSelectedChange={() => undefined}
          customCoping={{ label: '   ', type: 'custom' }}
          onCustomCopingChange={() => undefined}
          onFinish={() => undefined}
          onBack={() => undefined}
        />
      </I18nProvider>,
    )

    expect(
      screen.getByRole('button', { name: 'Dokončit nastavení' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
