import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { CopingStrategyDto } from '@/app/dto/coping.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { CopingFlow } from '@ui/coping/CopingFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const STRATEGIES: CopingStrategyDto[] = [
  {
    id: 'catalog-1',
    label: 'Na chvíli změním prostředí',
    type: 'default',
    active: true,
    priority: 1,
  },
  {
    id: 'custom-1',
    label: 'Zavolám kamarádovi',
    type: 'custom',
    active: false,
    priority: 2,
  },
]

function createService() {
  const toggle = jest.fn(() => Promise.resolve())
  const create = jest.fn(() =>
    Promise.resolve({
      id: 'custom-2',
      label: 'Projdu se',
      type: 'custom' as const,
      active: true,
      priority: 3,
    }),
  )
  const service: CopingStrategyService = {
    getSuggestions: () => Promise.resolve([]),
    list: () => Promise.resolve(STRATEGIES),
    create,
    toggle,
  }

  return { service, create, toggle }
}

function renderFlow(service: CopingStrategyService) {
  render(
    <I18nProvider>
      <AppProvider app={{ coping: service } as App}>
        <CopingFlow />
      </AppProvider>
    </I18nProvider>,
  )
}

describe('CopingFlow strategy-library integration', () => {
  it('maps active and inactive service rows without exposing unsupported actions', async () => {
    const { service } = createService()
    renderFlow(service)

    const selectedHeading = await screen.findByRole('heading', { level: 2, name: 'Vybrané' })
    const otherHeading = screen.getByRole('heading', { level: 2, name: 'Další strategie' })
    const selectedSection = selectedHeading.closest('section')
    const otherSection = otherHeading.closest('section')
    if (selectedSection === null || otherSection === null) {
      throw new Error('Obě sekce knihovny musí být vykreslené')
    }

    expect(within(selectedSection).getByText('Na chvíli změním prostředí')).not.toBeNull()
    expect(within(otherSection).getByText('Zavolám kamarádovi')).not.toBeNull()
    expect(screen.queryByRole('tab', { name: 'Kontakty' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Otevřít detail strategie/ })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Hlavní navigace' })).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Zavolám kamarádovi“',
      }),
    )

    expect(screen.getByRole('button', { name: 'Přidat do Vybraných' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Skrýt' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Smazat' })).toBeNull()
  })

  it('persists a selected-state change through the existing toggle operation', async () => {
    const { service, toggle } = createService()
    renderFlow(service)

    await screen.findByRole('heading', { level: 1, name: 'Knihovna strategií' })
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Na chvíli změním prostředí“',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Odebrat z Vybraných' }))

    await waitFor(() => {
      expect(toggle).toHaveBeenCalledWith('catalog-1', false, 'demo-user', expect.any(String))
    })
  })

  it('creates only the title supported by the existing service', async () => {
    const { service, create } = createService()
    renderFlow(service)

    await screen.findByRole('heading', { level: 1, name: 'Knihovna strategií' })
    fireEvent.click(screen.getByRole('button', { name: 'Přidat vlastní strategii' }))

    expect(screen.queryByRole('textbox', { name: 'Kdy ji chci použít?' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Jak začnu?' })).toBeNull()
    fireEvent.change(screen.getByRole('textbox', { name: 'Název' }), {
      target: { value: 'Projdu se' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Přidat strategii' }))

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({ label: 'Projdu se' }, 'demo-user', expect.any(String))
    })
  })
})
