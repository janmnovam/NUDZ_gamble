import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Suppress the first-run install prompt so it can't overlay these flows.
  await page.addInitScript(() => {
    localStorage.setItem('nudz.installPromptSeen', '1')
  })
})

test('onboarding renders the intro screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Získejte přehled o svém hraní/ })).toBeVisible()
})

test('serves a PWA manifest', async ({ page }) => {
  const response = await page.goto('/manifest.webmanifest')

  expect(response?.status()).toBe(200)
})
