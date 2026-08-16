/**
 * ExportService wiring stub. Reads every source record to build the person-day
 * CSV (spec Příloha 2); row derivation is TODO. See
 * docs/architecture.md §ExportService.
 */
import type { ExportService } from '@/app/ports/exportService.ts'
import type {
  CheckInRepository,
  LimitRepository,
  ProfileRepository,
  ReviewRepository,
} from '@domain/ports.ts'

export interface ExportServiceDeps {
  profiles: ProfileRepository
  limits: LimitRepository
  checkIns: CheckInRepository
  reviews: ReviewRepository
}

export class ExportServiceImpl implements ExportService {
  protected readonly deps: ExportServiceDeps

  constructor(deps: ExportServiceDeps) {
    this.deps = deps
  }

  exportPersonDaysCsv(): Promise<string> {
    return Promise.reject(
      new Error('ExportService.exportPersonDaysCsv: not implemented (wiring only)'),
    )
  }
}
