/**
 * DashboardService — inbound (driving) port. Wiring stub: the contract follows
 * docs/architecture.md §DashboardService (`buildDashboardVM` already exists in
 * `@domain/dashboard.ts`), but the DTO shape is a placeholder until the service
 * wrapper is implemented.
 */
// TODO(app): replace with the documented shape when DashboardService is built.
export type DashboardResponse = Record<string, unknown>

export interface DashboardService {
  /** Cumulative weekly evaluation vs both limits, missing days surfaced. */
  getDashboard(): Promise<DashboardResponse>
}
