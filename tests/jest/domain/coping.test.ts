import { nextCopingPriority, normalizeCopingLabel } from '@domain/coping.ts'

describe('normalizeCopingLabel', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCopingLabel('  Zavolat bratrovi  ')).toBe('Zavolat bratrovi')
  })

  it('rejects an empty label', () => {
    expect(() => normalizeCopingLabel('')).toThrow('coping: label must not be empty')
  })

  it('rejects a whitespace-only label', () => {
    expect(() => normalizeCopingLabel('   ')).toThrow('coping: label must not be empty')
  })
})

describe('nextCopingPriority', () => {
  it('starts at 1 when there are no existing strategies', () => {
    expect(nextCopingPriority([])).toBe(1)
  })

  it('appends after the highest existing priority', () => {
    expect(nextCopingPriority([{ priority: 1 }, { priority: 3 }, { priority: 2 }])).toBe(4)
  })
})
