import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the dashboard — the anchors onboarding and check-in specs need
 * to prove they landed here, read the "feedback" (states, %, remaining) after a
 * check-in, and reach the backfill affordances.
 */
export class DashboardPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** "Celkový stav" is unique to the dashboard and always present. */
  get overallStatusLabel(): Locator {
    return this.page.getByText('Celkový stav')
  }

  /** "Den {n}" title — day 1 right after onboarding, the simulated day otherwise. */
  get dayTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Den \d+$/ })
  }

  /** Primary check-in CTA — enabled only when yesterday is still missing. */
  get checkInButton(): Locator {
    return this.page.getByRole('button', { name: 'Vyplnit check-in' })
  }

  /** The disabled variant shown when nothing is due ("Check-in bude zítra"). */
  get checkInTomorrowButton(): Locator {
    return this.page.getByRole('button', { name: 'Check-in bude zítra' })
  }

  /** Weekly limit progress bars, keyed by their axis labels. */
  get timeBar(): Locator {
    return this.page.getByRole('progressbar', { name: 'Čas za týden' })
  }

  get stakesBar(): Locator {
    return this.page.getByRole('progressbar', { name: 'Sázky za týden' })
  }

  /** "Týden {w}/4" subtitle. */
  get weekSubtitle(): Locator {
    return this.page.getByText(/^Týden \d+\/\d+$/)
  }

  /**
   * Missing days offered for backfill render as buttons ("… — chybí záznam").
   * A day past the rolling window becomes a non-interactive `locked` cell, so it
   * drops out of this set — which is how the specs assert the window boundary.
   */
  get backfillableDays(): Locator {
    return this.page.getByRole('button', { name: /chybí záznam/ })
  }

  // --- banners -------------------------------------------------------------

  /** Day-1 start notice. */
  get startBanner(): Locator {
    return this.page.getByText('Sebesledování začalo')
  }

  /** Shown when nothing is missing on day ≥ 2. */
  get allDoneBanner(): Locator {
    return this.page.getByText('Vše vyplněno')
  }

  /** The missing-days banner body (present whenever days are backfillable). */
  get missingBannerBody(): Locator {
    return this.page.getByText('Doplnit je můžete během 5 dní od daného dne.')
  }

  /** The missing-days banner title, e.g. "Nemáte vyplněné 3 dny". */
  missingBannerTitle(text: string | RegExp): Locator {
    return this.page.getByText(text)
  }

  async expectVisible(): Promise<void> {
    await expect(this.overallStatusLabel).toBeVisible()
    await expect(this.dayTitle).toBeVisible()
  }

  async startCheckIn(): Promise<void> {
    await this.checkInButton.click()
  }

  /** Backfill the earliest missing day still in the window (leftmost cell). */
  async backfillOldestMissingDay(): Promise<void> {
    await this.backfillableDays.first().click()
  }

  /** The overall status chip text: 'OK' | 'POZOR' | 'PŘEKROČENO'. */
  async expectOverallStatus(status: string): Promise<void> {
    await expect(this.page.getByText(status, { exact: true })).toBeVisible()
  }

  /** Assert a bar's used-percent via its `aria-valuenow` (integer percent). */
  async expectPercent(bar: Locator, percent: number): Promise<void> {
    await expect(bar).toHaveAttribute('aria-valuenow', String(percent))
  }

  /** The limit axis notes read "zbývá {remaining} z {limit}" / "překročeno o …". */
  async expectLimitNote(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible()
  }

  /**
   * Assert no percentage is rendered on either bar — the case when the limit is
   * 0 (zero reference), where CLAUDE.md says the percentage is hidden entirely.
   */
  async expectNoPercentages(): Promise<void> {
    await expect(this.page.getByText(/\d+\s*%/)).toHaveCount(0)
  }
}
