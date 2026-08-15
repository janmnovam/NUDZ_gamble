import { digitsToNumber, groupThousands } from '@ui/lib/money.ts'

describe('groupThousands', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(groupThousands(10000)).toBe('10 000')
    expect(groupThousands(1234567)).toBe('1 234 567')
  })

  it('leaves short numbers untouched', () => {
    expect(groupThousands(0)).toBe('0')
    expect(groupThousands(999)).toBe('999')
  })
})

describe('digitsToNumber', () => {
  it('keeps digits only', () => {
    expect(digitsToNumber('10 000')).toBe(10000)
    expect(digitsToNumber('1 234 Kč')).toBe(1234)
  })

  it('treats empty or non-numeric input as zero', () => {
    expect(digitsToNumber('')).toBe(0)
    expect(digitsToNumber('abc')).toBe(0)
  })
})
