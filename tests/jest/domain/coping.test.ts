import {
  COPING_DETAIL_MAX_LENGTH,
  COPING_LABEL_MAX_LENGTH,
  nextCopingPriority,
  normalizeCopingDetail,
  normalizeCopingLabel,
} from '@domain/coping.ts'

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

  it('accepts a label at exactly the max length', () => {
    const label = 'a'.repeat(COPING_LABEL_MAX_LENGTH)
    expect(normalizeCopingLabel(label)).toBe(label)
  })

  it('rejects a label over the max length', () => {
    const label = 'a'.repeat(COPING_LABEL_MAX_LENGTH + 1)
    expect(() => normalizeCopingLabel(label)).toThrow(
      `coping: label must be at most ${String(COPING_LABEL_MAX_LENGTH)} characters`,
    )
  })
})

describe('normalizeCopingDetail', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCopingDetail('  Když mám nutkání  ')).toBe('Když mám nutkání')
  })

  it('turns an empty or whitespace-only value into null', () => {
    expect(normalizeCopingDetail('')).toBeNull()
    expect(normalizeCopingDetail('   ')).toBeNull()
  })

  it('turns null/undefined into null', () => {
    expect(normalizeCopingDetail(null)).toBeNull()
    expect(normalizeCopingDetail(undefined)).toBeNull()
  })

  it('accepts a value at exactly the max length', () => {
    const value = 'a'.repeat(COPING_DETAIL_MAX_LENGTH)
    expect(normalizeCopingDetail(value)).toBe(value)
  })

  it('rejects a value over the max length', () => {
    const value = 'a'.repeat(COPING_DETAIL_MAX_LENGTH + 1)
    expect(() => normalizeCopingDetail(value)).toThrow(
      `coping: detail must be at most ${String(COPING_DETAIL_MAX_LENGTH)} characters`,
    )
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
