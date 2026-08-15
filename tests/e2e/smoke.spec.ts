import { expect, test } from '@playwright/test'

test('app shell renders', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'NUDZ Gamble' })).toBeVisible()
})

test('serves a PWA manifest', async ({ page }) => {
  const response = await page.goto('/manifest.webmanifest')

  expect(response?.status()).toBe(200)
})
