import { expect, test } from '@playwright/test'

import { CheckInPage } from './pom/CheckInPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * Dashboard read-model views. Additive to the onboarding and check-in specs:
 * those already cover the status chips, backfill cell counts, and % bars after a
 * check-in, so here we focus on what's dashboard-specific — the initial day-1
 * state, the missing/all-done/start banners, axis symmetry (the time axis, not
 * just stakes), and the zero-reference "percentages hidden" rule.
 */

let onboarding: OnboardingPage
let dashboard: DashboardPage
let checkin: CheckInPage
let timeMachine: TimeMachine

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  dashboard = new DashboardPage(page)
  checkin = new CheckInPage(page)
  timeMachine = new TimeMachine(page)

  await onboarding.resetStorage()
  await onboarding.open()
})

// --- Suite A: initial state -------------------------------------------------

test.describe('A · initial state', () => {
  test.beforeEach(async () => {
    await onboarding.completeWithDefaults()
    await dashboard.expectVisible()
  })

  test('A1 · day 1 shows the start notice, a disabled CTA, and a full week ahead', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Den 1' })).toBeVisible()
    await expect(page.getByText('Týden 1/4')).toBeVisible()

    await dashboard.expectOverallStatus('OK')
    await dashboard.expectLimitNote('zbývá 8 h z 8 h')
    await dashboard.expectLimitNote('zbývá 8 000 Kč z 8 000 Kč')

    // Nothing is due yet on day 1 — the CTA is the disabled "tomorrow" variant.
    await expect(dashboard.checkInTomorrowButton).toBeVisible()
    await expect(dashboard.checkInTomorrowButton).toBeDisabled()

    // Start notice, and neither the missing nor the all-done banner.
    await expect(dashboard.startBanner).toBeVisible()
    await expect(dashboard.allDoneBanner).toBeHidden()
    await expect(dashboard.missingBannerBody).toBeHidden()
  })
})

// --- Suite B: missing-data surfacing ----------------------------------------

test.describe('B · missing-data banners', () => {
  test.beforeEach(async () => {
    await onboarding.completeWithDefaults()
    await dashboard.expectVisible()
  })

  test('B1 · a single missing day is named in the singular', async () => {
    await timeMachine.jumpToDay(2)
    await expect(dashboard.missingBannerTitle(/^Nemáte vyplněný /)).toBeVisible()
    await expect(dashboard.missingBannerBody).toBeVisible()
    await expect(dashboard.checkInButton).toBeEnabled()
  })

  test('B2 · several missing days are counted', async () => {
    await timeMachine.jumpToDay(4)
    await expect(dashboard.missingBannerTitle('Nemáte vyplněné 3 dny')).toBeVisible()
    await expect(dashboard.missingBannerBody).toBeVisible()
  })

  test('B3 · filling everything shows the all-done banner', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.answerNotPlayed()

    await dashboard.expectVisible()
    await expect(dashboard.allDoneBanner).toBeVisible()
    await expect(dashboard.missingBannerBody).toBeHidden()
  })

  test('B4 · filling only yesterday disables the CTA while older gaps remain', async () => {
    await timeMachine.jumpToDay(4)
    // The CTA fills yesterday (day 3); days 1–2 stay missing.
    await dashboard.startCheckIn()
    await checkin.answerNotPlayed()

    await dashboard.expectVisible()
    await expect(dashboard.checkInTomorrowButton).toBeVisible()
    await expect(dashboard.checkInTomorrowButton).toBeDisabled()
    await expect(dashboard.missingBannerTitle('Nemáte vyplněné 2 dny')).toBeVisible()
    await expect(dashboard.backfillableDays).toHaveCount(2)
  })
})

// --- Suite C: axis symmetry -------------------------------------------------

test.describe('C · limit evaluation', () => {
  test.beforeEach(async () => {
    await onboarding.completeWithDefaults()
    await dashboard.expectVisible()
  })

  test('C1 · the time axis alone can drive the overall status to PŘEKROČENO', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 8, minutes: 20, stakes: 1_000 }) // 500 min > 480

    await dashboard.expectVisible()
    await dashboard.expectPercent(dashboard.stakesBar, 13) // 1000 / 8000 — OK
    await dashboard.expectOverallStatus('PŘEKROČENO')
    await dashboard.expectLimitNote('překročeno o 20 min z 8 h')
  })
})

// --- Suite D: zero-reference edge -------------------------------------------

test.describe('D · zero reference', () => {
  test.beforeEach(async () => {
    await onboarding.completeWithReference({ timeHours: 0, stakes: 0 })
    await dashboard.expectVisible()
  })

  test('D1 · a zero reference hides percentages, and any play reads as exceeded', async () => {
    // Limit is 0 → no percentage is shown at all.
    await dashboard.expectNoPercentages()
    await dashboard.expectOverallStatus('OK')

    // Any positive usage exceeds a zero limit — still with no percentage.
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 1, stakes: 500 })

    await dashboard.expectVisible()
    await dashboard.expectOverallStatus('PŘEKROČENO')
    await dashboard.expectNoPercentages()
  })
})
