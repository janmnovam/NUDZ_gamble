import { render, screen } from '@testing-library/react'

import { I18nProvider } from '@ui/i18n/I18nProvider'
import { useTranslation } from '@ui/i18n/useTranslation'

function Probe() {
  const { locale, setLocale, t } = useTranslation()
  return (
    <div>
      <span>{t('app.subtitle')}</span>
      <button
        onClick={() => {
          setLocale(locale === 'cs' ? 'en' : 'cs')
        }}
      >
        toggle
      </button>
    </div>
  )
}

describe('I18nProvider', () => {
  it('defaults to Czech', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    expect(screen.getByText(/Bootstrap běží/)).toBeDefined()
  })

  it('re-renders consumers when the locale changes', async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )

    screen.getByRole('button', { name: 'toggle' }).click()

    expect(await screen.findByText(/Bootstrap running/)).toBeDefined()
  })

  it('throws when used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow('useTranslation must be used within an I18nProvider')
  })
})
