import { render, screen } from '@testing-library/react'

import { StrategyContactsScreen } from '@ui/coping/StrategyContactsScreen.tsx'

describe('StrategyContactsScreen', () => {
  it('renders counselling contacts before the emergency note', () => {
    render(
      <StrategyContactsScreen
        contacts={[
          {
            id: 'mapa-pomoci',
            title: 'Mapa pomoci',
            purpose: 'Přehled odborných služeb podle místa a typu podpory.',
            meta: 'drogy-info.cz/mapa-pomoci',
            url: 'https://www.drogy-info.cz/mapa-pomoci/',
          },
        ]}
        onTabChange={() => undefined}
      />,
    )

    expect(screen.getByText('Mapa pomoci')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Bezprostřední ohrožení' })).not.toBeNull()
    expect(screen.getByText(/volejte 112 nebo 155/)).not.toBeNull()
  })
})
