/**
 * Concrete ExportService. Wraps `buildExportBundle` (`@domain/export.ts`),
 * formats each table via `@/app/mappers/exportMapper.ts`, and bundles the
 * three CSVs into one ZIP via `createZip` (`@/app/lib/zip.ts`). See
 * docs/architecture.md §ExportService.
 */
import type { ExportService } from '@/app/ports/exportService.ts'
import {
  toCheckInCsv,
  toCopingStrategyCsv,
  toLimitCsv,
  toProfileCsv,
} from '@/app/mappers/exportMapper.ts'
import { createZip } from '@/app/lib/zip.ts'
import { buildExportBundle } from '@domain/export.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type {
  CheckInRepository,
  CopingStrategyRepository,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

export interface ExportServiceDeps {
  profiles: ProfileRepository
  checkIns: CheckInRepository
  limits: LimitRepository
  copingStrategies: CopingStrategyRepository
}

const encoder = new TextEncoder()

export class ExportServiceImpl implements ExportService {
  private readonly deps: ExportServiceDeps

  constructor(deps: ExportServiceDeps) {
    this.deps = deps
  }

  async exportDataZip(userId: UserId, _time: ISOTimestamp): Promise<Uint8Array> {
    const bundle = await buildExportBundle({
      userId,
      profileRepo: this.deps.profiles,
      checkInRepo: this.deps.checkIns,
      limitRepo: this.deps.limits,
      copingStrategyRepo: this.deps.copingStrategies,
    })

    return createZip([
      { name: 'profile.csv', data: encoder.encode(toProfileCsv(bundle.profile)) },
      { name: 'check_in.csv', data: encoder.encode(toCheckInCsv(bundle.checkIns)) },
      { name: 'limit.csv', data: encoder.encode(toLimitCsv(bundle.limits)) },
      {
        name: 'coping_strategy.csv',
        data: encoder.encode(toCopingStrategyCsv(bundle.copingStrategies)),
      },
    ])
  }
}
