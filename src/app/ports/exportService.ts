/**
 * ExportService — inbound (driving) port. Contract follows
 * docs/architecture.md §ExportService / README's "Exporting data from app".
 * Table fetch + sort lives in `@domain/export.ts` (`buildExportBundle`);
 * CSV text formatting lives in `@/app/mappers/exportMapper.ts`; ZIP
 * bundling lives in `@/app/lib/zip.ts` (`createZip`) — this port's return
 * is the finished archive, ready for the UI to hand to the browser's
 * download mechanism.
 */
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export interface ExportService {
  /** CHECK_IN, LIMIT and COPING_STRATEGY, each as a CSV file, bundled into one ZIP archive. */
  exportDataZip(userId: UserId, time: ISOTimestamp): Promise<Uint8Array>
}
