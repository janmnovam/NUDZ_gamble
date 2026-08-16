import { type Locator, type Page } from '@playwright/test'

/**
 * Page object for the start-of-week review gate (`src/ui/review`): shown when a
 * new week has no limits yet, it prompts for the next week's limits (previous
 * ones pre-filled). Unlike onboarding, the wheel/field here are NOT clamped to
 * the 90% cap — an over-cap value is refused by the domain with a localized
 * error, which this page exposes.
 */

const HOURS_DRUM = 'Hodiny'

export class ReviewPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get title(): Locator {
    return this.page.getByRole('heading', { name: 'Nové limity na další týden' })
  }

  /** "TÝDEN {week} SKONČIL" overline naming the week that just closed. */
  weekEndedOverline(week: number): Locator {
    return this.page.getByText(`TÝDEN ${String(week)} SKONČIL`)
  }

  /** "Předchozí: {value}" hints showing the pre-filled defaults. */
  previous(value: string): Locator {
    return this.page.getByText(`Předchozí: ${value}`)
  }

  get stakesField(): Locator {
    return this.page.getByRole('textbox', { name: 'Sázky za týden', exact: true })
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Uložit limity' })
  }

  /** Error shown when the domain refuses the save (e.g. over the 90% cap). */
  errorMessage(text: string): Locator {
    return this.page.getByText(text)
  }

  /** Nudge the next-week time limit by whole hours from its default (ArrowDown = up). */
  async adjustTimeHours(deltaHours: number): Promise<void> {
    await this.stepDrum(HOURS_DRUM, deltaHours)
  }

  async setStakes(czk: number): Promise<void> {
    await this.stakesField.fill(String(czk))
  }

  async save(): Promise<void> {
    await this.saveButton.click()
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
