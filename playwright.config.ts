import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = `http://localhost:${String(PORT)}`

// The reference-scenario walkthroughs (docs/Tests.txt → scenarios.spec.ts) seed
// multi-day history via `window.__seed` (src/dev/seed.ts), which only installs
// when `import.meta.env.DEV` is true (see main.tsx) — never in the production
// build the other specs run against. So that one spec runs against the Vite dev
// server instead, on its own port. The dev server serves HTTPS (mkcert, see
// vite.config.ts); Playwright's browser doesn't trust that CA, so both the
// webServer health check and the browser context ignore HTTPS errors.
const DEV_PORT = 5183
const devBaseURL = `https://localhost:${String(DEV_PORT)}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // The app ships as a PWA, so the mobile viewport is the primary target.
  projects: [
    { name: 'mobile-chrome', testIgnore: /scenarios\.spec\.ts/, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testIgnore: /scenarios\.spec\.ts/, use: { ...devices['iPhone 14'] } },
    {
      name: 'desktop-chrome',
      testIgnore: /scenarios\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'scenarios',
      testMatch: /scenarios\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: devBaseURL, ignoreHTTPSErrors: true },
    },
  ],
  webServer: [
    {
      command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${String(DEV_PORT)} --strictPort`,
      url: devBaseURL,
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
