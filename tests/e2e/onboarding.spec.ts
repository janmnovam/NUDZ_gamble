import { expect, test, type Page } from '@playwright/test'

/**
 * Happy-path onboarding walkthrough — the "simple one": reference 10 h / week
 * and 10 000 CZK / week, suggested limits accepted as-is (80 % → 8 h / 8 000),
 * one coping strategy picked. Mirrors the jury click-through on a phone.
 *
 * The DurationWheel is a scroll-snapping picker; driving it with mouse wheel /
 * scroll from a headless browser is flaky, so we use its keyboard support
 * (ArrowDown steps one option) on the `role="listbox"` drum.
 */

const DB_NAME = 'nudz-gamble'

// Start every run from an empty IndexedDB so the flow is deterministic.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((name) => {
    indexedDB.deleteDatabase(name)
  }, DB_NAME)
})

/** Step a duration drum up by N options via the keyboard. */
async function stepWheel(page: Page, drumLabel: string, steps: number): Promise<void> {
  const drum = page.getByRole('listbox', { name: drumLabel })
  await drum.focus()
  for (let i = 0; i < steps; i++) {
    await drum.press('ArrowDown')
  }
}

test('completes onboarding with 10 h / 10 000 CZK reference', async ({ page }) => {
  await page.goto('/')

  // Step 1 — intro & disclaimer.
  await expect(
    page.getByRole('heading', { name: 'Získejte přehled nad svým hraním' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Začít' }).click()

  // Step 2 — reference weekly time: 10 h 0 min (= 600 min).
  await expect(page.getByRole('heading', { name: /Kolik času obvykle věnujete/ })).toBeVisible()
  await stepWheel(page, 'Hodiny', 10)
  await expect(page.getByText('= 600 minut za týden')).toBeVisible()
  await page.getByRole('button', { name: 'Pokračovat' }).click()

  // Step 3 — reference weekly stakes: 10 000 CZK.
  await expect(page.getByRole('heading', { name: 'Kolik obvykle vsadíte za týden?' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Sázky za týden' }).fill('10000')
  await page.getByRole('button', { name: 'Pokračovat' }).click()

  // Step 4 — suggested limits (80 % = 8 h / 8 000). Accept the defaults.
  await expect(page.getByRole('heading', { name: 'Návrh limitů na týden 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Pokračovat' }).click()

  // Step 5 — coping strategies: pick at least one, then finish.
  await expect(
    page.getByRole('heading', { name: 'Co můžete udělat při nutkání hrát' }),
  ).toBeVisible()
  await page.getByRole('checkbox', { name: /^Na chvíli odejdu od hraní/ }).click()
  await page.getByRole('button', { name: 'Dokončit nastavení' }).click()

  // Step 6 — summary. Confirms reference + suggested limits landed on the record.
  await expect(page.getByRole('heading', { name: 'Vše je nastaveno' })).toBeVisible()
  await expect(page.getByText('10 h 0 min · 10 000 Kč')).toBeVisible()
  await expect(page.getByText('8 h 0 min · 8 000 Kč')).toBeVisible()
  await page.getByRole('button', { name: 'Rozumím' }).click()
})
