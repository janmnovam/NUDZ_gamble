/** Maps the domain `DashboardVM` (`@domain/dashboard.ts`) onto the `DashboardResponse` DTO. */
import type { AxisDto, DashboardResponse, DayCellDto } from '@/app/dto/dashboard.ts'
import { DEFAULT_CONFIG, type DomainConfig } from '@domain/config.ts'
import type { AxisView, DashboardVM, DayCell } from '@domain/dashboard.ts'

function toAxisDto(axis: AxisView): AxisDto {
  return {
    used: axis.used,
    limit: axis.limit,
    percent: axis.pct,
    remaining: axis.remaining,
    status: axis.status,
  }
}

function toDayCellDto(day: DayCell): DayCellDto {
  return {
    studyDay: day.studyDay,
    date: day.date,
    state: day.state,
    backfillable: day.backfillable,
    ...(day.played !== undefined && { played: day.played }),
    ...(day.timeMin !== undefined && { timeMinutes: day.timeMin }),
    ...(day.stakesCzk !== undefined && { stakesAmount: day.stakesCzk }),
  }
}

export function toDashboardResponse(
  vm: DashboardVM,
  config: DomainConfig = DEFAULT_CONFIG,
): DashboardResponse {
  return {
    studyDay: vm.studyDay,
    weekNo: vm.weekNo,
    time: toAxisDto(vm.time),
    stakes: toAxisDto(vm.stakes),
    overallStatus: vm.overallStatus,
    days: vm.days.map(toDayCellDto),
    missingDays: vm.missingDays,
    pendingAction: vm.pendingAction,
    cautionThresholdPercent: Math.round(config.POZOR_THRESHOLD * 100),
  }
}
