import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { CopingStrategyDto } from '@/app/dto/coping.ts'
import type { ContactService } from '@/app/ports/contactService.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import { ok } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { CopingFlow } from '@ui/coping/CopingFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

const STRATEGIES: CopingStrategyDto[] = [
  {
    id: 'catalog-1',
    label: 'Na chvíli změním prostředí',
    type: 'default',
    active: true,
    priority: 1,
    whenToUse: null,
    howToStart: null,
  },
  {
    id: 'custom-1',
    label: 'Zavolám kamarádovi',
    type: 'custom',
    active: false,
    priority: 2,
    whenToUse: null,
    howToStart: null,
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
        whenToUse: null,
        howToStart: null,
      }),
    ),
  )
  const update = jest.fn(() =>
    Promise.resolve(
      ok({
        id: 'custom-1',
        label: 'Zavolám kamarádovi',
        type: 'custom' as const,
        active: false,
        priority: 2,
        whenToUse: null,
        howToStart: null,
      }),
    ),
  )
  const remove = jest.fn(() => Promise.resolve(ok(undefined)))
  const select = jest.fn(() =>
    Promise.resolve(
      ok({
        id: 'catalog-2',
        label: 'Ozvu se někomu, komu důvěřuji',
        type: 'default' as const,
        active: true,
        priority: 3,
        whenToUse: null,
        howToStart: null,
      }),
    ),
  )
  const service: CopingStrategyService = {
    getSuggestions: () =>
      Promise.resolve(
        ok([
          {
            id: 'change_environment',
            label: 'Na chvíli odejdu od hraní',
            type: 'default',
            summary: 'Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.',
            title: 'Na chvíli odejdu od hraní',
            whatToDo: 'Vytvořte si krátký odstup od místa nebo zařízení, kde můžete hrát.',
            whyItCanHelp:
              'Změna prostředí může přerušit automatické pokračování a vytvořit čas před dalším rozhodnutím.',
            howTo:
              'Zavřete hru nebo sázkovou aplikaci. Odložte zařízení mimo dosah nebo se přesuňte jinam.',
            whenUseful: 'Když vás ke hraní přitahuje konkrétní místo, obrazovka nebo situace.',
            noteLabel: 'DOSTUPNÁ ALTERNATIVA',
            note: 'Pokud se nemůžete přesunout, změňte alespoň to, co máte před sebou.',
          },
          {
            // Not adopted by any row in STRATEGIES — must still surface in the library.
            id: 'reach_out',
            label: 'Ozvu se někomu, komu důvěřuji',
            type: 'default',
            summary: 'Ozvu se člověku, se kterým se cítím bezpečně.',
            title: 'Ozvu se někomu, komu důvěřuji',
            whatToDo: 'Ozvěte se člověku, se kterým se cítíte bezpečně.',
            whyItCanHelp: 'Krátký kontakt může snížit pocit, že na situaci musíte být bez podpory.',
            howTo: 'Napište, že máte teď nutkání hrát.',
            whenUseful: 'Když je těžké přerušit hraní bez podpory.',
            noteLabel: 'DOSTUPNÁ ALTERNATIVA',
            note: 'Pokud teď nemáte komu napsat, využijte kontakty na odbornou pomoc.',
          },
        ]),
      ),
    list: () => Promise.resolve(ok(STRATEGIES)),
    create,
    toggle,
    update,
    remove,
    select,
  }

  return { service, create, toggle, update, remove, select }
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
  useCurrentUser.setState({ userId: 'demo-user' })
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

    expect(within(selectedSection).getByText('Na chvíli odejdu od hraní')).not.toBeNull()
    expect(
      within(selectedSection).getByText(
        'Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.',
      ),
    ).not.toBeNull()
    expect(within(otherSection).getByText('Zavolám kamarádovi')).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Kontakty' })).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Otevřít detail strategie „Na chvíli odejdu od hraní“',
      }),
    ).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'Otevřít detail strategie „Zavolám kamarádovi“' }),
    ).not.toBeNull()
    expect(screen.getByRole('navigation', { name: 'Hlavní navigace' })).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Zavolám kamarádovi“',
      }),
    )

    expect(screen.getByRole('button', { name: 'Přidat do Vybraných' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Skrýt' })).toBeNull()
    // Custom strategies can be deleted now that `onDeleteStrategy` is wired.
    expect(screen.getByRole('button', { name: 'Smazat' })).not.toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Kontakty' }))
    expect(await screen.findByText('Národní linka pro odvykání')).not.toBeNull()
    expect(screen.getByText('800 350 000 · pondělí až pátek, 10:00–18:00')).not.toBeNull()
  })

  it('opens a catalogue strategy detail assembled from its stable suggestion code', async () => {
    const { service } = createService()
    renderFlow(service)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Otevřít detail strategie „Na chvíli odejdu od hraní“',
      }),
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Na chvíli odejdu od hraní' }),
    ).not.toBeNull()
    expect(screen.getByText('DOSTUPNÁ ALTERNATIVA')).not.toBeNull()
    expect(screen.getAllByRole('button', { name: 'Zpět do knihovny' })).toHaveLength(2)
  })

  it('keeps the strategy library available when optional contact enrichment fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { service } = createService()
    renderFlow(service, { list: () => Promise.reject(new Error('contacts unavailable')) })

    expect(await screen.findByText('Na chvíli odejdu od hraní')).not.toBeNull()
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
        name: 'Další možnosti pro strategii „Na chvíli odejdu od hraní“',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Odebrat z Vybraných' }))

    await waitFor(() => {
      expect(toggle).toHaveBeenCalledWith('catalog-1', false, 'demo-user', expect.any(String))
    })
  })

  it('creates a custom strategy with the optional detail fields', async () => {
    const { service, create } = createService()
    renderFlow(service)

    await screen.findByRole('heading', { level: 1, name: 'Knihovna strategií' })
    fireEvent.click(screen.getByRole('button', { name: 'Přidat vlastní strategii' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Název' }), {
      target: { value: 'Projdu se' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Kdy ji chci použít?' }), {
      target: { value: 'Když mám nutkání' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Jak začnu?' }), {
      target: { value: 'Obuju si boty' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Přidat strategii' }))

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        { label: 'Projdu se', whenToUse: 'Když mám nutkání', howToStart: 'Obuju si boty' },
        'demo-user',
        expect.any(String),
      )
    })
  })

  it('opens a custom strategy and saves an edit through the update service', async () => {
    const { service, update } = createService()
    renderFlow(service)

    await screen.findByRole('heading', { level: 1, name: 'Knihovna strategií' })
    fireEvent.click(
      screen.getByRole('button', { name: 'Otevřít detail strategie „Zavolám kamarádovi“' }),
    )

    const titleField = await screen.findByRole('textbox', { name: 'Název' })
    fireEvent.change(titleField, { target: { value: 'Zavolám sestře' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Kdy ji chci použít?' }), {
      target: { value: 'Když mám nutkání' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Uložit změny' }))

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        'custom-1',
        { label: 'Zavolám sestře', whenToUse: 'Když mám nutkání', howToStart: '' },
        'demo-user',
        expect.any(String),
      )
    })
  })

  it('lists a catalog suggestion skipped at onboarding and adopts it through select', async () => {
    const { service, select } = createService()
    renderFlow(service)

    const otherHeading = await screen.findByRole('heading', { level: 2, name: 'Další strategie' })
    const otherSection = otherHeading.closest('section')
    if (otherSection === null) throw new Error('Sekce Další strategie musí být vykreslená')

    expect(within(otherSection).getByText('Ozvu se někomu, komu důvěřuji')).not.toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Ozvu se někomu, komu důvěřuji“',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Přidat do Vybraných' }))

    await waitFor(() => {
      expect(select).toHaveBeenCalledWith('reach_out', 'demo-user', expect.any(String))
    })
  })

  it('deletes a custom strategy after confirming the dialog', async () => {
    const { service, remove } = createService()
    renderFlow(service)

    await screen.findByRole('heading', { level: 1, name: 'Knihovna strategií' })
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Zavolám kamarádovi“',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Smazat' }))
    expect(screen.getByRole('dialog', { name: /Smazat vlastní strategii/ })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Smazat strategii' }))

    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith('custom-1', 'demo-user')
    })
  })
})
