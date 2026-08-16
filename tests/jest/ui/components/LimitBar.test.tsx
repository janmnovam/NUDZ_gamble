import { render, screen } from '@testing-library/react'

import { type Status } from '@domain/config.ts'
import { LimitBar } from '@ui/components/LimitBar.tsx'

function renderBar(percent: number | null, status: Status = 'OK') {
  render(
    <LimitBar
      label="Čas za týden"
      percent={percent}
      percentLabel={`${String(percent ?? 0)} %`}
      status={status}
      thresholdPercent={80}
      note="zbývá 8 h z 8 h"
    />,
  )
  return screen.getByRole('progressbar', { name: 'Čas za týden' })
}

/** The fill is the track's only `div`; the 80 % tick is a `span`. */
function fillWidth(track: HTMLElement): string | undefined {
  return track.querySelector<HTMLElement>('div')?.style.width
}

describe('LimitBar', () => {
  it('sizes the fill to the percentage used', () => {
    expect(fillWidth(renderBar(73))).toBe('73%')
  })

  it('clamps the fill at 100% when the limit is exceeded', () => {
    expect(fillWidth(renderBar(108, 'PREKROCENO'))).toBe('100%')
  })

  it('still reports the true percentage when exceeded', () => {
    const track = renderBar(108, 'PREKROCENO')
    expect(track.getAttribute('aria-valuenow')).toBe('108')
    expect(screen.queryByText('108 %')).not.toBeNull()
  })

  it('draws no fill at 0%', () => {
    expect(fillWidth(renderBar(0))).toBeUndefined()
  })

  it('hides the percentage when the limit is 0', () => {
    renderBar(null)
    expect(screen.queryByText('0 %')).toBeNull()
  })

  it('places the threshold tick at the given percent', () => {
    const tick = renderBar(0).querySelector<HTMLElement>('span')
    expect(tick?.style.left).toBe('80%')
  })
})
