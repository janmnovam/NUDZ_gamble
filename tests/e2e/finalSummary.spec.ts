import { expect, test } from '@playwright/test'

import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { ReportsPage } from './pom/ReportsPage'
import { ReviewPage } from './pom/ReviewPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * The reports tab / final summary — the four-week overview reachable at any time
 * from the bottom navigation. Covers the week cards' states (running / locked /
 * reviewed), the "limits no longer set" note, the programme (month-grid) view,
 * and opening a closed week's read-only detail.
 */

let onboarding: OnboardingPage
let dashboard: DashboardPage
let reports: ReportsPage
let review: ReviewPage
let timeMachine: TimeMachine

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  reports = new ReportsPage(page)
  review = new ReviewPage(page)
  timeMachine = new TimeMachine(page)

  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

test('A1 · day 1 overview: week 1 running, later weeks locked', async () => {
  await reports.open()

  await expect(reports.title).toBeVisible()
  await expect(reports.page.getByText('PROBÍHÁ')).toBeVisible() // week 1 is under way
  await expect(reports.lockedWeeks).toHaveCount(3) // weeks 2–4 not reached yet
  await expect(reports.page.getByText('Limity už se nenastavují')).toBeVisible()
  await expect(reports.page.getByRole('button', { name: 'Souhrnný přehled' })).toBeVisible()
})

test('A2 · the programme overview opens as a month grid', async () => {
  await reports.open()
  await reports.openProgramme()

  await expect(reports.page.getByRole('heading', { name: 'Souhrnný přehled' })).toBeVisible()
  await expect(reports.page.getByText('Souhrn programu')).toBeVisible()
  // The export CTA is available from the programme view too.
  await expect(reports.exportButton).toBeVisible()
})

test('A3 · a reviewed week opens its read-only detail', async () => {
  // Close week 1 by completing its review at the start of week 2.
  await timeMachine.confirm(8)
  await review.save()
  await dashboard.expectVisible()

  await reports.open()
  await reports.weekCard(1).click()

  await expect(reports.page.getByText('Týden 1 je uzavřený')).toBeVisible()
})
