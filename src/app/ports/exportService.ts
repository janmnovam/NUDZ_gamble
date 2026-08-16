/**
 * ExportService — inbound (driving) port. Wiring stub: the contract follows
 * docs/architecture.md §ExportService. The return is a concrete CSV string;
 * the person-day row derivation is TODO.
 */
export interface ExportService {
  /** Person-day CSV, one row per study day 1–28 (see spec Příloha 2). */
  exportPersonDaysCsv(): Promise<string>
}
