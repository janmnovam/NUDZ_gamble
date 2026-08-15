import { interpolate } from '@ui/i18n/interpolate.ts'

describe('interpolate', () => {
  it('returns the template unchanged when there are no vars', () => {
    expect(interpolate('= {count} minut za týden')).toBe('= {count} minut za týden')
  })

  it('substitutes named placeholders', () => {
    expect(interpolate('= {count} minut za týden', { count: 600 })).toBe('= 600 minut za týden')
  })

  it('leaves unknown placeholders intact', () => {
    expect(interpolate('{a} {b}', { a: 'x' })).toBe('x {b}')
  })
})
