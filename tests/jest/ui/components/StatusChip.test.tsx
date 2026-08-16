import { render, screen } from '@testing-library/react'

import { StatusChip, type ChipStatus } from '@ui/components/StatusChip.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

function renderChip(status: ChipStatus) {
  const { container } = render(
    <I18nProvider>
      <StatusChip status={status} />
    </I18nProvider>,
  )
  return container.firstElementChild as HTMLElement
}

describe('StatusChip', () => {
  it.each([
    ['OK', 'OK'],
    ['POZOR', 'POZOR'],
    ['PREKROCENO', 'PŘEKROČENO'],
    ['NEUPLNE', 'NEÚPLNÉ'],
  ] as const)('names %s in words, not colour alone', (status, label) => {
    renderChip(status)
    expect(screen.getByText(label)).not.toBeNull()
  })

  it('pairs every state with an icon, per the Figma rule', () => {
    // "Barva nikdy nenese význam sama — vždy s ikonou a slovem."
    for (const status of ['OK', 'POZOR', 'PREKROCENO', 'NEUPLNE'] as const) {
      const chip = renderChip(status)
      expect(chip.querySelector('svg')).not.toBeNull()
    }
  })

  it('gives each limit state its own colour', () => {
    const classes = (['OK', 'POZOR', 'PREKROCENO'] as const).map((s) => renderChip(s).className)
    expect(new Set(classes).size).toBe(3)
  })

  it('appends a caller-supplied className', () => {
    const { container } = render(
      <I18nProvider>
        <StatusChip status="OK" className="self-start" />
      </I18nProvider>,
    )
    expect(container.firstElementChild?.className).toContain('self-start')
  })
})
