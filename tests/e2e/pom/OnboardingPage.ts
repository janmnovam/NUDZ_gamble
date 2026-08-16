import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the six-step onboarding wizard (`src/ui/onboarding`). One
 * method per meaningful user action, so the specs read as intent
 * ("set the reference week", "adjust the time limit up to the cap") and the
 * brittle bits — Czech locale strings, the scroll-snapping DurationWheel, the
 * MoneyField's hidden numeric input — live here once.
 *
 * Selectors mirror the cs-first locale (`src/ui/i18n/locales/cs.ts`); the app is
 * Czech-first and every string goes through the translator, so role+name is the
 * stable contract. Only one step renders at a time (a `switch` in
 * OnboardingFlow), so per-step names never collide.
 */

const DB_NAME = 'nudz-gamble'

/** The two DurationWheel drums share these aria labels on every step that uses them. */
const HOURS_DRUM = 'Hodiny'
const MINUTES_DRUM = 'Minuty'
/** The wheel moves in 5-minute steps, so one ArrowDown on the minutes drum = 5 min. */
const MINUTE_STEP = 5

export class OnboardingPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // --- lifecycle -----------------------------------------------------------

  /**
   * Wipe IndexedDB before the app boots so every run starts from a fresh device
   * (no profile → onboarding is the entry screen). Must be called before `open()`.
   *
   * Guarded by a sessionStorage marker: `addInitScript` runs on *every*
   * navigation, so without this a `page.reload()` mid-test would wipe the profile
   * we just created. sessionStorage survives a reload but is fresh per test
   * context, so the delete fires exactly once — on the first load.
   */
  async resetStorage(): Promise<void> {
    await this.page.addInitScript((name) => {
      if (!window.sessionStorage.getItem('__dbReset')) {
        indexedDB.deleteDatabase(name)
        window.sessionStorage.setItem('__dbReset', '1')
      }
      // Suppress the first-run install prompt (phone-only overlay) so it can't
      // cover the flows under test.
      window.localStorage.setItem('nudz.installPromptSeen', '1')
    }, DB_NAME)
  }

  async open(): Promise<void> {
    await this.page.goto('/')
    await expect(this.introHeading).toBeVisible()
  }

  // --- step 0: intro -------------------------------------------------------

  /** Tolerant of the `whitespace-pre-line` line break in the title. */
  get introHeading(): Locator {
    return this.page.getByRole('heading', { name: /Získejte přehled o svém hraní/ })
  }

  async start(): Promise<void> {
    await this.page.getByRole('button', { name: 'Začít' }).click()
  }

  // --- step 1: reference time ---------------------------------------------

  get refTimeHeading(): Locator {
    return this.page.getByRole('heading', { name: /Kolik času věnujete hraní/ })
  }

  /**
   * Set the reference time to an absolute H:M via the keyboard — reads the drums'
   * current values and steps the delta, so it works whether the wheel starts at 0
   * or at a previously-entered value (ArrowDown = up). Mouse-wheel scrolling is
   * flaky headless.
   */
  async setReferenceTime(hours: number, minutes = 0): Promise<void> {
    await this.stepDrum(HOURS_DRUM, hours - (await this.drumValue(HOURS_DRUM)))
    await this.stepDrum(
      MINUTES_DRUM,
      (minutes - (await this.drumValue(MINUTES_DRUM))) / MINUTE_STEP,
    )
    await expect(
      this.page.getByRole('listbox', { name: HOURS_DRUM }).getByRole('option', { selected: true }),
    ).toHaveText(`${String(hours)} h`)
  }

  // --- step 2: reference stakes -------------------------------------------

  get refStakesHeading(): Locator {
    return this.page.getByRole('heading', {
      name: 'Kolik peněz celkem během jednoho týdne vsadíte?',
    })
  }

  async setReferenceStakes(czk: number): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Sázky za týden' }).fill(String(czk))
  }

  // --- step 3: limits ------------------------------------------------------

  get limitsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Nastavení limitů na týden 1' })
  }

  /** The limit-stakes MoneyField. Same aria ("Sázky za týden") as the reference
   * field, but only one step renders at a time so there is no collision. */
  get limitStakesField(): Locator {
    return this.page.getByRole('textbox', { name: 'Sázky za týden' })
  }

  /**
   * Nudge the time-limit wheel by whole hours from its current value:
   * positive = up (ArrowDown), negative = down (ArrowUp). The wheel caps the
   * hours drum at 90% of the reference, so pushing past it simply stops.
   */
  async adjustTimeLimitHours(deltaHours: number): Promise<void> {
    await this.stepDrum(HOURS_DRUM, deltaHours)
  }

  /** Type an absolute stakes limit; the field clamps to the 90% cap itself. */
  async setStakesLimit(czk: number): Promise<void> {
    await this.limitStakesField.fill(String(czk))
  }

  /** The whole-hours value the time-limit wheel currently shows (e.g. "9 h" → 9). */
  async selectedLimitHours(): Promise<number> {
    return this.drumValue(HOURS_DRUM)
  }

  /** The stakes value the limit field currently holds, as a number. */
  async currentStakesLimit(): Promise<number> {
    const value = await this.limitStakesField.inputValue()
    return value === '' ? 0 : Number(value)
  }

  // --- step 4: coping ------------------------------------------------------

  get copingHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Co uděláte, když budete chtít hrát?' })
  }

  get finishButton(): Locator {
    return this.page.getByRole('button', { name: 'Dokončit nastavení' })
  }

  /** Toggle a suggested coping strategy by its (possibly partial) label. */
  async toggleCoping(name: string | RegExp): Promise<void> {
    await this.page.getByRole('checkbox', { name }).click()
  }

  async setCustomCoping(text: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /Vlastní strategie/ }).fill(text)
  }

  async finish(): Promise<void> {
    await this.finishButton.click()
  }

  // --- step 5: done --------------------------------------------------------

  get doneHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Vše je nastaveno' })
  }

  async acknowledge(): Promise<void> {
    await this.page.getByRole('button', { name: 'Rozumím' }).click()
  }

  // --- navigation ----------------------------------------------------------

  /** The single "Pokračovat" button of the current step (only one renders at a time). */
  async continue(): Promise<void> {
    await this.page.getByRole('button', { name: 'Pokračovat' }).click()
  }

  async back(): Promise<void> {
    await this.page.getByRole('button', { name: 'Zpět' }).click()
  }

  // --- composite flows -----------------------------------------------------

  /**
   * Run intro → reference time → reference stakes and stop on the limits step,
   * the shared prefix of most scenarios.
   */
  async enterReferenceWeek(opts: {
    timeHours: number
    timeMinutes?: number
    stakes: number
  }): Promise<void> {
    await this.start()
    await expect(this.refTimeHeading).toBeVisible()
    await this.setReferenceTime(opts.timeHours, opts.timeMinutes ?? 0)
    await this.continue()

    await expect(this.refStakesHeading).toBeVisible()
    await this.setReferenceStakes(opts.stakes)
    await this.continue()

    await expect(this.limitsHeading).toBeVisible()
  }

  /**
   * Run the whole wizard for a given reference week, accepting the suggested
   * limits and one coping strategy. Leaves the app on the dashboard.
   */
  async completeWithReference(opts: {
    timeHours: number
    timeMinutes?: number
    stakes: number
  }): Promise<void> {
    await this.enterReferenceWeek(opts)
    await this.continue() // accept the suggested (80%) limits
    await expect(this.copingHeading).toBeVisible()
    await this.toggleCoping(/^Na chvíli odejdu od hraní/)
    await this.finish()
    await expect(this.doneHeading).toBeVisible()
    await this.acknowledge()
  }

  /**
   * The standard setup other features (check-in, dashboard, reviews) start from:
   * reference 10 h / 10 000 → weekly limits 8 h / 8 000.
   */
  async completeWithDefaults(): Promise<void> {
    await this.completeWithReference({ timeHours: 10, stakes: 10_000 })
  }

  // --- assertions ----------------------------------------------------------

  /**
   * Assert the Done-step summary rows. Values are formatted as
   * "H h M min · N Kč" (reference/limits) and a pluralised coping count. Each is
   * scoped to its own row so identical values (e.g. a zero reference and zero
   * limits) don't collide in strict mode.
   */
  async expectSummary(opts: {
    reference: string
    limits: string
    copingCount: string
  }): Promise<void> {
    await expect(this.doneHeading).toBeVisible()
    await this.expectSummaryRow('Referenční týden', opts.reference)
    await this.expectSummaryRow('Limity na týden 1', opts.limits)
    await this.expectSummaryRow('Copingové strategie', opts.copingCount)
  }

  /** Assert a Done-step row: the value sits in the same row `<div>` as its label. */
  private async expectSummaryRow(label: string, value: string): Promise<void> {
    const row = this.page.getByText(label, { exact: true }).locator('..')
    await expect(row.getByText(value, { exact: true })).toBeVisible()
  }

  /** The numeric value of a duration drum's currently-selected option. */
  private async drumValue(drumLabel: string): Promise<number> {
    const label = await this.page
      .getByRole('listbox', { name: drumLabel })
      .getByRole('option', { selected: true })
      .textContent()
    return Number((label ?? '').replace(/[^\d]/g, ''))
  }

  private async stepDrum(drumLabel: string, steps: number): Promise<void> {
    if (steps === 0) return
    const drum = this.page.getByRole('listbox', { name: drumLabel })
    await drum.focus()
    const key = steps > 0 ? 'ArrowDown' : 'ArrowUp'
    for (let i = 0; i < Math.abs(steps); i++) {
      await drum.press(key)
    }
  }
}
