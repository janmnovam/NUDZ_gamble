/**
 * Exposes the dev seeding helpers (`src/dev/seed.ts`) on `window` so a
 * scenario can be loaded from the browser console — `await __seed({...})`,
 * `await __resetDb()` — without shipping any dev UI. Call `install()` once,
 * guarded by `import.meta.env.DEV` (see `main.tsx`); a no-op, tree-shaken
 * away in production builds.
 */
import { resetDb, seedScenario, type Scenario } from '@/dev/seed.ts'

declare global {
  interface Window {
    __seed: (scenario: Scenario) => Promise<void>
    __resetDb: () => Promise<void>
  }
}

export function install(): void {
  window.__seed = seedScenario
  window.__resetDb = resetDb
  console.info('[dev] __seed(scenario) / __resetDb() available — reload after calling either.')
}
