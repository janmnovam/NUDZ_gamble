import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { StrategySection } from '@ui/coping/StrategySection.tsx'
import { type CatalogStrategyDetail } from '@ui/coping/CatalogStrategyDetailScreen.tsx'

const CATALOG_DETAIL: CatalogStrategyDetail = {
  id: 'reduce-access',
  title: 'Omezím si přístup ke hraní',
  whatToDo: 'Vyberte jeden krok.',
  whyItCanHelp: 'Vzniká více času.',
  howTo: 'Odhlaste se.',
  whenUseful: 'Když odvedení pozornosti nestačí.',
  note: 'Jde o ochranný krok.',
}

describe('StrategySection', () => {
  it('switches from the library to contacts and back', () => {
    render(
      <StrategySection
        contacts={[]}
        catalogStrategyDetails={[]}
        selectedStrategies={[]}
        otherStrategies={[]}
        hiddenStrategies={[]}
        onOpenStrategy={() => undefined}
        onMoreStrategy={() => undefined}
        onDeleteStrategy={() => undefined}
        onHideStrategy={() => undefined}
        onRestoreStrategy={() => undefined}
        onToggleSelected={() => undefined}
        onUpdateCustomStrategy={() => undefined}
        onCreateCustomStrategy={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Kontakty' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Kontakty' })).not.toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Knihovna' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()
  })

  it('opens a catalog strategy detail and returns to the library', () => {
    render(
      <StrategySection
        contacts={[]}
        catalogStrategyDetails={[CATALOG_DETAIL]}
        selectedStrategies={[]}
        otherStrategies={[
          {
            id: 'reduce-access',
            kind: 'catalog',
            title: 'Omezím si přístup ke hraní',
            sub: 'Odhlásím se nebo využiju blokaci.',
          },
        ]}
        hiddenStrategies={[]}
        onOpenStrategy={() => undefined}
        onMoreStrategy={() => undefined}
        onDeleteStrategy={() => undefined}
        onHideStrategy={() => undefined}
        onRestoreStrategy={() => undefined}
        onToggleSelected={() => undefined}
        onUpdateCustomStrategy={() => undefined}
        onCreateCustomStrategy={() => undefined}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Otevřít detail strategie „Omezím si přístup ke hraní“',
      }),
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Omezím si přístup ke hraní' }),
    ).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 1, name: 'Knihovna strategií' })).toBeNull()

    const topBackButton = screen.getAllByRole('button', { name: 'Zpět do knihovny' }).at(0)
    if (topBackButton === undefined) {
      throw new Error('Horní tlačítko pro návrat musí být dostupné')
    }
    fireEvent.click(topBackButton)
    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()
  })

  it('opens a custom strategy detail and saves its changes', () => {
    const onUpdateCustomStrategy = jest.fn()

    render(
      <StrategySection
        contacts={[]}
        catalogStrategyDetails={[]}
        selectedStrategies={[
          {
            id: 'custom-1',
            kind: 'custom',
            title: 'Zavolám sestře',
            sub: 'Napíšu jí, že mám nutkání hrát.',
          },
        ]}
        otherStrategies={[]}
        hiddenStrategies={[]}
        onOpenStrategy={() => undefined}
        onMoreStrategy={() => undefined}
        onDeleteStrategy={() => undefined}
        onHideStrategy={() => undefined}
        onRestoreStrategy={() => undefined}
        onToggleSelected={() => undefined}
        onUpdateCustomStrategy={onUpdateCustomStrategy}
        onCreateCustomStrategy={() => undefined}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Otevřít detail strategie „Zavolám sestře“' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Název' }), {
      target: { value: 'Zavolám kamarádovi' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Uložit změny' }))

    expect(onUpdateCustomStrategy).toHaveBeenCalledWith('custom-1', {
      title: 'Zavolám kamarádovi',
      whenToUse: '',
      howToStart: 'Napíšu jí, že mám nutkání hrát.',
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()
  })

  it('creates a custom strategy and returns to the library', () => {
    const onCreateCustomStrategy = jest.fn()

    render(
      <StrategySection
        contacts={[]}
        catalogStrategyDetails={[]}
        selectedStrategies={[]}
        otherStrategies={[]}
        hiddenStrategies={[]}
        onOpenStrategy={() => undefined}
        onMoreStrategy={() => undefined}
        onDeleteStrategy={() => undefined}
        onHideStrategy={() => undefined}
        onRestoreStrategy={() => undefined}
        onToggleSelected={() => undefined}
        onUpdateCustomStrategy={() => undefined}
        onCreateCustomStrategy={onCreateCustomStrategy}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Přidat vlastní strategii' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Nová vlastní strategie' })).not.toBeNull()

    fireEvent.change(screen.getByRole('textbox', { name: 'Název' }), {
      target: { value: 'Projdu se kolem bloku' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Jak začnu?' }), {
      target: { value: 'Vyjdu ven na deset minut.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Přidat strategii' }))

    expect(onCreateCustomStrategy).toHaveBeenCalledWith({
      title: 'Projdu se kolem bloku',
      whenToUse: '',
      howToStart: 'Vyjdu ven na deset minut.',
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()
  })

  it('shows an information dialog at the custom strategy limit', () => {
    const customStrategies = Array.from({ length: 5 }, (_, index) => ({
      id: `custom-${String(index + 1)}`,
      kind: 'custom' as const,
      title: `Vlastní strategie ${String(index + 1)}`,
    }))

    render(
      <StrategySection
        contacts={[]}
        catalogStrategyDetails={[]}
        selectedStrategies={customStrategies.slice(0, 4)}
        otherStrategies={[]}
        hiddenStrategies={customStrategies.slice(4)}
        onOpenStrategy={() => undefined}
        onMoreStrategy={() => undefined}
        onDeleteStrategy={() => undefined}
        onHideStrategy={() => undefined}
        onRestoreStrategy={() => undefined}
        onToggleSelected={() => undefined}
        onUpdateCustomStrategy={() => undefined}
        onCreateCustomStrategy={() => undefined}
      />,
    )

    expect(screen.getByText('5 z 5 vlastních strategií')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Přidat vlastní strategii' }))

    expect(
      screen.getByRole('dialog', { name: 'Máte maximální počet vlastních strategií' }),
    ).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Zobrazit moje strategie' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Zavřít' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
