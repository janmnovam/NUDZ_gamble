import { expect, test, type Page } from '@playwright/test'

/**
 * A welcome notification fires right after onboarding completes. The real
 * `Notification` API is stubbed (granted, recording) so the test can assert the
 * popup was raised without a live permission prompt.
 */

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['notifications'])
  await page.addInitScript(() => {
    indexedDB.deleteDatabase('nudz-gamble')
    const notes: { title: string; body?: string }[] = []
    class FakeNotification {
      static permission: NotificationPermission = 'granted'
      static requestPermission(): Promise<NotificationPermission> {
        return Promise.resolve('granted')
      }
      onclick: (() => void) | null = null
      constructor(title: string, options?: { body?: string }) {
        notes.push({ title, body: options?.body })
      }
      close(): void {
        // no-op
      }
    }
    Object.assign(window, { __notes: notes, Notification: FakeNotification })
  })
})

async function stepWheel(page: Page, drumLabel: string, steps: number): Promise<void> {
  const drum = page.getByRole('listbox', { name: drumLabel })
  await drum.focus()
  for (let i = 0; i < steps; i++) {
    await drum.press('ArrowDown')
  }
}

test('sends a welcome notification after onboarding completes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Začít' }).click()
  await stepWheel(page, 'Hodiny', 10)
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('textbox', { name: 'Sázky za týden' }).fill('10000')
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('button', { name: 'Pokračovat' }).click()
  await page.getByRole('checkbox').first().click()
  await page.getByRole('button', { name: 'Dokončit nastavení' }).click()

  // The summary screen confirms onboarding finished; the notification fired here.
  await expect(page.getByRole('heading', { name: 'Vše je nastaveno' })).toBeVisible()

  const titles = await page.evaluate(() =>
    (window as unknown as { __notes: { title: string }[] }).__notes.map((n) => n.title),
  )
  expect(titles).toContain('Vítejte! Sledování začalo')
})
