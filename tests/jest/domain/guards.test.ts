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

describe('resolvePendingAction', () => {
  const base = { in_final_summary: false, reviewable_weeks: [], checkin_due: false }

  it('prioritizes final_summary over everything else', () => {
    expect(
      resolvePendingAction({
        ...base,
        in_final_summary: true,
        reviewable_weeks: [1],
        checkin_due: true,
      }),
    ).toBe('final_summary')
  })

  it('prioritizes review_available over checkin_due', () => {
    expect(resolvePendingAction({ ...base, reviewable_weeks: [2], checkin_due: true })).toBe(
      'review_available',
    )
  })

  it('falls back to checkin_due, then none', () => {
    expect(resolvePendingAction({ ...base, checkin_due: true })).toBe('checkin_due')
    expect(resolvePendingAction(base)).toBe('none')
  })
})

const review = (week: number): Review => ({
  review_id: `r-${String(week)}`,
  user_id: 'A001',
  review_week_no: week,
  review_completed_at: '2026-09-08T09:00:00.000Z',
  limit_changed: false,
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
    expect(canReview({ week_no: 1, week_elapsed: true, already_reviewed: false })).toBe(true)
    expect(canReview({ week_no: 1, week_elapsed: false, already_reviewed: false })).toBe(false)
    expect(canReview({ week_no: 1, week_elapsed: true, already_reviewed: true })).toBe(false)
  })
})

describe('canEditCheckIn', () => {
  it('flags a future/today date first, then a locked week, else allowed', () => {
    expect(
      canEditCheckIn({ behavior_date: '2026-09-10', today: '2026-09-03', week_closed: false }),
    ).toBe('future_date')
    expect(
      canEditCheckIn({ behavior_date: '2026-09-03', today: '2026-09-03', week_closed: false }),
    ).toBe('future_date')
    expect(
      canEditCheckIn({ behavior_date: '2026-09-02', today: '2026-09-03', week_closed: true }),
    ).toBe('locked_week')
    expect(
      canEditCheckIn({ behavior_date: '2026-09-02', today: '2026-09-03', week_closed: false }),
    ).toBe('allowed')
  })
})
