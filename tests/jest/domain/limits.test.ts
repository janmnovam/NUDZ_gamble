import { classifyStatus, isWithinCap, maxLimit, suggestLimit, worseStatus } from '@domain/limits.ts'

describe('limit rules', () => {
  it('suggests 80% of the reference (time & money), rounded', () => {
    expect(suggestLimit(600)).toBe(480) // 10h -> 8h
    expect(suggestLimit(10_000)).toBe(8_000) // CZK
    expect(suggestLimit(0)).toBe(0)
    expect(suggestLimit(350)).toBe(280) // rounding: 0.8 * 350 = 280
  })

  it('caps adjustment at 90% of the reference (time & money), rounded', () => {
    expect(maxLimit(600)).toBe(540) // 9h
    expect(maxLimit(10_000)).toBe(9_000) // CZK
    expect(maxLimit(0)).toBe(0)
  })

  it('accepts a limit at or below the 90% cap', () => {
    expect(isWithinCap(540, 600)).toBe(true) // exactly 90%
    expect(isWithinCap(480, 600)).toBe(true) // the suggestion
    expect(isWithinCap(9_000, 10_000)).toBe(true)
  })

  it('rejects a limit above the 90% cap', () => {
    expect(isWithinCap(541, 600)).toBe(false)
    expect(isWithinCap(9_001, 10_000)).toBe(false)
  })

  it('with reference 0, only a zero limit is within cap', () => {
    expect(isWithinCap(0, 0)).toBe(true)
    expect(isWithinCap(1, 0)).toBe(false)
  })

  it('rejects a negative limit', () => {
    expect(isWithinCap(-1, 600)).toBe(false)
  })
})

describe('classifyStatus', () => {
  it("matches doc 06's boundary discipline table (480 min limit)", () => {
    expect(classifyStatus(383, 480)).toBe('OK') // 79.79%
    expect(classifyStatus(384, 480)).toBe('POZOR') // 80.00% — lower bound inclusive
    expect(classifyStatus(480, 480)).toBe('POZOR') // 100.00% — upper bound inclusive
    expect(classifyStatus(481, 480)).toBe('PREKROCENO') // 100.2%
  })

  it('matches the reference scenario (350/480 min, 6500/8000 CZK)', () => {
    expect(classifyStatus(350, 480)).toBe('OK') // 72.9%
    expect(classifyStatus(6_500, 8_000)).toBe('POZOR') // 81.25%
  })

  it('with limit 0, any positive usage is PREKROCENO and zero usage is OK', () => {
    expect(classifyStatus(0, 0)).toBe('OK')
    expect(classifyStatus(1, 0)).toBe('PREKROCENO')
  })
})

describe('worseStatus', () => {
  it('picks the worse of the two statuses, order-independent', () => {
    expect(worseStatus('OK', 'POZOR')).toBe('POZOR')
    expect(worseStatus('POZOR', 'OK')).toBe('POZOR')
    expect(worseStatus('POZOR', 'PREKROCENO')).toBe('PREKROCENO')
    expect(worseStatus('OK', 'OK')).toBe('OK')
  })
})
