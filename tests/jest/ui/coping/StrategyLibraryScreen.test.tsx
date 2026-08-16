import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { StrategyLibraryScreen } from '@ui/coping/StrategyLibraryScreen.tsx'

describe('StrategyLibraryScreen', () => {
  it('opens contextual actions for custom and catalog strategies', () => {
    const onToggleSelected = jest.fn()
    const onHideStrategy = jest.fn()

    render(
      <StrategyLibraryScreen
        selectedStrategies={[
          {
            id: 'custom-1',
            kind: 'custom',
            title: 'Zavolám sestře',
          },
        ]}
        otherStrategies={[
          {
            id: 'change-environment',
            kind: 'catalog',
            title: 'Na chvíli odejdu od hraní',
            sub: 'Zavřu stránku nebo aplikaci.',
          },
        ]}
        hiddenStrategies={[]}
        customStrategyCount={1}
        onOpenStrategy={jest.fn()}
        onMoreStrategy={jest.fn()}
        onDeleteStrategy={jest.fn()}
        onHideStrategy={onHideStrategy}
        onRestoreStrategy={jest.fn()}
        onToggleSelected={onToggleSelected}
        onTabChange={jest.fn()}
        onAddCustomStrategy={jest.fn()}
      />,
    )

    const customActionsTrigger = screen.getByRole('button', {
      name: 'Další možnosti pro strategii „Zavolám sestře“',
    })
    fireEvent.click(customActionsTrigger)

    const customDialog = screen.getByRole('dialog', { name: 'Možnosti strategie „Zavolám sestře“' })
    const selectedAction = screen.getByRole('button', { name: 'Odebrat z Vybraných' })
    expect(customDialog.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(selectedAction)
    expect(screen.getByRole('button', { name: 'Skrýt' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Smazat' })).not.toBeNull()

    fireEvent.click(selectedAction)
    expect(onToggleSelected).toHaveBeenCalledWith('custom-1')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(customActionsTrigger)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Na chvíli odejdu od hraní“',
      }),
    )

    expect(screen.getByRole('button', { name: 'Přidat do Vybraných' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Smazat' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Skrýt' }))
    expect(onHideStrategy).toHaveBeenCalledWith('change-environment')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders selected and other strategies in separate sections', () => {
    render(
      <StrategyLibraryScreen
        selectedStrategies={[
          {
            id: 'custom-1',
            kind: 'custom',
            title: 'Zavolám sestře',
            sub: 'Napíšu jí, že mám nutkání hrát.',
          },
        ]}
        otherStrategies={[
          {
            id: 'change-environment',
            kind: 'catalog',
            title: 'Na chvíli odejdu od hraní',
            sub: 'Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.',
          },
        ]}
        hiddenStrategies={[]}
        customStrategyCount={1}
        onOpenStrategy={jest.fn()}
        onMoreStrategy={jest.fn()}
        onDeleteStrategy={jest.fn()}
        onHideStrategy={jest.fn()}
        onRestoreStrategy={jest.fn()}
        onToggleSelected={jest.fn()}
        onTabChange={jest.fn()}
        onAddCustomStrategy={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Knihovna strategií' })).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Vybrané' })).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Další strategie' })).not.toBeNull()
    expect(screen.getByText('Zavolám sestře')).not.toBeNull()
    expect(screen.getByText('Na chvíli odejdu od hraní')).not.toBeNull()
    expect(screen.queryByRole('button', { name: '↓ Skryté strategie' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Přidat vlastní strategii' })).not.toBeNull()
    expect(screen.getByText('1 z 5 vlastních strategií')).not.toBeNull()
  })

  it('hides headings for empty strategy sections', () => {
    const sharedProps = {
      hiddenStrategies: [],
      customStrategyCount: 0,
      onOpenStrategy: jest.fn(),
      onMoreStrategy: jest.fn(),
      onDeleteStrategy: jest.fn(),
      onHideStrategy: jest.fn(),
      onRestoreStrategy: jest.fn(),
      onToggleSelected: jest.fn(),
      onTabChange: jest.fn(),
      onAddCustomStrategy: jest.fn(),
    }
    const { rerender } = render(
      <StrategyLibraryScreen
        {...sharedProps}
        selectedStrategies={[]}
        otherStrategies={[
          { id: 'catalog-1', kind: 'catalog', title: 'Další strategie', sub: 'Krátký popis.' },
        ]}
      />,
    )

    expect(screen.queryByRole('heading', { level: 2, name: 'Vybrané' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Další strategie' })).not.toBeNull()

    rerender(
      <StrategyLibraryScreen
        {...sharedProps}
        selectedStrategies={[
          { id: 'catalog-1', kind: 'catalog', title: 'Vybraná strategie', sub: 'Krátký popis.' },
        ]}
        otherStrategies={[]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Vybrané' })).not.toBeNull()
    expect(screen.queryByRole('heading', { level: 2, name: 'Další strategie' })).toBeNull()
  })

  it('reveals hidden strategies and restores one from its actions', () => {
    const onRestoreStrategy = jest.fn()

    render(
      <StrategyLibraryScreen
        selectedStrategies={[]}
        otherStrategies={[]}
        hiddenStrategies={[
          {
            id: 'hidden-walk',
            kind: 'custom',
            title: 'Projdu se kolem bloku',
            sub: 'Vyjdu ven a dám si deset minut.',
          },
        ]}
        customStrategyCount={1}
        onOpenStrategy={jest.fn()}
        onMoreStrategy={jest.fn()}
        onDeleteStrategy={jest.fn()}
        onHideStrategy={jest.fn()}
        onRestoreStrategy={onRestoreStrategy}
        onToggleSelected={jest.fn()}
        onTabChange={jest.fn()}
        onAddCustomStrategy={jest.fn()}
      />,
    )

    const hiddenToggle = screen.getByRole('button', { name: '↓ Skryté strategie' })
    expect(hiddenToggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('heading', { level: 2, name: 'Skryté strategie' })).toBeNull()

    fireEvent.click(hiddenToggle)

    expect(
      screen.getByRole('button', { name: '↑ Skryté strategie' }).getAttribute('aria-expanded'),
    ).toBe('true')
    expect(screen.getByRole('heading', { level: 2, name: 'Skryté strategie' })).not.toBeNull()
    expect(screen.getByText('Projdu se kolem bloku')).not.toBeNull()

    const hiddenActionsTrigger = screen.getByRole('button', {
      name: 'Další možnosti pro strategii „Projdu se kolem bloku“',
    })
    fireEvent.click(hiddenActionsTrigger)

    const restoreAction = screen.getByRole('button', { name: 'Obnovit' })
    expect(document.activeElement).toBe(restoreAction)
    fireEvent.click(restoreAction)

    expect(onRestoreStrategy).toHaveBeenCalledWith('hidden-walk')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('heading', { level: 2, name: 'Skryté strategie' })).toBeNull()
    expect(
      screen.getByRole('button', { name: '↓ Skryté strategie' }).getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('requires confirmation before deleting a custom strategy', () => {
    const onDeleteStrategy = jest.fn()

    render(
      <StrategyLibraryScreen
        selectedStrategies={[
          {
            id: 'custom-1',
            kind: 'custom',
            title: 'Zavolám sestře',
          },
        ]}
        otherStrategies={[]}
        hiddenStrategies={[]}
        customStrategyCount={1}
        onOpenStrategy={jest.fn()}
        onMoreStrategy={jest.fn()}
        onDeleteStrategy={onDeleteStrategy}
        onHideStrategy={jest.fn()}
        onRestoreStrategy={jest.fn()}
        onToggleSelected={jest.fn()}
        onTabChange={jest.fn()}
        onAddCustomStrategy={jest.fn()}
      />,
    )

    const actionsTrigger = screen.getByRole('button', {
      name: 'Další možnosti pro strategii „Zavolám sestře“',
    })
    fireEvent.click(actionsTrigger)
    fireEvent.click(screen.getByRole('button', { name: 'Smazat' }))

    expect(onDeleteStrategy).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Smazat vlastní strategii?' })).not.toBeNull()
    expect(
      screen.getByText('Strategie „Zavolám sestře“ bude trvale smazána. Tuto akci nelze vrátit.'),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Zrušit' }))
    expect(onDeleteStrategy).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(actionsTrigger)

    fireEvent.click(actionsTrigger)
    fireEvent.click(screen.getByRole('button', { name: 'Smazat' }))
    fireEvent.click(screen.getByRole('button', { name: 'Smazat strategii' }))

    expect(onDeleteStrategy).toHaveBeenCalledWith('custom-1')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
