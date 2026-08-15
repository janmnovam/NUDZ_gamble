import { expect, test } from '@playwright/test'

test('onboarding renders the intro screen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Získej přehled nad svým hraním' })).toBeVisible()
})

test('serves a PWA manifest', async ({ page }) => {
  const response = await page.goto('/manifest.webmanifest')

  expect(response?.status()).toBe(200)
})
