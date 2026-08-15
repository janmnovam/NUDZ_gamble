import { formatHoursMinutes } from '@ui/lib/duration.ts'

describe('formatHoursMinutes', () => {
  it('splits minutes into hours and minutes', () => {
    expect(formatHoursMinutes(510, 'h', 'min')).toBe('8 h 30 min')
    expect(formatHoursMinutes(480, 'h', 'min')).toBe('8 h 0 min')
    expect(formatHoursMinutes(45, 'h', 'min')).toBe('0 h 45 min')
  })
})
