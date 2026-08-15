import { fireEvent, render, screen, within } from '@testing-library/react'

import { DurationWheel } from '@ui/components/DurationWheel.tsx'

function renderWheel(minutes: number, maxMinutes?: number) {
  const calls: number[] = []
  render(
    <DurationWheel
      minutes={minutes}
      onChange={(next) => calls.push(next)}
      hoursLabel="Hodiny"
      minutesLabel="Minuty"
      hourUnit="h"
      minuteUnit="m"
      {...(maxMinutes === undefined ? {} : { maxMinutes })}
    />,
  )
  return calls
}

describe('DurationWheel', () => {
  it('increments the hours column by 60 minutes on ArrowDown', () => {
    const calls = renderWheel(0)
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Hodiny' }), { key: 'ArrowDown' })
    expect(calls).toEqual([60])
  })

  it('increments the minutes column by 1 minute on ArrowDown', () => {
    const calls = renderWheel(0)
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Minuty' }), { key: 'ArrowDown' })
    expect(calls).toEqual([1])
  })

  it('keeps the other unit when one column changes', () => {
    const calls = renderWheel(150) // 2 h 30 m
    fireEvent.keyDown(screen.getByRole('listbox', { name: 'Minuty' }), { key: 'ArrowUp' })
    expect(calls).toEqual([149]) // 2 h 29 m — hours preserved
  })
})

describe('DurationWheel maxMinutes cap', () => {
  function optionCount(name: string) {
    return within(screen.getByRole('listbox', { name })).getAllByRole('option').length
  }

  it('limits the minutes drum at the top hour', () => {
    renderWheel(540, 540) // 9 h 0 m, cap 9 h 0 m
    expect(optionCount('Minuty')).toBe(1) // only "0 m" is reachable
  })

  it('allows the full minutes drum below the top hour', () => {
    renderWheel(0, 540) // 0 h, cap 9 h
    expect(optionCount('Minuty')).toBe(60)
    expect(optionCount('Hodiny')).toBe(10) // 0..9
  })

  it('locks both drums to 0 when the cap is 0', () => {
    renderWheel(0, 0)
    expect(optionCount('Hodiny')).toBe(1)
    expect(optionCount('Minuty')).toBe(1)
  })

  it('exposes minutes only up to the remainder for a non-hour-aligned cap', () => {
    renderWheel(480, 525) // 8 h, cap 8 h 45 m
    expect(optionCount('Minuty')).toBe(46) // 0..45
  })
})
