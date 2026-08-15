import {
  canEditCheckIn,
  canReview,
  evaluateLimitAdjustment,
  isWeekClosed,
  resolvePendingAction,
} from '@domain/guards.ts'
import { limitPercentView } from '@domain/limits.ts'
import type { Review } from '@domain/model.ts'

describe('limitPercentView', () => {
  it('exposes the 80/90 rule as whole-number percents', () => {
    expect(limitPercentView()).toEqual({ suggestedPct: 80, maxPct: 90 })
  })
})

describe('evaluateLimitAdjustment', () => {
  it('matches the reference scenario (600 min / 10 000 CZK)', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 540 })).toEqual({
      suggested: 480,
      suggestedPct: 80,
      max: 540,
      maxPct: 90,
      allowed: true,
    })
    expect(evaluateLimitAdjustment({ reference: 10_000, proposed: 9_000 })).toEqual({
      suggested: 8_000,
      suggestedPct: 80,
      max: 9_000,
      maxPct: 90,
      allowed: true,
    })
  })

  it('flags a proposal above the 90% cap as not allowed, bounds unchanged', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 541 })).toEqual({
      suggested: 480,
      suggestedPct: 80,
      max: 540,
      maxPct: 90,
      allowed: false,
    })
  })

  it('accepts a proposal below the suggestion — going lower is always allowed', () => {
    expect(evaluateLimitAdjustment({ reference: 600, proposed: 0 }).allowed).toBe(true)
  })

  it('with reference 0, only a zero proposal is allowed', () => {
    expect(evaluateLimitAdjustment({ reference: 0, proposed: 0 })).toEqual({
      suggested: 0,
      suggestedPct: 80,
      max: 0,
      maxPct: 90,
      allowed: true,
    })
    expect(evaluateLimitAdjustment({ reference: 0, proposed: 1 }).allowed).toBe(false)
  })
})

describe('resolvePendingAction', () => {
  const base = { inFinalSummary: false, reviewableWeeks: [], checkinDue: false }

  it('prioritizes final_summary over everything else', () => {
    expect(
      resolvePendingAction({
        ...base,
        inFinalSummary: true,
        reviewableWeeks: [1],
        checkinDue: true,
      }),
    ).toBe('final_summary')
  })

  it('prioritizes review_available over checkinDue', () => {
    expect(resolvePendingAction({ ...base, reviewableWeeks: [2], checkinDue: true })).toBe(
      'review_available',
    )
  })

  it('falls back to checkinDue, then none', () => {
    expect(resolvePendingAction({ ...base, checkinDue: true })).toBe('checkin_due')
    expect(resolvePendingAction(base)).toBe('none')
  })
})

const review = (week: number): Review => ({
  reviewId: `r-${String(week)}`,
  userId: 'A001',
  reviewWeekNo: week,
  reviewCompletedAt: '2026-09-08T09:00:00.000Z',
  limitChanged: false,
  incomplete: false,
})

describe('isWeekClosed', () => {
  it('is true only when a review row exists for the week', () => {
    expect(isWeekClosed(1, [review(1)])).toBe(true)
    expect(isWeekClosed(2, [review(1)])).toBe(false)
    expect(isWeekClosed(1, [])).toBe(false)
  })
})

describe('canReview', () => {
  it('opens once the week has elapsed and stays open until reviewed', () => {
    expect(canReview({ weekNo: 1, weekElapsed: true, alreadyReviewed: false })).toBe(true)
    expect(canReview({ weekNo: 1, weekElapsed: false, alreadyReviewed: false })).toBe(false)
    expect(canReview({ weekNo: 1, weekElapsed: true, alreadyReviewed: true })).toBe(false)
  })
})

describe('canEditCheckIn', () => {
  it('flags a future/today date first, then a locked week, else allowed', () => {
    expect(
      canEditCheckIn({ behaviorDate: '2026-09-10', today: '2026-09-03', weekClosed: false }),
    ).toBe('future_date')
    expect(
      canEditCheckIn({ behaviorDate: '2026-09-03', today: '2026-09-03', weekClosed: false }),
    ).toBe('future_date')
    expect(
      canEditCheckIn({ behaviorDate: '2026-09-02', today: '2026-09-03', weekClosed: true }),
    ).toBe('locked_week')
    expect(
      canEditCheckIn({ behaviorDate: '2026-09-02', today: '2026-09-03', weekClosed: false }),
    ).toBe('allowed')
  })
})
