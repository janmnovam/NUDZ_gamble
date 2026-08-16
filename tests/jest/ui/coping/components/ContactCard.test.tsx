import { render, screen } from '@testing-library/react'

import { ContactCard } from '@ui/coping/components/ContactCard.tsx'

describe('ContactCard', () => {
  it('uses native phone and external web links', () => {
    render(
      <ContactCard
        contact={{
          id: 'naberte-kurz',
          title: 'Centrum Naberte kurz',
          purpose: 'Poradenství pro lidi, kteří chtějí své hraní omezit.',
          meta: '+420 777 477 877 · nabertekurz.cz',
          phone: '+420777477877',
          url: 'https://www.nabertekurz.cz/',
        }}
      />,
    )

    expect(
      screen.getByRole('link', { name: 'Zavolat na Centrum Naberte kurz' }).getAttribute('href'),
    ).toBe('tel:+420777477877')
    expect(
      screen
        .getByRole('link', { name: 'Otevřít web služby Centrum Naberte kurz' })
        .getAttribute('href'),
    ).toBe('https://www.nabertekurz.cz/')
  })
})
