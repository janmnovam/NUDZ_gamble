# AdminService (Drop Data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a proper `AdminService` whose only capability, for now, is dropping all data from the database — replacing the dev-only `resetDb()` hack with a hexagonal service that goes through ports.

**Architecture:** New outbound port `DatabaseAdmin` (with a single `DatabaseAdminAdapter` that clears `db.tables` generically — the one place inside `@data` where touching Dexie directly is legitimate) and new inbound port `AdminService` (whose impl depends only on `DatabaseAdmin`). Wired through the existing `createDataLayer()` / `createApp()` composition roots. The dev `seedScenario` keeps working by clearing through the new port; the `resetDb`/`__resetDb` reset half of `src/dev` is removed.

**Tech Stack:** TypeScript, Dexie (IndexedDB), Jest (`fake-indexeddb`). Hexagonal ports & adapters.

**Spec:** None as a separate doc — requirements were brainstormed 2026-08-16 and are captured in "Context & Decisions" below. Domain rules and the "seed data + reset/demo mode" jury requirement come from [CLAUDE.md](../../../CLAUDE.md).

## Global Constraints

- `npm run check` (typecheck + type-aware ESLint + Prettier + Jest) is the CI gate and must pass before every commit. `npm run lint:fix` / `npm run format` autofix most style issues.
- ESLint `no-restricted-imports`: `src/domain/**` must NOT import react/dexie/zustand/`@ui`/`@data`. The new domain port adds only a pure interface (no imports) — keep it that way.
- New identifiers use **camelCase**.
- Adapters import the database via the relative `'../db'` / `'../repository'` paths, matching every existing adapter.
- Frontend is out of scope — do not touch `src/ui/**`.

## Context & Decisions (brainstormed 2026-08-16)

- **Removal scope:** Remove only the reset half of `src/dev` (`resetDb` export + `__resetDb` window binding). Keep `seedScenario` / `__seed` — it is the seed mechanism CLAUDE.md marks as a graded jury must-have.
- **Data access:** Through ports. The app-layer `AdminService` never touches `db` directly; it depends on the `DatabaseAdmin` outbound port.
- **Drop scope:** Every table (all 8), matching today's `resetDb` behavior — including the global `contacts` help-line directory. No per-table curation.
- **Why a dedicated `DatabaseAdmin` port** rather than adding `clear()` to all 9 domain repository interfaces: the domain ports (`ProfileRepository`, etc.) are narrow hand-written interfaces that do not extend the generic `Repository<T>`, and adapters keep their `DexieRepository` private. One admin port + one adapter is the smaller, cleaner change and keeps the generic table-wipe in a single place.

## File Structure

- Create: `src/data/adapters/databaseAdminAdapter.ts` — outbound adapter, clears every Dexie table.
- Create: `src/app/ports/adminService.ts` — inbound port interface.
- Create: `src/app/services/adminServiceImpl.ts` — inbound service impl, depends on `DatabaseAdmin`.
- Create: `tests/jest/data/databaseAdminAdapter.test.ts` — adapter wipes all tables.
- Create: `tests/jest/app/adminService.test.ts` — service unit (fake port) + integration (via `createApp`).
- Modify: `src/domain/ports.ts` — add `DatabaseAdmin` interface.
- Modify: `src/core/index.ts` — add `databaseAdmin` to `DataLayer` + `createDataLayer`; export `AdminService` type.
- Modify: `src/core/app.ts` — add `admin` to `App` + wire `AdminServiceImpl`.
- Modify: `src/dev/seed.ts` — remove `resetDb`; `seedScenario` clears via `data.databaseAdmin.clearAll()`.
- Modify: `src/dev/devTools.ts` — remove `__resetDb`; keep `__seed`.

---

### Task 1: Outbound `DatabaseAdmin` port + adapter + data-layer wiring

**Files:**
- Modify: `src/domain/ports.ts` (append after `UsageEventRepository`, ~line 80)
- Create: `src/data/adapters/databaseAdminAdapter.ts`
- Modify: `src/core/index.ts:41-66` (`createDataLayer` + `DataLayer`)
- Test: `tests/jest/data/databaseAdminAdapter.test.ts`

**Interfaces:**
- Consumes: `AppDatabase` from `@data/db.ts` (has `tables: Table[]`, per Dexie).
- Produces:
  - `interface DatabaseAdmin { clearAll(): Promise<void> }` (in `@domain/ports.ts`)
  - `class DatabaseAdminAdapter implements DatabaseAdmin` (ctor `(db: AppDatabase)`)
  - `DataLayer.databaseAdmin: DatabaseAdmin`

- [ ] **Step 1: Write the failing test**

Create `tests/jest/data/databaseAdminAdapter.test.ts`:

```typescript
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('DatabaseAdminAdapter.clearAll', () => {
  it('wipes every table', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)

    // Seed a couple of tables directly so we have something to wipe.
    await data.profiles.save({
      userId: 'demo-user',
      onboardingCompletedAt: '2026-08-01T21:00:00.000Z',
      interventionStartDate: '2026-08-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10000,
    })
    await data.contacts.seed()
    expect(await db.profile.count()).toBe(1)
    expect(await db.contacts.count()).toBeGreaterThan(0)

    await data.databaseAdmin.clearAll()

    for (const table of db.tables) {
      expect(await table.count()).toBe(0)
    }

    db.close()
    await db.delete()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/jest/data/databaseAdminAdapter.test.ts`
Expected: FAIL — `data.databaseAdmin` is undefined (property does not exist on `DataLayer`).

- [ ] **Step 3: Add the `DatabaseAdmin` port**

In `src/domain/ports.ts`, append after the `UsageEventRepository` interface:

```typescript
/**
 * Administrative outbound port. Destructive, coarse-grained maintenance
 * operations over the whole store — not per-entity CRUD. Backed by a single
 * adapter that reaches straight into the database; no domain objects cross it.
 */
export interface DatabaseAdmin {
  /** Wipes every table. Irreversible; admin/dev use only. */
  clearAll(): Promise<void>
}
```

- [ ] **Step 4: Create the adapter**

Create `src/data/adapters/databaseAdminAdapter.ts`:

```typescript
import type { DatabaseAdmin } from '@domain/ports.ts'

import { type AppDatabase } from '../db'

/**
 * Clears every store in one shot. This is the one adapter allowed to reach
 * past a single table into `db.tables` — a whole-database wipe has no
 * per-entity meaning. Mirrors the old dev `resetDb()`, now behind a port.
 */
export class DatabaseAdminAdapter implements DatabaseAdmin {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async clearAll(): Promise<void> {
    await Promise.all(this.db.tables.map((table) => table.clear()))
  }
}
```

- [ ] **Step 5: Wire it into the data layer**

In `src/core/index.ts`:

1. Add the adapter import alongside the other adapter imports (after `UsageEventAdapter`):

```typescript
import { DatabaseAdminAdapter } from '@data/adapters/databaseAdminAdapter.ts'
```

2. Add the port to the type import from `@domain/ports.ts`:

```typescript
  UsageEventRepository,
  DatabaseAdmin,
```

3. Add the entry to the object returned by `createDataLayer` (after `reviews`):

```typescript
    reviews: new ReviewAdapter(database),
    databaseAdmin: new DatabaseAdminAdapter(database),
```

4. Add the field to the `DataLayer` interface (after `reviews`):

```typescript
  reviews: ReviewRepository
  databaseAdmin: DatabaseAdmin
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest tests/jest/data/databaseAdminAdapter.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/ports.ts src/data/adapters/databaseAdminAdapter.ts src/core/index.ts tests/jest/data/databaseAdminAdapter.test.ts
git commit -m "feat(data): add DatabaseAdmin port + adapter for whole-DB wipe"
```

---

### Task 2: Inbound `AdminService` port + impl + app wiring

**Files:**
- Create: `src/app/ports/adminService.ts`
- Create: `src/app/services/adminServiceImpl.ts`
- Modify: `src/core/app.ts:33-84` (`App` + `createApp`)
- Modify: `src/core/index.ts` (export `AdminService` type)
- Test: `tests/jest/app/adminService.test.ts`

**Interfaces:**
- Consumes: `DatabaseAdmin` (from Task 1), `DataLayer.databaseAdmin` (from Task 1).
- Produces:
  - `interface AdminService { dropAllData(): Promise<void> }`
  - `class AdminServiceImpl implements AdminService` (ctor deps `{ databaseAdmin: DatabaseAdmin }`)
  - `App.admin: AdminService`

- [ ] **Step 1: Write the failing test**

Create `tests/jest/app/adminService.test.ts`:

```typescript
import { jest } from '@jest/globals'

import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import { AppDatabase, createApp, createDataLayer, type DataLayer } from '@/core'
import type { DatabaseAdmin } from '@domain/ports.ts'

describe('AdminServiceImpl.dropAllData', () => {
  it('delegates to the DatabaseAdmin port', async () => {
    const clearAll = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const databaseAdmin = { clearAll } as unknown as DatabaseAdmin
    const service = new AdminServiceImpl({ databaseAdmin })

    await service.dropAllData()

    expect(clearAll).toHaveBeenCalledTimes(1)
  })

  it('wipes every table when wired through createApp', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const app = createApp(data)

    await data.profiles.save({
      userId: 'demo-user',
      onboardingCompletedAt: '2026-08-01T21:00:00.000Z',
      interventionStartDate: '2026-08-02T00:00:00.000Z',
      referenceTimeMin: 600,
      referenceStakesCzk: 10000,
    })
    expect(await db.profile.count()).toBe(1)

    await app.admin.dropAllData()

    for (const table of db.tables) {
      expect(await table.count()).toBe(0)
    }

    db.close()
    await db.delete()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/jest/app/adminService.test.ts`
Expected: FAIL — `@/app/services/adminServiceImpl.ts` does not exist (module not found).

- [ ] **Step 3: Create the inbound port**

Create `src/app/ports/adminService.ts`:

```typescript
/**
 * AdminService — the inbound (driving) port for administrative operations.
 * For now it holds a single capability: dropping all data from the database.
 * Destructive and irreversible; intended for admin/demo-reset flows only.
 */
export interface AdminService {
  /** Drops all data from the database (every table). Irreversible. */
  dropAllData(): Promise<void>
}
```

- [ ] **Step 4: Create the service impl**

Create `src/app/services/adminServiceImpl.ts`:

```typescript
/**
 * Concrete AdminService. A thin wrapper over the outbound `DatabaseAdmin`
 * port — no domain logic to do here; a wipe is a wipe. Kept as its own
 * service so the destructive path has an explicit, testable inbound seam.
 */
import type { AdminService } from '@/app/ports/adminService.ts'
import type { DatabaseAdmin } from '@domain/ports.ts'

export interface AdminServiceDeps {
  databaseAdmin: DatabaseAdmin
}

export class AdminServiceImpl implements AdminService {
  private readonly deps: AdminServiceDeps

  constructor(deps: AdminServiceDeps) {
    this.deps = deps
  }

  async dropAllData(): Promise<void> {
    await this.deps.databaseAdmin.clearAll()
  }
}
```

- [ ] **Step 5: Wire it into `createApp`**

In `src/core/app.ts`:

1. Add imports (after the `ExportServiceImpl` / `ExportService` imports):

```typescript
import { AdminServiceImpl } from '@/app/services/adminServiceImpl.ts'
import type { AdminService } from '@/app/ports/adminService.ts'
```

2. Add the field to the `App` interface (after `export`):

```typescript
  export: ExportService
  admin: AdminService
```

3. Add the wiring to the object returned by `createApp` (after the `export:` entry):

```typescript
    export: new ExportServiceImpl({
      profiles: data.profiles,
      checkIns: data.checkIns,
      limits: data.limits,
      copingStrategies: data.copingStrategies,
    }),
    admin: new AdminServiceImpl({ databaseAdmin: data.databaseAdmin }),
```

- [ ] **Step 6: Export the `AdminService` type**

In `src/core/index.ts`, add after the other service-type re-exports (after `ExportService`):

```typescript
export type { AdminService } from '@/app/ports/adminService.ts'
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx jest tests/jest/app/adminService.test.ts`
Expected: PASS (both cases).

- [ ] **Step 8: Commit**

```bash
git add src/app/ports/adminService.ts src/app/services/adminServiceImpl.ts src/core/app.ts src/core/index.ts tests/jest/app/adminService.test.ts
git commit -m "feat(app): add AdminService.dropAllData wired through DatabaseAdmin"
```

---

### Task 3: Retire the `resetDb` reset half of `src/dev`

**Files:**
- Modify: `src/dev/seed.ts:67-76` (remove `resetDb`; `seedScenario` clears via the port)
- Modify: `src/dev/devTools.ts` (remove `__resetDb`; keep `__seed`)

**Interfaces:**
- Consumes: `DataLayer.databaseAdmin` (from Task 1) via `createDataLayer()`.
- Produces: nothing new. `resetDb` and `window.__resetDb` cease to exist; `seedScenario` / `window.__seed` keep their signatures.

- [ ] **Step 1: Point `seedScenario` at the new drop and delete `resetDb`**

In `src/dev/seed.ts`, replace the `resetDb` function and the top of `seedScenario`:

Delete this block (currently ~lines 67-71):

```typescript
/** Clears every table so a scenario always starts from empty. */
export async function resetDb(): Promise<void> {
  const { db } = await import('@data/db.ts')
  await Promise.all(db.tables.map((table) => table.clear()))
}
```

And change the start of `seedScenario` from:

```typescript
export async function seedScenario(scenario: Scenario): Promise<void> {
  await resetDb()
  const data = createDataLayer()
```

to:

```typescript
export async function seedScenario(scenario: Scenario): Promise<void> {
  const data = createDataLayer()
  await data.databaseAdmin.clearAll()
```

Also update the module docstring's mention of `__resetDb` (~line 2) to drop the reset reference — change:

```typescript
 * Dev-only DB seeding, wired to `window.__seed` / `window.__resetDb` from
 * `main.tsx` behind `import.meta.env.DEV`. Never bundled into a production
```

to:

```typescript
 * Dev-only DB seeding, wired to `window.__seed` from `main.tsx` behind
 * `import.meta.env.DEV`. Never bundled into a production
```

- [ ] **Step 2: Remove `__resetDb` from the dev tools**

Replace the entire contents of `src/dev/devTools.ts` with:

```typescript
/**
 * Exposes the dev seeding helper (`src/dev/seed.ts`) on `window` so a
 * scenario can be loaded from the browser console — `await __seed({...})` —
 * without shipping any dev UI. Call `install()` once, guarded by
 * `import.meta.env.DEV` (see `main.tsx`); a no-op, tree-shaken away in
 * production builds. To wipe the DB, seed an empty scenario or call the
 * AdminService (`createApp().admin.dropAllData()`).
 */
import { seedScenario, type Scenario } from '@/dev/seed.ts'

declare global {
  interface Window {
    __seed: (scenario: Scenario) => Promise<void>
  }
}

export function install(): void {
  window.__seed = seedScenario
  console.info('[dev] __seed(scenario) available — reload after calling it.')
}
```

- [ ] **Step 3: Verify nothing still references the removed symbols**

Run:

```bash
grep -rn "resetDb\|__resetDb" src tests
```

Expected: no matches (every reference removed). If the docstring edit in Step 1 left a stray mention, remove it.

- [ ] **Step 4: Run the full CI gate**

Run: `npm run check`
Expected: PASS — typecheck confirms no dangling import of the deleted `resetDb`, ESLint/Prettier clean, all Jest tests (including the two new suites) green.

> Note: `seedScenario` uses the shared default DB (no injectable `db` param) and is dev-only, never bundled — so it has no dedicated Jest test, by design. `npm run check` (typecheck across the removed export) plus the Step 3 grep are the verification here. Add when: seed grows logic worth asserting or gains a `db` param.

- [ ] **Step 5: Commit**

```bash
git add src/dev/seed.ts src/dev/devTools.ts
git commit -m "refactor(dev): drop resetDb; seedScenario clears via AdminService port"
```

---

## Self-Review

**1. Spec coverage** (against Context & Decisions):
- AdminService that only drops data → Tasks 1+2 (`AdminService.dropAllData` → `DatabaseAdmin.clearAll`). ✅
- Through ports, app layer never touches `db` → `AdminServiceImpl` depends only on `DatabaseAdmin`; the sole `db.tables` access is inside `DatabaseAdminAdapter` (in `@data`). ✅
- Every table wiped → adapter clears `db.tables` (all 8). ✅
- Remove only the reset half of `src/dev`, keep seed → Task 3 deletes `resetDb`/`__resetDb`, keeps `seedScenario`/`__seed` (jury seed requirement preserved). ✅

**2. Placeholder scan:** No TBD/"handle edge cases"/"similar to". Every code step has full code. ✅

**3. Type consistency:** `DatabaseAdmin.clearAll()` (port) ← `DatabaseAdminAdapter.clearAll()` (adapter) ← `DataLayer.databaseAdmin` (Task 1) ← `AdminServiceImpl` deps `{ databaseAdmin }` → `AdminService.dropAllData()` (Task 2) → `App.admin` → `app.admin.dropAllData()` (Task 3 & tests). Names match across all tasks. ✅
