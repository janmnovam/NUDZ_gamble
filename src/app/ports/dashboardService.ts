/**
 * DashboardService — inbound (driving) port. Wraps `buildDashboardVM`
 * (`@domain/dashboard.ts`, docs/architecture.md §DashboardService) and maps
 * its `DashboardVM` onto the camelCase `DashboardResponse` DTO.
 */
import type { DashboardResponse } from '@/app/dto/dashboard.ts'

export type { DashboardResponse }

export interface DashboardService {
  /** Cumulative weekly evaluation vs both limits, missing days surfaced. */
  getDashboard(): Promise<DashboardResponse>
}
