import { expect, test, type Page } from '@playwright/test'

/**
 * Hidden admin console ("Stroj času"): open it with the 7-tap gesture on the day
 * heading, jump to a simulated intervention day, exit back to the real day, and
 * wipe all data to return to onboarding. Reuses the happy-path onboarding
 * walkthrough to reach the dashboard first.
 */

const DB_NAME = 'nudz-gamble'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((name) => {
    indexedDB.deleteDatabase(name)
  }, DB_NAME)
})

async function stepWheel(page: Page, drumLabel: string, steps: number): Promise<void> {
  const drum = page.getByRole('listbox', { name: drumLabel })
  await drum.focus()
  for (let i = 0; i < steps; i++) {
    await drum.press('ArrowDown')
  }
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Začít' }).click()
  await stepWheel(page, 'Hodiny', 10)
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('textbox', { name: 'Sázky za týden' }).fill('10000')
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('checkbox', { name: 'Na chvíli změním prostředí' }).click()
  await page.getByRole('button', { name: 'Dokončit nastavení' }).click()
  await page.getByRole('button', { name: 'Rozumím' }).click()
}

async function openTimeMachine(page: Page): Promise<void> {
  const heading = page.getByRole('heading', { name: 'Den 1' })
  await expect(heading).toBeVisible()
  for (let i = 0; i < 7; i++) {
    await heading.click()
  }
  await expect(page.getByRole('dialog', { name: 'Stroj času' })).toBeVisible()
}

test('jumps to a simulated day and exits back', async ({ page }) => {
  await completeOnboarding(page)

  await openTimeMachine(page)
  await page.getByRole('textbox', { name: 'Přejít na den intervence:' }).fill('5')
  await page.getByRole('button', { name: 'Potvrdit' }).click()

  // The dashboard now reflects the simulated day (week 1 has a limit) and
  // shows the exit pill.
  await expect(page.getByRole('heading', { name: 'Den 5' })).toBeVisible()
  await expect(page.getByText('Týden 1/4')).toBeVisible()

  await page.getByRole('button', { name: 'Opustit stroj času' }).click()
  await expect(page.getByRole('heading', { name: 'Den 1' })).toBeVisible()
})

test('wipes data and returns to onboarding', async ({ page }) => {
  await completeOnboarding(page)

  await openTimeMachine(page)
  page.once('dialog', (dialog) => {
    void dialog.accept()
  })
  await page.getByRole('button', { name: 'Smazat data' }).click()

  // Reload lands back on the onboarding intro with an empty database.
  await expect(page.getByRole('heading', { name: 'Získej přehled nad svým hraním' })).toBeVisible()
})
