/**
 * Application composition root. Where `createDataLayer()` bundles the outbound
 * adapters, `createApp()` builds the inbound services on top of them and injects
 * the shared clock / id / calendar sources — the single place the UI reaches for
 * a ready-to-call service.
 *
 *   const app = createApp()                 // default IndexedDB data layer
 *   await app.onboarding.complete(request)
 */
import { OnboardingServiceImpl } from '@/app/services/onboardingServiceImpl.ts'
import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import type { OnboardingService } from '@/app/ports/onboardingService.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import { newId } from '@data/ids.ts'
import { systemTodayClock } from '@data/clock.ts'
import { type DataLayer, createDataLayer } from '@/core/index.ts'

/** The inbound services the UI calls, wired to a data layer. */
export interface App {
  onboarding: OnboardingService
  coping: CopingStrategyService
}

export function createApp(data: DataLayer = createDataLayer()): App {
  return {
    onboarding: new OnboardingServiceImpl({
      repo: data.onboarding,
      now: data.now,
      // `TodayClock` isn't part of `DataLayer` by design (see src/core/index.ts) —
      // it's injected here at the composition point.
      today: systemTodayClock,
      newId,
    }),
    coping: new CopingStrategyServiceImpl({ repo: data.copingStrategies }),
  }
}
