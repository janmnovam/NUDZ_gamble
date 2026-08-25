import { expect, test } from '@playwright/test'

import { CheckInPage } from './pom/CheckInPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { ReviewPage } from './pom/ReviewPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * Weekly review — the start-of-week gate that prompts for the next week's limits
 * when a new week has begun with none set. Reached by time-machining into a new
 * week (day 8/15/22). The reference is 10 h / 10 000 → suggested next limits
 * 8 h / 8 000, cap 9 h / 9 000.
 *
 * A week can't be closed while its last day's check-in is still fillable (that
 * day is "yesterday" the moment the review opens), so the flow routes there
 * first; filling it opens the review. `openReview()` walks that two-step path.
 *
 * Layer boundary: the review math, the one-record-per-week / no-overwrite rules,
 * and which day blocks the review are unit-tested in
 * tests/jest/app/reviewService.test.ts. Here we test the user-visible gate:
 * it applies the chosen limits to the new week, and — since the wheel is NOT
 * clamped here — refuses an over-cap limit with a visible error.
 */

let onboarding: OnboardingPage
let dashboard: DashboardPage
let review: ReviewPage
let checkin: CheckInPage
let timeMachine: TimeMachine

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  review = new ReviewPage(page)
  checkin = new CheckInPage(page)
  timeMachine = new TimeMachine(page)

  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

/**
 * Jump into a new week and reach its review. The just-ended day's check-in is
 * due first and blocks the review until filled, so answer it (as a no-play day)
 * to land on the review.
 */
async function openReview(day: number): Promise<void> {
  await timeMachine.confirm(day)
  await checkin.answerNotPlayed()
  await expect(review.title).toBeVisible()
}

// --- Suite A: the review gate -----------------------------------------------

test.describe('A · the review gate', () => {
  test('A1 · a new week asks to fill the last day first, then opens the review pre-filled', async () => {
    await timeMachine.confirm(8) // week 2, no limits yet → but day 7's check-in is due first

    // The review can't close week 1 while day 7 is still fillable, so it routes
    // to that check-in before the limit form.
    await expect(checkin.playedHeading).toBeVisible()
    await checkin.answerNotPlayed()

    await expect(review.title).toBeVisible()
    await expect(review.weekEndedOverline(1)).toBeVisible()
    // Defaults are the 80% suggestion of the reference.
    await expect(review.previous('8 h 0 min')).toBeVisible()
    await expect(review.previous('8 000 Kč')).toBeVisible()
  })

  test('A2 · saving the defaults applies them as the new week’s limits', async ({ page }) => {
    await openReview(8)
    await review.save()

    await dashboard.expectVisible()
    await expect(page.getByRole('heading', { name: 'Den 8' })).toBeVisible()
    await expect(page.getByText('Týden 2/4')).toBeVisible()
    await dashboard.expectLimitNote('zbývá 8 h z 8 h')
    await dashboard.expectLimitNote('zbývá 8 000 Kč z 8 000 Kč')
  })
})

// --- Suite B: adjusting next-week limits ------------------------------------

test.describe('B · adjusting the next limits', () => {
  test('B1 · the chosen lower limits carry into the new week', async () => {
    await openReview(8)
    await review.adjustTimeHours(-2) // 8 h → 6 h
    await review.setStakes(5_000)
    await review.save()

    await dashboard.expectVisible()
    await dashboard.expectLimitNote('zbývá 6 h z 6 h')
    await dashboard.expectLimitNote('zbývá 5 000 Kč z 5 000 Kč')
  })
})

// --- Suite C: the 90% cap (domain-enforced, wheel not clamped here) ----------

test.describe('C · the 90% cap', () => {
  test('C1 · an over-cap time limit is refused with an error', async () => {
    await openReview(8)
    await review.adjustTimeHours(2) // 8 h → 10 h, over the 9 h cap
    await review.save()

    await expect(
      review.errorMessage('Limit na čas může být nejvýš 90 % vašeho referenčního týdne.'),
    ).toBeVisible()
    await expect(review.title).toBeVisible() // still on the review, not the dashboard
  })

  test('C2 · an over-cap stakes limit is refused with an error', async () => {
    await openReview(8)
    await review.setStakes(9_500) // over the 9 000 cap
    await review.save()

    await expect(
      review.errorMessage('Limit na sázky může být nejvýš 90 % vašeho referenčního týdne.'),
    ).toBeVisible()
    await expect(review.title).toBeVisible()
  })
})

// --- Suite D: reviews recur each week ---------------------------------------

test.describe('D · reviews recur', () => {
  test('D1 · the next week also opens its own review', async () => {
    await openReview(8) // week-1 review (after filling day 7)
    await review.save()
    await dashboard.expectVisible()

    await openReview(15) // week 3 has no limits → review for week 2 (after filling day 14)
    await expect(review.weekEndedOverline(2)).toBeVisible()
  })
})
