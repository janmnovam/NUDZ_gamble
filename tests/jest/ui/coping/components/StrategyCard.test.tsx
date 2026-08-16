import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import { StrategyCard } from '@ui/coping/components/StrategyCard.tsx'

describe('StrategyCard', () => {
  it('shows a custom first step only when it is provided', () => {
    const onOpen = jest.fn()
    const onMore = jest.fn()
    const firstStep = 'Napíšu jí, že mám nutkání hrát.'
    const { rerender } = render(
      <StrategyCard
        kind="custom"
        title="Zavolám sestře"
        sub={firstStep}
        onOpen={onOpen}
        onMore={onMore}
      />,
    )

    expect(screen.getByText(firstStep)).not.toBeNull()

    rerender(<StrategyCard kind="custom" title="Zavolám sestře" onOpen={onOpen} onMore={onMore} />)

    expect(screen.queryByText(firstStep)).toBeNull()
  })

  it('shows the custom badge only for a custom strategy', () => {
    const onOpen = jest.fn()
    const onMore = jest.fn()
    const { rerender } = render(
      <StrategyCard kind="custom" title="Zavolám sestře" onOpen={onOpen} onMore={onMore} />,
    )

    expect(screen.getByText('Vlastní')).not.toBeNull()

    rerender(
      <StrategyCard
        kind="catalog"
        title="Na chvíli odejdu od hraní"
        sub="Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam."
        onOpen={onOpen}
        onMore={onMore}
      />,
    )

    expect(screen.queryByText('Vlastní')).toBeNull()
  })

  it('opens the strategy detail without opening its actions', () => {
    const onOpen = jest.fn()
    const onMore = jest.fn()

    render(
      <StrategyCard
        kind="custom"
        title="Zavolám sestře"
        sub="Napíšu jí, že mám nutkání hrát."
        onOpen={onOpen}
        onMore={onMore}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Otevřít detail strategie „Zavolám sestře“',
      }),
    )

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onMore).not.toHaveBeenCalled()
  })

  it('opens the strategy actions without opening its detail', () => {
    const onOpen = jest.fn()
    const onMore = jest.fn()

    render(
      <StrategyCard
        kind="custom"
        title="Zavolám sestře"
        sub="Napíšu jí, že mám nutkání hrát."
        onOpen={onOpen}
        onMore={onMore}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Další možnosti pro strategii „Zavolám sestře“',
      }),
    )

    expect(onMore).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('renders non-clickable content when no detail is available', () => {
    render(
      <StrategyCard kind="catalog" title="Na chvíli změním prostředí" sub="" onMore={jest.fn()} />,
    )

    expect(screen.getByText('Na chvíli změním prostředí')).not.toBeNull()
    expect(
      screen.queryByRole('button', {
        name: 'Otevřít detail strategie „Na chvíli změním prostředí“',
      }),
    ).toBeNull()
  })
})
