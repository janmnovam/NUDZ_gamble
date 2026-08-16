/**
 * Concrete ExportService. Wraps `buildExportBundle` (`@domain/export.ts`),
 * formats each table via `@/app/mappers/exportMapper.ts`, and bundles the
 * three CSVs into one ZIP via `createZip` (`@/app/lib/zip.ts`). See
 * docs/architecture.md §ExportService.
 */
import type { ExportService } from '@/app/ports/exportService.ts'
import { DEMO_USER_ID } from '@/app/constants.ts'
import { toCheckInCsv, toCopingStrategyCsv, toLimitCsv } from '@/app/mappers/exportMapper.ts'
import { createZip } from '@/app/lib/zip.ts'
import { buildExportBundle } from '@domain/export.ts'
import type { UserId } from '@domain/model.ts'
import type { CheckInRepository, CopingStrategyRepository, LimitRepository } from '@domain/ports.ts'

export interface ExportServiceDeps {
  checkIns: CheckInRepository
  limits: LimitRepository
  copingStrategies: CopingStrategyRepository
  /** The single demo user these records belong to. */
  userId?: UserId
}

const encoder = new TextEncoder()

export class ExportServiceImpl implements ExportService {
  private readonly deps: ExportServiceDeps
  private readonly userId: UserId

  constructor(deps: ExportServiceDeps) {
    this.deps = deps
    this.userId = deps.userId ?? DEMO_USER_ID
  }

  async exportDataZip(): Promise<Uint8Array> {
    const bundle = await buildExportBundle({
      userId: this.userId,
      checkInRepo: this.deps.checkIns,
      limitRepo: this.deps.limits,
      copingStrategyRepo: this.deps.copingStrategies,
    })

    return createZip([
      { name: 'check_in.csv', data: encoder.encode(toCheckInCsv(bundle.checkIns)) },
      { name: 'limit.csv', data: encoder.encode(toLimitCsv(bundle.limits)) },
      {
        name: 'coping_strategy.csv',
        data: encoder.encode(toCopingStrategyCsv(bundle.copingStrategies)),
      },
    ])
  }
}
