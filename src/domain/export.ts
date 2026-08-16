/**
 * Data export (README §"Exporting data from app") — the three exportable
 * tables (check-ins, limits, coping strategies) for the demo user, each
 * sorted into a stable, user-facing order. Fetch + sort only: no derived
 * fields, no calendar math — the raw rows themselves are the export
 * (contrast with the dashboard's derived `DayCell`s). CSV text formatting
 * and ZIP bundling are app-layer concerns — see
 * `src/app/mappers/exportMapper.ts` and `src/app/lib/zip.ts`.
 */
import type { CheckIn, CopingStrategy, Limit, UserId } from '@domain/model.ts'
import type { CheckInRepository, CopingStrategyRepository, LimitRepository } from '@domain/ports.ts'

export interface ExportBundle {
  checkIns: CheckIn[]
  limits: Limit[]
  copingStrategies: CopingStrategy[]
}

export interface ExportDeps {
  userId: UserId
  checkInRepo: CheckInRepository
  limitRepo: LimitRepository
  copingStrategyRepo: CopingStrategyRepository
}

/** The demo user's full data set, one array per table, ready to hand to the CSV mapper. */
export async function buildExportBundle(deps: ExportDeps): Promise<ExportBundle> {
  const [checkIns, limits, copingStrategies] = await Promise.all([
    deps.checkInRepo.listByUser(deps.userId),
    deps.limitRepo.listByUser(deps.userId),
    deps.copingStrategyRepo.listByUser(deps.userId),
  ])

  return {
    checkIns: [...checkIns].sort((a, b) => a.behaviorDate.localeCompare(b.behaviorDate)),
    limits: [...limits].sort((a, b) => a.weekNo - b.weekNo),
    copingStrategies: [...copingStrategies].sort((a, b) => a.priority - b.priority),
  }
}
