import { expect, type Page } from '@playwright/test'

/**
 * The hidden demo console ("Stroj času"), opened by a 7-tap gesture on the
 * dashboard's "Den N" heading. It pins the app to a simulated intervention day
 * so specs can reach a day where a check-in is due, a gap is backfillable, or a
 * day has fallen out of the 5-day window — without waiting real days.
 *
 * `simulatedTime` lives in memory (it resets on reload), while day 1
 * (`interventionStartDate`) is persisted — so after a reload you re-`open()` and
 * `jumpToDay()` again to get back to a simulated day.
 */
export class TimeMachine {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Open the console via the 7-tap gesture on whichever "Den N" heading is shown. */
  async open(): Promise<void> {
    const heading = this.page.getByRole('heading', { name: /^Den \d+$/ })
    await expect(heading).toBeVisible()
    for (let i = 0; i < 7; i++) {
      await heading.click()
    }
    await expect(this.page.getByRole('dialog', { name: 'Stroj času' })).toBeVisible()
  }

  /** Enter a day and confirm, without asserting where it lands (may be a review prompt). */
  async confirm(day: number): Promise<void> {
    await this.open()
    await this.page.getByRole('textbox', { name: 'Přejít na den intervence:' }).fill(String(day))
    await this.page.getByRole('button', { name: 'Potvrdit' }).click()
  }

  /** Jump to an intervention day and assert the dashboard shows it. */
  async jumpToDay(day: number): Promise<void> {
    await this.confirm(day)
    await expect(this.page.getByRole('heading', { name: `Den ${String(day)}` })).toBeVisible()
  }

  /** Return to the real clock. */
  async exit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Opustit stroj času' }).click()
  }

  /**
   * Wipe all demo data. The "Smazat data" button raises a native confirm; accept
   * it, then the app returns to onboarding. Opens the console first if needed.
   */
  async wipeData(): Promise<void> {
    await this.open()
    this.page.once('dialog', (dialog) => {
      void dialog.accept()
    })
    await this.page.getByRole('button', { name: 'Smazat data' }).click()
  }
}
