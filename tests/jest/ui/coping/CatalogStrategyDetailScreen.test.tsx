import { fireEvent, render, screen } from '@testing-library/react'
import { jest } from '@jest/globals'

import {
  CatalogStrategyDetailScreen,
  type CatalogStrategyDetail,
} from '@ui/coping/CatalogStrategyDetailScreen.tsx'

const DETAIL: CatalogStrategyDetail = {
  id: 'reduce-access',
  title: 'Omezím si přístup ke hraní',
  whatToDo: 'Vyberte jeden krok, který vám přístup ke hraní ztíží.',
  whyItCanHelp: 'Když hraní není okamžitě dostupné, vzniká více času.',
  howTo: 'Můžete se odhlásit nebo zapnout blokaci hazardních stránek.',
  whenUseful: 'Když samotné odvedení pozornosti nestačí.',
  note: 'Jde o ochranný krok, ne o test vůle.',
  restrictionOptions: {
    intro: 'Existují také oficiální možnosti sebevyloučení.',
    items: [
      {
        id: 'pause-48-hours',
        title: 'Přestávka na 48 hodin',
        description: 'Krátkodobé vyloučení z hraní.',
        linkLabel: 'Jak funguje přestávka na 48 hodin',
        href: 'https://www.mfcr.cz/',
      },
    ],
  },
}

describe('CatalogStrategyDetailScreen', () => {
  it('renders catalog guidance and returns to the library', () => {
    const onBack = jest.fn()

    render(<CatalogStrategyDetailScreen detail={DETAIL} onBack={onBack} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Omezím si přístup ke hraní' }),
    ).not.toBeNull()
    expect(screen.getByText('CO UDĚLAT')).not.toBeNull()
    expect(screen.getByText('PROČ TO MŮŽE POMOCI')).not.toBeNull()
    expect(screen.getByText('JAK NA TO')).not.toBeNull()
    expect(screen.getByText('KDY SE MŮŽE HODIT')).not.toBeNull()
    expect(screen.getByText('POZNÁMKA')).not.toBeNull()

    const officialLink = screen.getByRole('link', {
      name: 'Jak funguje přestávka na 48 hodin',
    })
    expect(officialLink.getAttribute('href')).toBe('https://www.mfcr.cz/')
    expect(officialLink.getAttribute('target')).toBe('_blank')

    const backButtons = screen.getAllByRole('button', { name: 'Zpět do knihovny' })
    expect(backButtons).toHaveLength(2)
    const topBackButton = backButtons.at(0)
    const bottomBackButton = backButtons.at(1)
    if (topBackButton === undefined || bottomBackButton === undefined) {
      throw new Error('Obě tlačítka pro návrat musí být dostupná')
    }
    fireEvent.click(topBackButton)
    fireEvent.click(bottomBackButton)
    expect(onBack).toHaveBeenCalledTimes(2)
  })
})
