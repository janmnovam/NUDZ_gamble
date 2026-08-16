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
import { CheckInServiceImpl } from '@/app/services/checkInServiceImpl.ts'
import { DashboardServiceImpl } from '@/app/services/dashboardServiceImpl.ts'
import { ReviewServiceImpl } from '@/app/services/reviewServiceImpl.ts'
import { ReminderServiceImpl } from '@/app/services/reminderServiceImpl.ts'
import { ExportServiceImpl } from '@/app/services/exportServiceImpl.ts'
import type { OnboardingService } from '@/app/ports/onboardingService.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import type { CheckInService } from '@/app/ports/checkInService.ts'
import type { DashboardService } from '@/app/ports/dashboardService.ts'
import type { ReviewService } from '@/app/ports/reviewService.ts'
import type { ReminderService } from '@/app/ports/reminderService.ts'
import type { ExportService } from '@/app/ports/exportService.ts'
import { newId } from '@data/ids.ts'
import { systemTodayClock } from '@data/clock.ts'
import { type DataLayer, createDataLayer } from '@/core/index.ts'

/** The inbound services the UI calls, wired to a data layer. */
export interface App {
  onboarding: OnboardingService
  coping: CopingStrategyService
  checkIn: CheckInService
  dashboard: DashboardService
  review: ReviewService
  reminder: ReminderService
  export: ExportService
}

export function createApp(data: DataLayer = createDataLayer()): App {
  // `TodayClock` isn't part of `DataLayer` by design (see src/core/index.ts) —
  // it's injected here at the composition point.
  const today = systemTodayClock
  return {
    onboarding: new OnboardingServiceImpl({
      repo: data.onboarding,
      now: data.now,
      today,
      newId,
    }),
    coping: new CopingStrategyServiceImpl({ repo: data.copingStrategies }),
    // The services below are wired (dependencies injected) but not yet
    // implemented — their methods throw until each is built.
    checkIn: new CheckInServiceImpl({
      checkIns: data.checkIns,
      checkInEdits: data.checkInEdits,
      limits: data.limits,
      profiles: data.profiles,
      now: data.now,
      today,
    }),
    dashboard: new DashboardServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
      today,
    }),
    review: new ReviewServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
      now: data.now,
      today,
    }),
    reminder: new ReminderServiceImpl({
      checkIns: data.checkIns,
      profiles: data.profiles,
      now: data.now,
      today,
    }),
    export: new ExportServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
    }),
  }
}
