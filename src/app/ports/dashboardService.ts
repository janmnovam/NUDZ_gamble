/**
 * DashboardService — inbound (driving) port. Wraps `buildDashboardVM`
 * (`@domain/dashboard.ts`, docs/architecture.md §DashboardService) and maps
 * its `DashboardVM` onto the camelCase `DashboardResponse` DTO.
 */
import type { DashboardResponse } from '@/app/dto/dashboard.ts'
import type { ISOTimestamp } from '@domain/model.ts'

export type { DashboardResponse }

export interface DashboardService {
  /**
   * Cumulative weekly evaluation vs both limits, missing days surfaced.
   * `time` is the caller-supplied instant (offset-bearing) that anchors "today".
   */
  getDashboard(time: ISOTimestamp): Promise<DashboardResponse>
}
