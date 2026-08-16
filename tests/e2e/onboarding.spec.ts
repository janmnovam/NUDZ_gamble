import { expect, test } from '@playwright/test'

import { DashboardPage } from './pom/DashboardPage'
import { OnboardingPage } from './pom/OnboardingPage'

/**
 * Onboarding walkthroughs, driven through the OnboardingPage object so the
 * intent stays readable and the locale strings / wheel mechanics live in one
 * place. Every run starts from an empty IndexedDB (fresh device → onboarding).
 *
 * Layer boundary: the 80% suggestion math and the 90% *rejection* are unit-
 * tested in tests/jest/app/onboardingService.test.ts. Here we test what a real
 * user can do — the UI won't even let you pick an over-cap value (the wheel and
 * money field clamp), the CTA gates on coping, and the profile survives reload.
 */

let onboarding: OnboardingPage

test.beforeEach(async ({ page }) => {
  onboarding = new OnboardingPage(page)
  await onboarding.resetStorage()
  await onboarding.open()
  // Suppress the first-run install prompt so it can't overlay these flows.
  await page.addInitScript(() => {
    localStorage.setItem('nudz.installPromptSeen', '1')
  })
})

// --- Suite A: happy path & the reference scenario ---------------------------

test.describe('A · happy path', () => {
  test('A1 · completes with 10 h / 10 000 CZK, accepting the 80% defaults', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    // Accept the suggested limits (80% = 8 h / 8 000) untouched.
    await onboarding.continue()

    await expect(onboarding.copingHeading).toBeVisible()
    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()

    await onboarding.expectSummary({
      reference: '10 h 0 min · 10 000 Kč',
      limits: '8 h 0 min · 8 000 Kč',
      copingCount: '1 vybraná',
    })
    await onboarding.acknowledge()
  })

  test('A2 · reference scenario — adjust both limits up to the 90% cap (9 h / 9 000)', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    // Suggested is 8 h / 8 000; push both up to the cap 9 h / 9 000.
    await onboarding.adjustTimeLimitHours(1)
    expect(await onboarding.selectedLimitHours()).toBe(9)
    await onboarding.setStakesLimit(9_000)
    await onboarding.continue()

    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()

    // The adjusted limits, not the suggestions, land on the record.
    await onboarding.expectSummary({
      reference: '10 h 0 min · 10 000 Kč',
      limits: '9 h 0 min · 9 000 Kč',
      copingCount: '1 vybraná',
    })
  })
})

// --- Suite B: limit suggestion & cap enforcement ----------------------------

test.describe('B · limits: suggestion & cap', () => {
  test('B1 · the limits step defaults to the 80% suggestion', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    expect(await onboarding.selectedLimitHours()).toBe(8)
    expect(await onboarding.currentStakesLimit()).toBe(8_000)
  })

  test('B2 · the time wheel cannot be pushed above the 90% cap', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    // Suggested 8 h, cap 9 h. Press up five times — it must stop at 9.
    await onboarding.adjustTimeLimitHours(5)
    expect(await onboarding.selectedLimitHours()).toBe(9)
  })

  test('B3 · the stakes field clamps an over-cap amount down to the 90% cap', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    await onboarding.setStakesLimit(99_999)
    expect(await onboarding.currentStakesLimit()).toBe(9_000)
  })

  test('B4 · limits can be adjusted down below the suggestion', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    await onboarding.adjustTimeLimitHours(-2) // 8 h → 6 h
    await onboarding.setStakesLimit(5_000)
    await onboarding.continue()

    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()

    await onboarding.expectSummary({
      reference: '10 h 0 min · 10 000 Kč',
      limits: '6 h 0 min · 5 000 Kč',
      copingCount: '1 vybraná',
    })
  })
})

// --- Suite C: coping rules --------------------------------------------------

test.describe('C · coping', () => {
  test.beforeEach(async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })
    await onboarding.continue()
    await expect(onboarding.copingHeading).toBeVisible()
  })

  test('C1 · finish is disabled until a strategy is picked', async () => {
    await expect(onboarding.finishButton).toBeDisabled()
    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await expect(onboarding.finishButton).toBeEnabled()
  })

  test('C2 · a custom-only strategy enables finish and counts as one', async () => {
    await onboarding.setCustomCoping('Zavolám kamarádovi')
    await expect(onboarding.finishButton).toBeEnabled()
    await onboarding.finish()

    await expect(onboarding.doneHeading).toBeVisible()
    await expect(onboarding.page.getByText('1 vybraná')).toBeVisible()
  })

  test('C3 · a whitespace-only custom strategy does not count', async () => {
    await onboarding.setCustomCoping('   ')
    await expect(onboarding.finishButton).toBeDisabled()
  })

  test('C4 · multiple selections are counted on the summary', async () => {
    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.toggleCoping(/^Ozvu se někomu/)
    await onboarding.finish()

    await expect(onboarding.doneHeading).toBeVisible()
    await expect(onboarding.page.getByText('2 vybrané')).toBeVisible()
  })
})

// --- Suite D: navigation & state preservation -------------------------------

test.describe('D · navigation', () => {
  test('D1 · going back preserves the reference already entered', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    await onboarding.back() // → stakes
    await expect(onboarding.refStakesHeading).toBeVisible()
    await onboarding.back() // → time
    await expect(onboarding.refTimeHeading).toBeVisible()

    // The 600-minute reference is still shown, not reset to 0.
    await expect(
      onboarding.page
        .getByRole('listbox', { name: 'Hodiny' })
        .getByRole('option', { selected: true }),
    ).toHaveText('10 h')
  })

  test('D2 · a custom limit is kept (not re-derived) after the reference changes [characterization]', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    // Adjust the time limit down to a custom 6 h.
    await onboarding.adjustTimeLimitHours(-2)
    expect(await onboarding.selectedLimitHours()).toBe(6)

    // Go back and raise the reference to 12 h (new suggestion would be ~9 h 35).
    await onboarding.back() // → stakes
    await onboarding.back() // → time
    await onboarding.setReferenceTime(12)
    await onboarding.continue() // → stakes
    await onboarding.continue() // → limits

    // Current behaviour: the custom 6 h persists — it is NOT re-derived from the
    // new reference. This pins the behaviour; flip the assertion if the product
    // decision is that changing the reference should reset the suggestion.
    expect(await onboarding.selectedLimitHours()).toBe(6)
  })
})

// --- Suite E: edge cases ----------------------------------------------------

test.describe('E · edge cases', () => {
  test('E1 · a zero reference locks the limits at zero and still completes', async () => {
    // Leave both reference inputs at 0.
    await onboarding.start()
    await expect(onboarding.refTimeHeading).toBeVisible()
    await onboarding.continue()
    await expect(onboarding.refStakesHeading).toBeVisible()
    await onboarding.continue()

    await expect(onboarding.limitsHeading).toBeVisible()
    expect(await onboarding.selectedLimitHours()).toBe(0)
    expect(await onboarding.currentStakesLimit()).toBe(0)
    await onboarding.continue()

    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()

    await onboarding.expectSummary({
      reference: '0 h 0 min · 0 Kč',
      limits: '0 h 0 min · 0 Kč',
      copingCount: '1 vybraná',
    })
  })

  test('E2 · an off-grid 80% suggestion snaps down onto the 5-minute grid', async () => {
    // 610 min reference → 80% = 488 min (8 h 8 min), off the 5-min grid; the
    // wheel snaps it down to 8 h 5 min (485) and stores that.
    await onboarding.enterReferenceWeek({ timeHours: 10, timeMinutes: 10, stakes: 10_000 })
    await onboarding.continue()

    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()

    await expect(onboarding.doneHeading).toBeVisible()
    await expect(onboarding.page.getByText('8 h 5 min · 8 000 Kč')).toBeVisible()
  })

  test('E3 · the 90% cap value itself is selectable (inclusive bound)', async () => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })

    // Exactly the cap: 9 h for time, 9 000 for stakes — both must be accepted.
    await onboarding.adjustTimeLimitHours(1)
    await onboarding.setStakesLimit(9_000)
    expect(await onboarding.selectedLimitHours()).toBe(9)
    expect(await onboarding.currentStakesLimit()).toBe(9_000)
  })
})

// --- Suite F: persistence ---------------------------------------------------

test.describe('F · persistence', () => {
  test('F1 · after completing, a reload lands on the dashboard, not onboarding', async ({
    page,
  }) => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })
    await onboarding.continue()
    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()
    await onboarding.acknowledge()

    const dashboard = new DashboardPage(page)
    await dashboard.expectVisible()

    await page.reload()
    await dashboard.expectVisible()
    await expect(onboarding.introHeading).toBeHidden()
  })

  test('F2 · the chosen limits survive the reload', async ({ page }) => {
    await onboarding.enterReferenceWeek({ timeHours: 10, stakes: 10_000 })
    await onboarding.continue() // accept 8 h / 8 000
    await onboarding.toggleCoping(/^Na chvíli odejdu od hraní/)
    await onboarding.finish()
    await onboarding.acknowledge()

    const dashboard = new DashboardPage(page)
    await dashboard.expectVisible()
    await page.reload()

    // Fresh week, no usage yet → "zbývá {limit} z {limit}" reflects the stored limits.
    await dashboard.expectLimitNote('zbývá 8 h z 8 h')
    await dashboard.expectLimitNote('zbývá 8 000 Kč z 8 000 Kč')
  })
})
