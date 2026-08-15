import { evaluateLimitAdjustment } from '@domain/guards.ts'
import { limitPercentView } from '@domain/config.ts'

describe('limitPercentView', () => {
  it('exposes the 80/90 rule as whole-number percents', () => {
    expect(limitPercentView()).toEqual({ suggested_pct: 80, max_pct: 90 })
  })
})

describe('evaluateLimitAdjustment', () => {
  it('matches the reference scenario (600 min / 10 000 CZK)', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 540 })).toEqual({
      suggested: 480,
      suggested_pct: 80,
      max: 540,
      max_pct: 90,
      allowed: true,
    })
    expect(evaluateLimitAdjustment({ reference: 10_000, proposed: 9_000 })).toEqual({
      suggested: 8_000,
      suggested_pct: 80,
      max: 9_000,
      max_pct: 90,
      allowed: true,
    })
  })

  it('flags a proposal above the 90% cap as not allowed, bounds unchanged', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 541 })).toEqual({
      suggested: 480,
      suggested_pct: 80,
      max: 540,
      max_pct: 90,
      allowed: false,
    })
  })

  it('accepts a proposal below the suggestion — going lower is always allowed', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 0 }).allowed).toBe(true)
  })

  it('with reference 0, only a zero proposal is allowed', () => {
    expect(evaluateLimitAdjustment({ reference: 0, proposed: 0 })).toEqual({
      suggested: 0,
      suggested_pct: 80,
      max: 0,
      max_pct: 90,
      allowed: true,
    })
    expect(evaluateLimitAdjustment({ reference: 0, proposed: 1 }).allowed).toBe(false)
  })
})
