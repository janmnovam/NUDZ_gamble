import { expect, test, type Page } from '@playwright/test'

/**
 * First-run PWA install prompt. Headless Chromium won't fire a real
 * `beforeinstallprompt`, so we dispatch a synthetic one (with a stubbed
 * `prompt()`), then assert the popup appears and Install triggers it.
 */

async function fireBeforeInstallPrompt(page: Page): Promise<void> {
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt')
    Object.assign(event, {
      prompt: () => {
        Object.assign(window, { __prompted: true })
        return Promise.resolve()
      },
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    window.dispatchEvent(event)
  })
}

test('offers to install the app on first open, and Install triggers the native prompt', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Získejte přehled nad svým hraním' }),
  ).toBeVisible()

  await fireBeforeInstallPrompt(page)

  const dialog = page.getByRole('dialog', { name: 'Nainstalovat aplikaci' })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'Nainstalovat' }).click()

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted))
    .toBe(true)
  await expect(dialog).toBeHidden()
})

test('does not offer install once it has been seen', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nudz.installPromptSeen', '1')
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Získejte přehled nad svým hraním' }),
  ).toBeVisible()

  await fireBeforeInstallPrompt(page)

  await expect(page.getByRole('dialog', { name: 'Nainstalovat aplikaci' })).toBeHidden()
})
