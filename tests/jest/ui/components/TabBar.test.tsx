import { render, screen, within } from '@testing-library/react'

import { TabBar } from '@ui/components/TabBar.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

function renderTabBar(props: Parameters<typeof TabBar>[0] = {}) {
  render(
    <I18nProvider>
      <TabBar {...props} />
    </I18nProvider>,
  )
  return screen.getByRole('navigation')
}

describe('TabBar', () => {
  it('renders the three destinations as a navigation landmark', () => {
    const nav = renderTabBar()

    expect(nav.getAttribute('aria-label')).toBe('Hlavní navigace')
    for (const label of ['Domů', 'Váš Coping', 'Přehledy']) {
      expect(within(nav).getByText(label)).not.toBeNull()
    }
  })

  it('defaults to the reports tab, so the review screens are unaffected', () => {
    const nav = renderTabBar()
    // The active tab is the only one carrying the brand indicator bar.
    expect(nav.querySelectorAll('.bg-brand')).toHaveLength(1)
    expect(within(nav).getByText('Přehledy').className).toContain('text-brand')
  })

  it('marks the requested tab as active instead', () => {
    const nav = renderTabBar({ active: 'home' })

    expect(within(nav).getByText('Domů').className).toContain('text-brand')
    expect(within(nav).getByText('Přehledy').className).toContain('text-muted')
  })

  it('highlights exactly one tab', () => {
    const nav = renderTabBar({ active: 'coping' })
    const highlighted = ['Domů', 'Váš Coping', 'Přehledy'].filter((label) =>
      within(nav).getByText(label).className.includes('text-brand'),
    )
    expect(highlighted).toEqual(['Váš Coping'])
  })
})
