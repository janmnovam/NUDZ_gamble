import { expect, test } from '@playwright/test'

import { CheckInPage } from './pom/CheckInPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { TimeMachine } from './pom/TimeMachine'

/**
 * Daily check-in walkthroughs. Every test onboards with the standard reference
 * (→ weekly limits 480 min / 8 000 CZK), then uses the admin time machine to
 * reach a day where a check-in is due or a gap is backfillable.
 *
 * Layer boundary: the backfill-window math and the refusal envelopes
 * (OUTSIDE_WINDOW / WEEK_CLOSED, day-5 edge, no-play zeros, upsert) are unit-
 * tested in tests/jest/app/checkInService.test.ts. Here we test the user-visible
 * behaviour: the two-path flow, the "feedback" the dashboard shows afterwards
 * (state chip, % used, remaining), and how the window is expressed in the UI (a
 * fillable day is a button; an out-of-window day is not).
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
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

// --- Suite A: played vs no-play basics --------------------------------------

test.describe('A · played vs no-play', () => {
  test('A1 · a no-play answer saves a valid zeros record and clears the missing day', async () => {
    await timeMachine.jumpToDay(2)
    await expect(dashboard.backfillableDays).toHaveCount(1) // day 1 missing

    await dashboard.startCheckIn()
    await expect(checkin.yesButton).toBeVisible()
    await checkin.answerNotPlayed()

    await dashboard.expectVisible()
    await expect(dashboard.backfillableDays).toHaveCount(0)
    await dashboard.expectOverallStatus('OK')
    await dashboard.expectLimitNote('zbývá 8 000 Kč z 8 000 Kč')
    // Yesterday is filled now → the CTA flips to the disabled "tomorrow" variant.
    await expect(dashboard.checkInTomorrowButton).toBeVisible()
  })

  test('A2 · a played answer under the limit reads OK with the usage subtracted', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 1, stakes: 5_000 })

    await dashboard.expectVisible()
    await dashboard.expectOverallStatus('OK')
    await dashboard.expectPercent(dashboard.stakesBar, 63) // 5000 / 8000
    await dashboard.expectPercent(dashboard.timeBar, 13) // 60 / 480
    await dashboard.expectLimitNote('zbývá 3 000 Kč z 8 000 Kč')
  })

  test('A3 · the details step cannot be submitted until a play time is set', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.answerPlayed()

    await expect(checkin.submitButton).toBeDisabled()
    await checkin.setTime(1) // 60 min
    await expect(checkin.submitButton).toBeEnabled()
  })
})

// --- Suite B: feedback states -----------------------------------------------

test.describe('B · feedback states', () => {
  test('B1 · POZOR — stakes over 80% of the weekly limit, time still OK', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 5, minutes: 50, stakes: 6_500 }) // 350 min / 6 500

    await dashboard.expectVisible()
    await dashboard.expectPercent(dashboard.stakesBar, 81) // 6500 / 8000
    await dashboard.expectPercent(dashboard.timeBar, 73) // 350 / 480
    await dashboard.expectOverallStatus('POZOR')
    await dashboard.expectLimitNote('zbývá 1 500 Kč z 8 000 Kč')
  })

  test('B2 · PŘEKROČENO — stakes past the weekly limit', async () => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 1, stakes: 9_000 }) // over the 8 000 limit

    await dashboard.expectVisible()
    await dashboard.expectOverallStatus('PŘEKROČENO')
    await dashboard.expectLimitNote('překročeno o 1 000 Kč z 8 000 Kč')
  })
})

// --- Suite C: backfill ------------------------------------------------------

test.describe('C · backfill', () => {
  test('C1 · the primary CTA only fills in yesterday', async () => {
    await timeMachine.jumpToDay(3)
    await expect(dashboard.backfillableDays).toHaveCount(2) // days 1 and 2 missing

    await dashboard.startCheckIn()
    // The auto-pick is the latest missing day = yesterday.
    await expect(checkin.playedHeading).toHaveText(/včera/)
    await checkin.answerNotPlayed()

    await dashboard.expectVisible()
    await expect(dashboard.backfillableDays).toHaveCount(1) // day 1 still missing
  })

  test('C2 · an older gap is backfilled by tapping its day cell', async () => {
    await timeMachine.jumpToDay(4)
    await expect(dashboard.backfillableDays).toHaveCount(3) // days 1, 2, 3 missing

    await dashboard.backfillOldestMissingDay() // day 1 — three days back, not "yesterday"
    await expect(checkin.playedHeading).not.toHaveText(/včera/)
    await checkin.answerNotPlayed()

    await dashboard.expectVisible()
    await expect(dashboard.backfillableDays).toHaveCount(2)
  })
})

// --- Suite D: backfill window enforcement -----------------------------------

test.describe('D · backfill window', () => {
  test('D1 · a day five back is still offered for backfill', async () => {
    await timeMachine.jumpToDay(6)
    // Days 1–5 are all within the 5-day window; day 6 is today → all five fillable.
    await expect(dashboard.backfillableDays).toHaveCount(5)
  })

  test('D2 · a day six back has fallen out of the window (backfill stays capped at 5)', async () => {
    await timeMachine.jumpToDay(7)
    // Six calendar days are now missing (days 1–6), but the rolling 5-day window
    // caps what can be filled: day 1 (six back) is locked out, so only five days
    // remain offered — the count does not grow to six.
    await expect(dashboard.backfillableDays).toHaveCount(5)
  })
})

// --- Suite E: persistence ---------------------------------------------------

test.describe('E · persistence', () => {
  test('E1 · a submitted check-in survives a reload', async ({ page }) => {
    await timeMachine.jumpToDay(2)
    await dashboard.startCheckIn()
    await checkin.submitPlayed({ hours: 1, stakes: 5_000 })
    await dashboard.expectVisible()
    await dashboard.expectLimitNote('zbývá 3 000 Kč z 8 000 Kč')

    // Reload drops the simulated time (in-memory) but keeps the data (IndexedDB).
    await page.reload()
    await dashboard.expectVisible()

    // Re-simulate day 2: the day-1 record is still there — no longer missing, and
    // its usage still counts against the week.
    await timeMachine.jumpToDay(2)
    await expect(dashboard.backfillableDays).toHaveCount(0)
    await dashboard.expectLimitNote('zbývá 3 000 Kč z 8 000 Kč')
  })
})

// --- Suite F: navigation ----------------------------------------------------

test.describe('F · navigation', () => {
  test('F1 · back cancels from the played step and returns from the details step', async () => {
    await timeMachine.jumpToDay(2)

    // Back from the played step cancels to the dashboard.
    await dashboard.startCheckIn()
    await expect(checkin.yesButton).toBeVisible()
    await checkin.back()
    await dashboard.expectVisible()

    // Back from the details step returns to the played step (not the dashboard).
    await dashboard.startCheckIn()
    await checkin.answerPlayed()
    await expect(checkin.stakesField).toBeVisible()
    await checkin.back()
    await expect(checkin.yesButton).toBeVisible()
  })
})
