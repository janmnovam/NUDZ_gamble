/**
 * Dashboard DTOs — the UI-shaped, camelCase boundary of the inbound
 * `DashboardService` (docs/architecture.md §DashboardService). Mirrors the
 * domain's `AxisView`/`DayCell`/`DashboardVM` (`@domain/dashboard.ts`); a
 * mapper (`@/app/mappers/dashboardMapper.ts`) converts between the two so the
 * camelCase surface never leaks into `src/domain`.
 */
import type { DayState } from '@domain/checkin.ts'
import type { Status } from '@domain/config.ts'
import type { PendingAction } from '@domain/guards.ts'
import type { ISOCalendarTimestamp } from '@domain/model.ts'

export interface AxisDto {
  used: number
  limit: number
  /** Integer percent for display; null when `limit` is 0 (no percentage shown). */
  percent: number | null
  /** `limit - used`, unclamped — can read negative, i.e. "over by". */
  remaining: number
  status: Status
}

export interface DayCellDto {
  studyDay: number
  date: ISOCalendarTimestamp
  state: DayState
  /** A `missing` day still inside the rolling backfill window — the UI makes only these tappable. */
  backfillable: boolean
  /** Present only when `state` is `completed` or `backfilled`. */
  played?: boolean
  timeMinutes?: number
  stakesAmount?: number
}

export interface DashboardResponse {
  studyDay: number
  weekNo: number
  time: AxisDto
  stakes: AxisDto
  overallStatus: Status
  /** Always 7 entries: the current week's strip, study-day order. */
  days: DayCellDto[]
  missingDays: ISOCalendarTimestamp[]
  pendingAction: PendingAction
  /**
   * The OK/POZOR boundary as a whole-number percent (80). Carried so a progress
   * bar can mark the threshold without reading `DEFAULT_CONFIG` itself — the
   * tick and the `status` classification must always agree, and they only do
   * that reliably if both come from the same place.
   */
  cautionThresholdPercent: number
}
