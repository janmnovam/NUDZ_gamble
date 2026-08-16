/**
 * Exposes the dev seeding helper (`src/dev/seed.ts`) on `window` so a
 * scenario can be loaded from the browser console — `await __seed({...})` —
 * without shipping any dev UI. Call `install()` once, guarded by
 * `import.meta.env.DEV` (see `main.tsx`); a no-op, tree-shaken away in
 * production builds. To drop the demo user's data, seed an empty scenario or
 * call the AdminService (`createApp().admin.dropUserData('demo-user')`).
 */
import { seedScenario, type Scenario } from '@/dev/seed.ts'

declare global {
  interface Window {
    __seed: (scenario: Scenario) => Promise<void>
  }
}

export function install(): void {
  window.__seed = seedScenario
  console.info('[dev] __seed(scenario) available — reload after calling it.')
}
