import { render, screen, waitFor } from '@testing-library/react'

import type { ReviewResponse } from '@/app/dto/review.ts'
import type { ReviewService } from '@/app/ports/reviewService.ts'
import { ok } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { useAppView } from '@ui/app/appView.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { WeekReviewFlow } from '@ui/review/WeekReviewFlow.tsx'
import { I18nProvider } from '@ui/i18n/I18nProvider.tsx'

function review(over: Partial<ReviewResponse>): ReviewResponse {
  return {
    weekNo: 1,
    time: { used: 350, limit: 480, status: 'OK' },
    stakes: { used: 6_500, limit: 8_000, status: 'POZOR' },
    missingDays: [],
    blockingCheckInDay: null,
    suggestedNextLimits: { timeMinutes: 480, stakesAmount: 8_000 },
    ...over,
  }
}

// Only the review seam matters here, so a narrowed cast keeps the fake focused.
function renderFlow(getPendingReview: ReviewService['getPendingReview']) {
  useCurrentUser.setState({ userId: 'test-user' })
  useAppView.setState({ view: 'review', checkinBehaviorDate: null })
  render(
    <I18nProvider>
      <AppProvider app={{ review: { getPendingReview } } as unknown as App}>
        <WeekReviewFlow />
      </AppProvider>
    </I18nProvider>,
  )
}

describe('WeekReviewFlow', () => {
  it('shows the limit form when no check-in is blocking', async () => {
    renderFlow(() => Promise.resolve(ok(review({ blockingCheckInDay: null }))))

    expect(await screen.findByText('Nové limity na další týden')).not.toBeNull()
    expect(useAppView.getState().view).toBe('review')
  })

  it('routes to backfill the blocking day before the limit form', async () => {
    // A week can't be closed while its last day's check-in is still fillable:
    // the review sends the user to fill day 7 first, and only then the limit form.
    renderFlow(() =>
      Promise.resolve(ok(review({ blockingCheckInDay: '2026-09-07T00:00:00.000Z' }))),
    )

    await waitFor(() => {
      expect(useAppView.getState().view).toBe('checkin')
    })
    expect(useAppView.getState().checkinBehaviorDate).toBe('2026-09-07T00:00:00.000Z')
    expect(screen.queryByText('Nové limity na další týden')).toBeNull()
  })

  it('returns to the dashboard when nothing is pending', async () => {
    renderFlow(() => Promise.resolve(ok(null)))

    await waitFor(() => {
      expect(useAppView.getState().view).toBe('dashboard')
    })
  })
})
