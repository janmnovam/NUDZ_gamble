/**
 * Application composition root. Where `createDataLayer()` bundles the outbound
 * adapters, `createApp()` builds the inbound services on top of them — the single
 * place the UI reaches for a ready-to-call service.
 *
 * The wall clock is **not** read here: `createApp` receives the `time` clock from
 * the UI (the FE owns "now"), keeping core/data/domain time-ignorant. Onboarding
 * and coping already take the instant per request; the remaining services still
 * take the injected `time` clock until they move to per-request time too. "Today"
 * is derived from the instant, so there is no separate today source.
 *
 *   const app = createApp(uiClock)
 *   await app.onboarding.complete(request, time)
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
import type { Clock } from '@domain/ports.ts'
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

export function createApp(time: Clock, data: DataLayer = createDataLayer()): App {
  return {
    onboarding: new OnboardingServiceImpl({
      repo: data.onboarding,
      profiles: data.profiles,
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
      time,
    }),
    dashboard: new DashboardServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
      time,
    }),
    review: new ReviewServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
      time,
      newId,
    }),
    reminder: new ReminderServiceImpl({
      checkIns: data.checkIns,
      profiles: data.profiles,
      time,
    }),
    export: new ExportServiceImpl({
      checkIns: data.checkIns,
      limits: data.limits,
      copingStrategies: data.copingStrategies,
    }),
  }
}
