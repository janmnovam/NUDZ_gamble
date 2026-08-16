import { expect, test } from '@playwright/test'

import { CopingPage } from './pom/CopingPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { ReportsPage } from './pom/ReportsPage'

/**
 * Bottom-navigation and the coping tab. The check-in/dashboard/review specs
 * cover the home tab in depth; here we verify the other two tabs are reachable
 * and that the coping library loads the user's strategies.
 */

let onboarding: OnboardingPage
let dashboard: DashboardPage
let coping: CopingPage
let reports: ReportsPage

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  coping = new CopingPage(page)
  reports = new ReportsPage(page)

  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

test('N1 · the coping tab lists the strategy selected at onboarding', async () => {
  await coping.open()

  // The library loads with the one strategy chosen at onboarding shown as
  // selected. (The "other" section holds only the user's own de-selected
  // strategies, so with a single active pick there is none yet.)
  await expect(coping.heading).toBeVisible()
  await expect(coping.selectedSection).toBeVisible()
})

test('N2 · the bottom nav moves between home, strategies and reports', async ({ page }) => {
  await coping.open()
  await expect(coping.heading).toBeVisible()

  await reports.open() // Přehledy
  await expect(reports.title).toBeVisible()

  // Back to home.
  await page.getByRole('button', { name: 'Domů' }).click()
  await dashboard.expectVisible()
})
