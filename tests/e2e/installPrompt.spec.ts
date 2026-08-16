import { expect, test, type Page } from '@playwright/test'

/**
 * First-run PWA install prompt — phone-only. Headless Chromium won't fire a real
 * `beforeinstallprompt`, so we dispatch a synthetic one (with a stubbed
 * `prompt()`) and assert the popup appears (on phone projects) and that Install
 * triggers it — and that desktop is never nudged.
 */

const INTRO_HEADING = 'Získejte přehled nad svým hraním'
const INSTALL_DIALOG = 'Nainstalovat aplikaci'

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

test('offers to install on first open (phones), and Install triggers the native prompt', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-chrome', 'install prompt is phone-only')

  await page.goto('/')
  await expect(page.getByRole('heading', { name: INTRO_HEADING })).toBeVisible()

  await fireBeforeInstallPrompt(page)

  const dialog = page.getByRole('dialog', { name: INSTALL_DIALOG })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'Nainstalovat' }).click()

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted))
    .toBe(true)
  await expect(dialog).toBeHidden()
})

test('does not offer install on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'desktop-only check')

  await page.goto('/')
  await expect(page.getByRole('heading', { name: INTRO_HEADING })).toBeVisible()

  await fireBeforeInstallPrompt(page)
  await page.waitForTimeout(300)

  await expect(page.getByRole('dialog', { name: INSTALL_DIALOG })).toBeHidden()
})

test('does not offer install once it has been seen', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nudz.installPromptSeen', '1')
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: INTRO_HEADING })).toBeVisible()

  await fireBeforeInstallPrompt(page)

  await expect(page.getByRole('dialog', { name: INSTALL_DIALOG })).toBeHidden()
})
