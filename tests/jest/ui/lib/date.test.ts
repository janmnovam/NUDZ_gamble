import { dayOfMonth, weekdayAbbrev } from '@ui/lib/date.ts'

/** The shape the DTO actually carries: an ISO timestamp pinned to UTC midnight. */
const TUESDAY = '2026-09-01T00:00:00.000Z'

describe('dayOfMonth', () => {
  it('reads the day from a calendar timestamp', () => {
    expect(dayOfMonth(TUESDAY)).toBe(1)
    expect(dayOfMonth('2026-09-07T00:00:00.000Z')).toBe(7)
  })

  it('also accepts a bare ISO date', () => {
    expect(dayOfMonth('2026-09-07')).toBe(7)
  })

  it('rejects a value that is not a timestamp, rather than rendering NaN', () => {
    expect(() => dayOfMonth('not-a-date')).toThrow(RangeError)
  })
})

describe('weekdayAbbrev', () => {
  it('localises the weekday', () => {
    expect(weekdayAbbrev(TUESDAY, 'cs')).toBe('út')
    expect(weekdayAbbrev(TUESDAY, 'en')).toBe('Tue')
  })

  it('reports the UTC calendar day, not the local one', () => {
    // Midnight UTC is still the previous evening in the Americas; the strip must
    // show the calendar day the record is for, not the viewer's local date.
    const last = '2026-08-31T00:00:00.000Z'
    expect(dayOfMonth(last)).toBe(31)
    expect(weekdayAbbrev(last, 'en')).toBe('Mon')
  })
})
