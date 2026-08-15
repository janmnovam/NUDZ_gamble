/**
 * Dashboard read model (doc 08) — one function builds this from source
 * records + limit history on every render. Nothing in here is persisted.
 */
import type { ISODate } from '@domain/model.ts'
import type { StudyDay, WeekNo } from '@domain/clock.ts'
import type { DayState } from '@domain/checkin.ts'
import type { Status } from '@domain/config.ts'
import type { PendingAction } from '@domain/guards.ts'

export interface AxisView {
  used: number
  limit: number
  /** Integer percent for display; null when `limit` is 0 (doc 04: no percentage shown). Classify on the raw ratio, not this. */
  pct: number | null
  status: Status
  /** `max(0, limit - used)` — or the overage, if the negative reading is chosen instead (doc 06, undecided). */
  remaining: number
}

export interface DayCell {
  study_day: StudyDay
  date: ISODate
  state: DayState
  /** Present for `completed` / `backfilled` cells only. */
  played?: boolean
  time_min?: number
  stakes_czk?: number
}

export interface DashboardVM {
  study_day: StudyDay
  week_no: WeekNo
  limits: { time_min: number; stakes_czk: number }
  time: AxisView
  stakes: AxisView
  overall_status: Status
  /** Always 7 entries: the current week's days. */
  days: DayCell[]
  /** Only days ≤ `today - 1` — future days are "not yet due", never missing. */
  missing_days: ISODate[]
  pending_action: PendingAction
}

export type BuildDashboardVM = () => DashboardVM
