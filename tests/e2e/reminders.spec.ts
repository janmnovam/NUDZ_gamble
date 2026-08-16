import { expect, test } from '@playwright/test'

import { CheckInPage } from './pom/CheckInPage'
import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'
import { TimeMachine } from './pom/TimeMachine'
import {
  clickLastNotification,
  installFakeNotifications,
  recordedNotifications,
} from './support/notifications'

/**
 * Reminders — the one scenario on the must-work list: while the app is open, a
 * missing check-in at the configured slot (REMINDER_TIMES = 15:30) pops a system
 * notification that clicks through to the check-in.
 *
 * The time machine's day-jump defaults to the 15:30 slot, so jumping to a day
 * with a missing yesterday crosses the reminder. A fake Notification (permission
 * pre-granted) stands in for the OS popup — see support/notifications.ts.
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

  await installFakeNotifications(page)
  await onboarding.resetStorage()
  await onboarding.open()
  await onboarding.completeWithDefaults()
  await dashboard.expectVisible()
})

test('R1 · a missing check-in at the reminder slot pops a notification', async ({ page }) => {
  await timeMachine.jumpToDay(2) // 15:30, day 1 still missing → reminder due

  await expect.poll(async () => (await recordedNotifications(page)).length).toBeGreaterThan(0)

  const notes = await recordedNotifications(page)
  expect(notes.some((n) => n.title === 'Nezapomeňte na check-in')).toBe(true)
})

test('R2 · clicking the reminder opens the check-in', async ({ page }) => {
  await timeMachine.jumpToDay(2)

  await expect.poll(async () => (await recordedNotifications(page)).length).toBeGreaterThan(0)

  await clickLastNotification(page)

  // The click-through routes straight into the daily check-in.
  await expect(checkin.yesButton).toBeVisible()
})
