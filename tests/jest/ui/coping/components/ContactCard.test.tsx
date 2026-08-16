import { render, screen } from '@testing-library/react'

import { ContactCard } from '@ui/coping/components/ContactCard.tsx'

describe('ContactCard', () => {
  it('uses a subtle red call button and an inline web action', () => {
    const { rerender } = render(
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

    const callAction = screen.getByRole('link', { name: 'Zavolat na Centrum Naberte kurz' })
    const combinedWebAction = screen.getByRole('link', {
      name: 'Otevřít web služby Centrum Naberte kurz',
    })

    expect(callAction.getAttribute('href')).toBe('tel:+420777477877')
    expect(callAction.className).toContain('bg-status-exceeded-subtle')
    expect(callAction.className).toContain('text-status-exceeded')
    expect(combinedWebAction.getAttribute('href')).toBe('https://www.nabertekurz.cz/')
    expect(combinedWebAction.className).not.toContain('bg-sunken')

    rerender(
      <ContactCard
        contact={{
          id: 'mapa-pomoci',
          title: 'Mapa pomoci',
          purpose: 'Přehled odborných služeb.',
          url: 'https://www.drogy-info.cz/mapa-pomoci/',
        }}
      />,
    )

    const standaloneWebAction = screen.getByRole('link', {
      name: 'Otevřít web služby Mapa pomoci',
    })
    expect(standaloneWebAction.className).toBe(combinedWebAction.className)
  })
})
