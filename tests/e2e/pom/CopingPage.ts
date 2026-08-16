import { expect, type Locator, type Page } from '@playwright/test'

/**
 * The "Strategie" tab — the standalone coping-strategy library, reached from the
 * bottom navigation. (The library screen currently renders its Czech labels
 * directly rather than through the translator, so the anchors are literal.)
 */
export class CopingPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Knihovna strategií' })
  }

  /** "Vybrané" — strategies the user has active (seeded from onboarding). */
  get selectedSection(): Locator {
    return this.page.getByRole('heading', { name: 'Vybrané' })
  }

  /** "Další strategie" — the rest of the catalog. */
  get otherSection(): Locator {
    return this.page.getByRole('heading', { name: 'Další strategie' })
  }

  /** Open the coping tab from the bottom navigation. */
  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Strategie' }).click()
    await expect(this.heading).toBeVisible()
  }
}
