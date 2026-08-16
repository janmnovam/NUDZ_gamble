import { formatDurationCompact, formatHoursMinutes } from '@ui/lib/duration.ts'

describe('formatHoursMinutes', () => {
  it('splits minutes into hours and minutes', () => {
    expect(formatHoursMinutes(510, 'h', 'min')).toBe('8 h 30 min')
    expect(formatHoursMinutes(480, 'h', 'min')).toBe('8 h 0 min')
    expect(formatHoursMinutes(45, 'h', 'min')).toBe('0 h 45 min')
  })
})

describe('formatDurationCompact', () => {
  it('keeps both parts when both are non-zero', () => {
    expect(formatDurationCompact(350, 'h', 'min')).toBe('5 h 50 min')
  })

  it('drops the minutes on a whole hour', () => {
    expect(formatDurationCompact(480, 'h', 'min')).toBe('8 h')
  })

  it('drops the hours below an hour', () => {
    expect(formatDurationCompact(58, 'h', 'min')).toBe('58 min')
  })

  it('renders zero as minutes rather than an empty string', () => {
    expect(formatDurationCompact(0, 'h', 'min')).toBe('0 min')
  })
})
