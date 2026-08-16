import { type Locator, type Page } from '@playwright/test'

/**
 * Page object for the two-step daily check-in (`src/ui/checkin`): the
 * played-yes/no choice, then (for a played day) the time + stakes details. The
 * DurationWheel and MoneyField mechanics match onboarding's, so the drum-driving
 * helper is duplicated here deliberately — the two flows share no code and
 * coupling their page objects would be worse than one small repeated method.
 */

const HOURS_DRUM = 'Hodiny'
const MINUTES_DRUM = 'Minuty'
const MINUTE_STEP = 5

export class CheckInPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // --- step 1: played? -----------------------------------------------------

  /** "Hrál/a jste včera?" for yesterday, or a dated variant for a backfill. */
  get playedHeading(): Locator {
    return this.page.getByRole('heading', { name: /Hrál\/a jste/ })
  }

  get yesButton(): Locator {
    return this.page.getByRole('button', { name: /^Ano/ })
  }

  get noButton(): Locator {
    return this.page.getByRole('button', { name: /^Ne/ })
  }

  /** Answer "played" — advances to the details step. */
  async answerPlayed(): Promise<void> {
    await this.yesButton.click()
  }

  /** Answer "did not play" — submits a zeros record and returns to the dashboard. */
  async answerNotPlayed(): Promise<void> {
    await this.noButton.click()
  }

  // --- step 2: details -----------------------------------------------------

  get stakesField(): Locator {
    return this.page.getByRole('textbox', { name: 'Sázky', exact: true })
  }

  /** The "Pokračovat" submit — disabled until the played time is > 0. */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Pokračovat' })
  }

  async setTime(hours: number, minutes = 0): Promise<void> {
    await this.stepDrum(HOURS_DRUM, hours)
    await this.stepDrum(MINUTES_DRUM, minutes / MINUTE_STEP)
  }

  async setStakes(czk: number): Promise<void> {
    await this.stakesField.fill(String(czk))
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /** Play → enter time/stakes → submit, in one call. */
  async submitPlayed(opts: { hours?: number; minutes?: number; stakes: number }): Promise<void> {
    await this.answerPlayed()
    await this.setTime(opts.hours ?? 0, opts.minutes ?? 0)
    await this.setStakes(opts.stakes)
    await this.submit()
  }

  // --- navigation ----------------------------------------------------------

  /** The back arrow — cancels from the played step, or returns from details. */
  async back(): Promise<void> {
    await this.page.getByRole('button', { name: 'Zpět' }).click()
  }

  private async stepDrum(drumLabel: string, steps: number): Promise<void> {
    if (steps === 0) return
    const drum = this.page.getByRole('listbox', { name: drumLabel })
    await drum.focus()
    for (let i = 0; i < steps; i++) {
      await drum.press('ArrowDown')
    }
  }
}
