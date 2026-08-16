import { expect, test } from '@playwright/test'

import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { ReviewPage } from './pom/ReviewPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * Hidden admin console ("Stroj času"): open it with the 7-tap gesture on the day
 * heading, jump to a simulated intervention day, exit back to the real day, and
 * wipe all data to return to onboarding. Reuses the shared page objects so the
 * onboarding walkthrough and the console gestures live in one place.
 */

let onboarding: OnboardingPage
let dashboard: DashboardPage
let review: ReviewPage
let timeMachine: TimeMachine

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  review = new ReviewPage(page)
  timeMachine = new TimeMachine(page)

  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

test('jumps to a simulated day and exits back', async ({ page }) => {
  await timeMachine.jumpToDay(5)

  // The dashboard now reflects the simulated day (week 1 has a limit).
  await expect(page.getByText('Týden 1/4')).toBeVisible()

  await timeMachine.exit()
  await expect(page.getByRole('heading', { name: 'Den 1' })).toBeVisible()
})

test('wipes data and returns to onboarding', async () => {
  await timeMachine.wipeData()

  // The wipe returns the app to the onboarding intro with an empty database.
  await expect(onboarding.introHeading).toBeVisible()
})

test('prompts for next-week limits when a new week has none set', async ({ page }) => {
  // Jump into week 2, whose limits are not set yet (only week 1 was, at onboarding).
  await timeMachine.confirm(8)

  // Instead of a broken dashboard, the user is prompted for the new week's limits.
  await expect(review.title).toBeVisible()

  // Accept the pre-filled previous limits.
  await review.save()

  // The dashboard now renders the new week with its freshly set limits.
  await expect(page.getByRole('heading', { name: 'Den 8' })).toBeVisible()
  await expect(page.getByText('Týden 2/4')).toBeVisible()
})
