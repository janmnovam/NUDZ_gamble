/**
 * Application composition root. Where `createDataLayer()` bundles the outbound
 * adapters, `createApp()` builds the inbound services on top of them — the single
 * place the UI reaches for a ready-to-call service.
 *
 * The wall clock is **not** read here, and no clock is injected: every
 * time-dependent method takes the instant as a `time` argument the FE passes per
 * request (it calls `clientNow()` at the call site). "Today" is derived from that
 * instant, so core/data/domain stay entirely time-ignorant.
 *
 *   const app = createApp()
 *   await app.onboarding.complete(request, clientNow())
 *   await app.dashboard.getDashboard(clientNow())
 */
import { OnboardingServiceImpl } from '@/app/services/onboardingServiceImpl.ts'
import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import { ContactServiceImpl } from '@/app/services/contactServiceImpl.ts'
import { CheckInServiceImpl } from '@/app/services/checkInServiceImpl.ts'
import { DashboardServiceImpl } from '@/app/services/dashboardServiceImpl.ts'
import { ReviewServiceImpl } from '@/app/services/reviewServiceImpl.ts'
import { ReminderServiceImpl } from '@/app/services/reminderServiceImpl.ts'
import { NotificationServiceImpl } from '@/app/services/notificationServiceImpl.ts'
import { ExportServiceImpl } from '@/app/services/exportServiceImpl.ts'
import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import type { OnboardingService } from '@/app/ports/onboardingService.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import type { ContactService } from '@/app/ports/contactService.ts'
import type { CheckInService } from '@/app/ports/checkInService.ts'
import type { DashboardService } from '@/app/ports/dashboardService.ts'
import type { ReviewService } from '@/app/ports/reviewService.ts'
import type { ReminderService } from '@/app/ports/reminderService.ts'
import type { NotificationService } from '@/app/ports/notificationService.ts'
import type { ExportService } from '@/app/ports/exportService.ts'
import type { AdminService } from '@/app/ports/adminService.ts'
import { newId } from '@data/ids.ts'
import { type DataLayer, createDataLayer } from '@/core/index.ts'

/** The inbound services the UI calls, wired to a data layer. */
export interface App {
  onboarding: OnboardingService
  coping: CopingStrategyService
  contacts: ContactService
  checkIn: CheckInService
  dashboard: DashboardService
  review: ReviewService
  reminder: ReminderService
  notification: NotificationService
  export: ExportService
  admin: AdminService
}

export function createApp(data: DataLayer = createDataLayer()): App {
  const reminder = new ReminderServiceImpl({
    checkIns: data.checkIns,
    profiles: data.profiles,
    reviews: data.reviews,
  })

  return {
    onboarding: new OnboardingServiceImpl({
      repo: data.onboarding,
      profiles: data.profiles,
      newId,
    }),
    coping: new CopingStrategyServiceImpl({ repo: data.copingStrategies }),
    contacts: new ContactServiceImpl({ repo: data.contacts }),
    checkIn: new CheckInServiceImpl({
      checkIns: data.checkIns,
      checkInEdits: data.checkInEdits,
      limits: data.limits,
      profiles: data.profiles,
      copingStrategies: data.copingStrategies,
      newId,
    }),
    dashboard: new DashboardServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
    }),
    review: new ReviewServiceImpl({
      profiles: data.profiles,
      limits: data.limits,
      checkIns: data.checkIns,
      reviews: data.reviews,
      newId,
    }),
    reminder,
    notification: new NotificationServiceImpl({ reminders: reminder }),
    export: new ExportServiceImpl({
      profiles: data.profiles,
      checkIns: data.checkIns,
      limits: data.limits,
      copingStrategies: data.copingStrategies,
    }),
    admin: new AdminServiceImpl({ databaseAdmin: data.databaseAdmin }),
  }
}
