import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { CopingStrategyDto } from '@/app/dto/coping.ts'
import type { ContactService } from '@/app/ports/contactService.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import { ok } from '@/app/result.ts'
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
  const toggle = jest.fn(() => Promise.resolve(ok(undefined)))
  const create = jest.fn(() =>
    Promise.resolve(
      ok({
        id: 'custom-2',
        label: 'Projdu se',
        type: 'custom' as const,
        active: true,
        priority: 3,
      }),
    ),
  )
  const service: CopingStrategyService = {
    getSuggestions: () =>
      Promise.resolve(
        ok([
          {
            id: 'change_environment',
            label: 'Na chvíli změním prostředí',
            type: 'default',
            summary: 'Vytvořím si krátký odstup.',
          },
        ]),
      ),
    list: () => Promise.resolve(ok(STRATEGIES)),
    create,
    toggle,
  }

  return { service, create, toggle }
}

function createContactService(): ContactService {
  return {
    list: () =>
      Promise.resolve([
        {
          id: 'narodni_linka',
          name: 'Národní linka pro odvykání',
          purpose: 'Telefonická podpora při omezování hazardního hraní.',
          phone: '800350000',
          url: null,
          availability: 'pondělí až pátek, 10:00–18:00',
          category: 'counselling',
          priority: 1,
        },
      ]),
  }
}

function renderFlow(
  service: CopingStrategyService,
  contacts: ContactService = createContactService(),
) {
  render(
    <I18nProvider>
      <AppProvider app={{ coping: service, contacts } as App}>
        <CopingFlow />
      </AppProvider>
    </I18nProvider>,
  )
}

describe('CopingFlow strategy-library integration', () => {
  it('maps active and inactive rows, catalogue summaries and support contacts', async () => {
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
    expect(within(selectedSection).getByText('Vytvořím si krátký odstup.')).not.toBeNull()
    expect(within(otherSection).getByText('Zavolám kamarádovi')).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Kontakty' })).not.toBeNull()
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

    fireEvent.click(screen.getByRole('tab', { name: 'Kontakty' }))
    expect(await screen.findByText('Národní linka pro odvykání')).not.toBeNull()
    expect(screen.getByText('800 350 000 · pondělí až pátek, 10:00–18:00')).not.toBeNull()
  })

  it('keeps the strategy library available when optional contact enrichment fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { service } = createService()
    renderFlow(service, { list: () => Promise.reject(new Error('contacts unavailable')) })

    expect(await screen.findByText('Na chvíli změním prostředí')).not.toBeNull()
    expect(screen.queryByRole('tab', { name: 'Kontakty' })).toBeNull()
    expect(consoleError).toHaveBeenCalledWith('[coping] contacts failed', expect.any(Error))

    consoleError.mockRestore()
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
