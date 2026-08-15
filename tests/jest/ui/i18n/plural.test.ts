import { pluralCategory } from '@ui/i18n/plural.ts'

describe('pluralCategory', () => {
  it('applies Czech one/few/other', () => {
    expect(pluralCategory('cs', 1)).toBe('one')
    expect(pluralCategory('cs', 2)).toBe('few')
    expect(pluralCategory('cs', 4)).toBe('few')
    expect(pluralCategory('cs', 5)).toBe('other')
    expect(pluralCategory('cs', 0)).toBe('other')
  })

  it('applies English one/other', () => {
    expect(pluralCategory('en', 1)).toBe('one')
    expect(pluralCategory('en', 2)).toBe('other')
    expect(pluralCategory('en', 0)).toBe('other')
  })
})
