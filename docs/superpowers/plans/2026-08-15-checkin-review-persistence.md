# Check-In & Review Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the check-in write path (repository + adapter + domain service) and the review repository — the next three DRAFT items on the hexagon after OnboardingService, following the exact patterns the DONE Profile/Limit/Coping/Onboarding code already established.

**Architecture:** Hexagonal (ports & adapters). Outbound ports are interfaces in `src/domain/ports.ts`; Dexie adapters in `src/data/adapters/` implement them over the generic `DexieRepository`; the composition root `src/core/index.ts` wires them into `DataLayer`. Domain services are pure functions in `src/domain/` that take a `deps` bag (repo + injected `now`/`newId`) — never importing Dexie/React. The `src/domain/checkin.ts` file already declares the type signatures; this plan implements them.

**Tech Stack:** TypeScript, Dexie (IndexedDB), Jest + fake-indexeddb (`tests/jest/`), path aliases `@domain/*` `@data/*` `@/core`.

**Spec:** `docs/architecture.md` (port table + DTOs) and `CLAUDE.md` (domain rules). Field names are verbatim from `src/domain/model.ts` / `src/data/model.ts`.

## Global Constraints

- **Domain purity (lint gate):** `src/domain/**` must NOT import react/dexie/zustand/`@ui`/`@data`. Inject time (`now: () => ISOTimestamp`) and id (`newId: () => string`) — never call `new Date()`, `Date.now()`, or `crypto.randomUUID()` in domain code. Entities are shared via `@domain/model.ts` only.
- **Money = integer CZK, time = integer minutes, timestamps = ISO 8601.** Limit tracks **stakes only**; winnings never affect it.
- **Missing ≠ no-play:** a no-play day is a real record (`played=false`, zeros); a missing day has no record at all. Never conflate.
- **Derived, never stored:** cumulative totals / status / remaining are computed from source records + limit history — do not persist them on the check-in.
- **CI gate:** `npm run check` (typecheck + ESLint + Prettier + Jest) must pass before every commit.
- **Run a single test file:** `npm test -- <pattern>` (Jest name filter, e.g. `npm test -- checkin`).

---

## File Structure

**Item 1 — CheckInRepository + adapter (data):**
- Modify: `src/domain/ports.ts` — add `CheckInRepository` interface.
- Create: `src/data/adapters/checkInAdapter.ts` — `CheckInAdapter implements CheckInRepository`.
- Modify: `src/core/index.ts` — add `checkIns` to `DataLayer` + `createDataLayer`.
- Test: `tests/jest/data/checkin-adapter.test.ts`.

**Item 2 — CheckInService (domain write path):**
- Modify: `src/domain/checkin.ts` — implement `validateCheckIn`, `buildCheckInRecord`, `isBackfill`, `dayStateOf`, and the `recordCheckIn` service.
- Test: `tests/jest/domain/checkin.test.ts`.

**Item 3 — ReviewRepository + adapter (data):**
- Modify: `src/domain/ports.ts` — add `ReviewRepository` interface.
- Create: `src/data/adapters/reviewAdapter.ts` — `ReviewAdapter implements ReviewRepository`.
- Modify: `src/core/index.ts` — add `reviews` to `DataLayer` + `createDataLayer`.
- Test: `tests/jest/data/review-adapter.test.ts`.

---

## Task 1: CheckInRepository port + CheckInAdapter

**Files:**
- Modify: `src/domain/ports.ts`
- Create: `src/data/adapters/checkInAdapter.ts`
- Test: `tests/jest/data/checkin-adapter.test.ts`

**Interfaces:**
- Consumes: `CheckIn`, `UserId`, `ISODate` from `@domain/model.ts`; `DexieRepository` from `@data/repository.ts`; `AppDatabase`, `Repository` from `@data/db.ts` (the `check_ins` table already exists in `db.ts` with unique index `&[user_id+behavior_date]`).
- Produces:
  ```ts
  export interface CheckInRepository {
    /** Insert or replace, keyed on (user, behavior_date). Caller reuses an existing row's check_in_id. */
    upsert(checkIn: CheckIn): Promise<void>
    getByDate(userId: UserId, behaviorDate: ISODate): Promise<CheckIn | undefined>
    listByUser(userId: UserId): Promise<CheckIn[]>
    listByWeek(userId: UserId, weekNo: number): Promise<CheckIn[]>
  }
  ```

- [ ] **Step 1: Write the failing adapter test**

Create `tests/jest/data/checkin-adapter.test.ts`:

```ts
import { type CheckInEntity } from '@data/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('CheckInAdapter', () => {
  const FIXED_NOW = '2026-09-04T08:00:00.000Z'
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db, () => FIXED_NOW)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  const day3: CheckInEntity = {
    check_in_id: 'ci-1',
    user_id: 'A001',
    behavior_date: '2026-09-03',
    week_no: 1,
    played: true,
    time_min: 60,
    stakes_czk: 500,
    winnings_czk: 0,
    submitted_at: FIXED_NOW,
    updated_at: null,
  }

  it('upserts and reads a check-in by date', async () => {
    await data.checkIns.upsert(day3)
    await expect(data.checkIns.getByDate('A001', '2026-09-03')).resolves.toEqual(day3)
  })

  it('returns undefined for a date with no record', async () => {
    await expect(data.checkIns.getByDate('A001', '2026-09-02')).resolves.toBeUndefined()
  })

  it('replaces the row when upserting the same check_in_id (edit)', async () => {
    await data.checkIns.upsert(day3)
    await data.checkIns.upsert({ ...day3, time_min: 45, updated_at: FIXED_NOW })
    const reloaded = await data.checkIns.getByDate('A001', '2026-09-03')
    expect(reloaded?.time_min).toBe(45)
    expect(reloaded?.updated_at).toBe(FIXED_NOW)
    expect(await data.checkIns.listByUser('A001')).toHaveLength(1)
  })

  it('rejects a second row for the same (user, date) with a new id', async () => {
    await data.checkIns.upsert(day3)
    await expect(data.checkIns.upsert({ ...day3, check_in_id: 'ci-2' })).rejects.toThrow()
  })

  it('lists a week sorted by behavior_date', async () => {
    await data.checkIns.upsert({ ...day3, check_in_id: 'ci-a', behavior_date: '2026-09-05' })
    await data.checkIns.upsert({ ...day3, check_in_id: 'ci-b', behavior_date: '2026-09-03' })
    await data.checkIns.upsert({ ...day3, check_in_id: 'ci-c', behavior_date: '2026-09-10', week_no: 2 })
    const week1 = await data.checkIns.listByWeek('A001', 1)
    expect(week1.map((c) => c.behavior_date)).toEqual(['2026-09-03', '2026-09-05'])
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- checkin-adapter`
Expected: FAIL — `data.checkIns` is undefined / `CheckInAdapter` not found.

- [ ] **Step 3: Add the `CheckInRepository` port**

In `src/domain/ports.ts`, extend the model import and append the interface:

```ts
// add CheckIn, ISODate to the existing import from '@domain/model.ts'
import type {
  CheckIn,
  CopingStrategy,
  CopingStrategyDefault,
  CopingStrategyInput,
  ISODate,
  ISOTimestamp,
  Limit,
  Profile,
  UserId,
} from '@domain/model.ts'

export interface CheckInRepository {
  /** Insert or replace, keyed on (user, behavior_date). Caller reuses an existing row's check_in_id so the unique index isn't tripped. */
  upsert(checkIn: CheckIn): Promise<void>
  getByDate(userId: UserId, behaviorDate: ISODate): Promise<CheckIn | undefined>
  listByUser(userId: UserId): Promise<CheckIn[]>
  listByWeek(userId: UserId, weekNo: number): Promise<CheckIn[]>
}
```

- [ ] **Step 4: Implement `CheckInAdapter`**

Create `src/data/adapters/checkInAdapter.ts` (mirrors `limitAdapter.ts`; uses the compound index via the repo's `table` escape hatch for `getByDate`):

```ts
import { type CheckInEntity } from '@data/model.ts'
import { type CheckInRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'
import type { CheckIn, ISODate, UserId } from '@domain/model.ts'

/**
 * Daily check-ins. `upsert` is a plain `put`: the domain reuses an existing
 * row's `check_in_id` on edit, so replacing by primary key never trips the
 * `&[user_id+behavior_date]` unique index. A *new* id for a day that already
 * has a row is rejected by that index (one check-in per day).
 */
export class CheckInAdapter implements CheckInRepository {
  private readonly repo: Repository<CheckInEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.check_ins)
  }

  async upsert(checkIn: CheckIn): Promise<void> {
    await this.repo.put(checkIn)
  }

  getByDate(userId: UserId, behaviorDate: ISODate): Promise<CheckIn | undefined> {
    return this.repo.table.where('[user_id+behavior_date]').equals([userId, behaviorDate]).first()
  }

  listByUser(userId: UserId): Promise<CheckIn[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'behavior_date' })
  }

  listByWeek(userId: UserId, weekNo: number): Promise<CheckIn[]> {
    return this.repo.query({
      where: { field: 'user_id', equals: userId },
      filter: (c) => c.week_no === weekNo,
      sortBy: 'behavior_date',
    })
  }
}
```

- [ ] **Step 5: Wire `checkIns` into the composition root**

In `src/core/index.ts`: import the adapter and the port type, add the field to `createDataLayer`'s return and to the `DataLayer` interface.

```ts
import { CheckInAdapter } from '@data/adapters/checkInAdapter.ts'
// add CheckInRepository to the existing '@domain/ports.ts' type import
```

In the `createDataLayer` return object add:
```ts
    checkIns: new CheckInAdapter(database),
```

In the `DataLayer` interface add:
```ts
  checkIns: CheckInRepository
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `npm test -- checkin-adapter`
Expected: PASS (5 tests).

- [ ] **Step 7: Full gate + commit**

```bash
npm run check
git add src/domain/ports.ts src/data/adapters/checkInAdapter.ts src/core/index.ts tests/jest/data/checkin-adapter.test.ts
git commit -m "feat(data): CheckInRepository port + CheckInAdapter"
```

---

## Task 2: CheckIn domain — validation, record builder, day-state, `recordCheckIn` service

**Scope note (read before coding):** The architecture doc's `CheckInResult` (status / remaining / coping_reminder feedback) is deliberately **NOT** built here. That feedback is the same cumulative weekly evaluation the DashboardService (plan item #4) produces; building it twice would duplicate the status classifier. This task delivers the **write path only** — validate, build, upsert — and returns the persisted `CheckIn`. Item #4 adds the shared `evaluateWeek` both screens consume.

**Also:** "closed weeks cannot be edited" needs no `ReviewRepository` here. `validateCheckIn` restricts `behavior_date` to the current week (`>= week_first_day`) and to `< today`; the caller always passes the *current* week's first day, so a closed week's date is rejected by date validation alone. That's why the doc lists no ReviewRepository dependency for CheckInService.

**Files:**
- Modify: `src/domain/checkin.ts` (implement the existing type stubs + add the service)
- Test: `tests/jest/domain/checkin.test.ts`

**Interfaces:**
- Consumes: `CheckIn`, `ISODate`, `ISOTimestamp`, `UserId` from `@domain/model.ts`; `nextDate` from `@domain/clock.ts`; `CheckInRepository` from `@domain/ports.ts` (Task 1).
- Produces (implemented signatures — these refine the type-only stubs already in the file):
  ```ts
  export function validateCheckIn(draft: CheckInDraft, context: { today: ISODate; week_first_day: ISODate }): CheckInValidation
  export function buildCheckInRecord(params: { user_id: UserId; draft: CheckInDraft; week_no: number; now: ISOTimestamp; newId: () => string; existing?: CheckIn }): CheckIn
  export function isBackfill(behavior_date: ISODate, submitted_at: ISOTimestamp): boolean
  export function dayStateOf(params: { behavior_date: ISODate; today: ISODate; check_in: CheckIn | undefined }): DayState
  export interface RecordCheckInInput { user_id: UserId; week_no: number; draft: CheckInDraft; context: { today: ISODate; week_first_day: ISODate } }
  export interface RecordCheckInDeps { checkIns: CheckInRepository; now: () => ISOTimestamp; newId: () => string }
  export function recordCheckIn(input: RecordCheckInInput, deps: RecordCheckInDeps): Promise<CheckIn>
  ```

- [ ] **Step 1: Write failing tests for `validateCheckIn`**

Create `tests/jest/domain/checkin.test.ts`:

```ts
import type { CheckIn } from '@domain/model.ts'
import {
  buildCheckInRecord,
  dayStateOf,
  isBackfill,
  recordCheckIn,
  validateCheckIn,
} from '@domain/checkin.ts'
import type { CheckInDraft, RecordCheckInDeps } from '@domain/checkin.ts'

const ctx = { today: '2026-09-04', week_first_day: '2026-09-01' }
const playedDraft: CheckInDraft = {
  behavior_date: '2026-09-03',
  played: true,
  time_min: 60,
  stakes_czk: 500,
  winnings_czk: 0,
}

describe('validateCheckIn', () => {
  it('accepts a valid played day in the current week', () => {
    expect(validateCheckIn(playedDraft, ctx)).toEqual({ valid: true })
  })

  it('accepts a no-play day with all zeros', () => {
    const d: CheckInDraft = { ...playedDraft, played: false, time_min: 0, stakes_czk: 0, winnings_czk: 0 }
    expect(validateCheckIn(d, ctx)).toEqual({ valid: true })
  })

  it('rejects a no-play day carrying non-zero values', () => {
    const d: CheckInDraft = { ...playedDraft, played: false }
    const r = validateCheckIn(d, ctx)
    expect(r.valid).toBe(false)
  })

  it('rejects negative or non-integer numbers on a played day', () => {
    expect(validateCheckIn({ ...playedDraft, stakes_czk: -1 }, ctx).valid).toBe(false)
    expect(validateCheckIn({ ...playedDraft, time_min: 1.5 }, ctx).valid).toBe(false)
  })

  it('rejects today or a future date (must be <= today - 1)', () => {
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-09-04' }, ctx).valid).toBe(false)
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-09-05' }, ctx).valid).toBe(false)
  })

  it('rejects a date before the current week (closed-week guard falls out of this)', () => {
    expect(validateCheckIn({ ...playedDraft, behavior_date: '2026-08-31' }, ctx).valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- domain/checkin`
Expected: FAIL — `validateCheckIn` is not exported as a value (it's a type stub).

- [ ] **Step 3: Implement `validateCheckIn`**

In `src/domain/checkin.ts`, replace the `ValidateCheckIn` type stub area by adding the implementation (keep the existing type exports; implement functions below them). ISO dates compare correctly with `<`/`>=` as strings.

```ts
function isNonNegInt(n: number): boolean {
  return Number.isInteger(n) && n >= 0
}

export function validateCheckIn(
  draft: CheckInDraft,
  context: { today: ISODate; week_first_day: ISODate },
): CheckInValidation {
  const errors: CheckInFieldError[] = []

  if (!draft.played) {
    for (const field of ['time_min', 'stakes_czk', 'winnings_czk'] as const) {
      if (draft[field] !== 0) {
        errors.push({ field, message: 'no-play day must be zero' })
      }
    }
  } else {
    for (const field of ['time_min', 'stakes_czk', 'winnings_czk'] as const) {
      if (!isNonNegInt(draft[field])) {
        errors.push({ field, message: 'must be a whole number ≥ 0' })
      }
    }
  }

  if (draft.behavior_date >= context.today) {
    errors.push({ field: 'behavior_date', message: 'must be yesterday or earlier' })
  } else if (draft.behavior_date < context.week_first_day) {
    errors.push({ field: 'behavior_date', message: 'outside the current week' })
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
```

- [ ] **Step 4: Run to confirm validation passes**

Run: `npm test -- domain/checkin`
Expected: PASS for the `validateCheckIn` block (other blocks still fail — not yet implemented).

- [ ] **Step 5: Write failing tests for builder, backfill, day-state, service**

Append to `tests/jest/domain/checkin.test.ts`:

```ts
describe('buildCheckInRecord', () => {
  it('builds a fresh record with a new id, played values, updated_at null', () => {
    const rec = buildCheckInRecord({
      user_id: 'A001', draft: playedDraft, week_no: 1, now: '2026-09-04T08:00:00.000Z', newId: () => 'ci-new',
    })
    expect(rec).toMatchObject({
      check_in_id: 'ci-new', user_id: 'A001', behavior_date: '2026-09-03', week_no: 1,
      played: true, time_min: 60, stakes_czk: 500, winnings_czk: 0,
      submitted_at: '2026-09-04T08:00:00.000Z', updated_at: null,
    })
  })

  it('forces zeros when played is false', () => {
    const rec = buildCheckInRecord({
      user_id: 'A001', draft: { ...playedDraft, played: false }, week_no: 1,
      now: '2026-09-04T08:00:00.000Z', newId: () => 'ci-x',
    })
    expect([rec.time_min, rec.stakes_czk, rec.winnings_czk]).toEqual([0, 0, 0])
  })

  it('on edit reuses id + original submitted_at and stamps updated_at', () => {
    const existing: CheckIn = {
      check_in_id: 'ci-1', user_id: 'A001', behavior_date: '2026-09-03', week_no: 1,
      played: true, time_min: 60, stakes_czk: 500, winnings_czk: 0,
      submitted_at: '2026-09-04T08:00:00.000Z', updated_at: null,
    }
    const rec = buildCheckInRecord({
      user_id: 'A001', draft: { ...playedDraft, time_min: 45 }, week_no: 1,
      now: '2026-09-05T09:00:00.000Z', newId: () => 'SHOULD-NOT-BE-USED', existing,
    })
    expect(rec.check_in_id).toBe('ci-1')
    expect(rec.submitted_at).toBe('2026-09-04T08:00:00.000Z')
    expect(rec.updated_at).toBe('2026-09-05T09:00:00.000Z')
    expect(rec.time_min).toBe(45)
  })
})

describe('isBackfill', () => {
  it('false when submitted the day after behavior_date', () => {
    expect(isBackfill('2026-09-03', '2026-09-04T08:00:00.000Z')).toBe(false)
  })
  it('true when submitted more than one day later', () => {
    expect(isBackfill('2026-09-03', '2026-09-05T08:00:00.000Z')).toBe(true)
  })
})

describe('dayStateOf', () => {
  const base = { behavior_date: '2026-09-03', today: '2026-09-04' }
  it('future when behavior_date is today or later', () => {
    expect(dayStateOf({ behavior_date: '2026-09-04', today: '2026-09-04', check_in: undefined })).toBe('future')
  })
  it('missing when past and no record', () => {
    expect(dayStateOf({ ...base, check_in: undefined })).toBe('missing')
  })
  it('completed when submitted next day', () => {
    const ci = { submitted_at: '2026-09-04T08:00:00.000Z' } as CheckIn
    expect(dayStateOf({ ...base, check_in: ci })).toBe('completed')
  })
  it('backfilled when submitted late', () => {
    const ci = { submitted_at: '2026-09-06T08:00:00.000Z' } as CheckIn
    expect(dayStateOf({ ...base, check_in: ci })).toBe('backfilled')
  })
})

describe('recordCheckIn', () => {
  function fakeDeps() {
    const store = new Map<string, CheckIn>()
    const deps: RecordCheckInDeps = {
      now: () => '2026-09-04T08:00:00.000Z',
      newId: () => 'ci-generated',
      checkIns: {
        upsert: (c) => { store.set(`${c.user_id}|${c.behavior_date}`, c); return Promise.resolve() },
        getByDate: (u, d) => Promise.resolve(store.get(`${u}|${d}`)),
        listByUser: () => Promise.resolve([...store.values()]),
        listByWeek: () => Promise.resolve([...store.values()]),
      },
    }
    return { deps, store }
  }

  it('validates, builds, and upserts a new record', async () => {
    const { deps, store } = fakeDeps()
    const rec = await recordCheckIn({ user_id: 'A001', week_no: 1, draft: playedDraft, context: ctx }, deps)
    expect(rec.check_in_id).toBe('ci-generated')
    expect(store.get('A001|2026-09-03')?.time_min).toBe(60)
  })

  it('edits an existing day: reuses id, sets updated_at', async () => {
    const { deps } = fakeDeps()
    await recordCheckIn({ user_id: 'A001', week_no: 1, draft: playedDraft, context: ctx }, deps)
    const edited = await recordCheckIn(
      { user_id: 'A001', week_no: 1, draft: { ...playedDraft, time_min: 30 }, context: ctx },
      deps,
    )
    expect(edited.check_in_id).toBe('ci-generated')
    expect(edited.updated_at).toBe('2026-09-04T08:00:00.000Z')
    expect(edited.time_min).toBe(30)
  })

  it('rejects an invalid draft and writes nothing', async () => {
    const { deps, store } = fakeDeps()
    await expect(
      recordCheckIn({ user_id: 'A001', week_no: 1, draft: { ...playedDraft, stakes_czk: -5 }, context: ctx }, deps),
    ).rejects.toThrow(/check-in/)
    expect(store.size).toBe(0)
  })
})
```

- [ ] **Step 6: Run to confirm the new blocks fail**

Run: `npm test -- domain/checkin`
Expected: FAIL — `buildCheckInRecord` / `isBackfill` / `dayStateOf` / `recordCheckIn` not exported as values.

- [ ] **Step 7: Implement builder, backfill, day-state, and the service**

Append to `src/domain/checkin.ts` (add `nextDate` and `CheckInRepository` imports at the top; the file currently imports only from `@domain/model.ts`):

```ts
import { nextDate } from '@domain/clock.ts'
import type { CheckInRepository } from '@domain/ports.ts'
```

```ts
export function buildCheckInRecord(params: {
  user_id: UserId
  draft: CheckInDraft
  week_no: number
  now: ISOTimestamp
  newId: () => string
  existing?: CheckIn
}): CheckIn {
  const { user_id, draft, week_no, now, newId, existing } = params
  const played = draft.played
  return {
    check_in_id: existing?.check_in_id ?? newId(),
    user_id,
    behavior_date: draft.behavior_date,
    week_no,
    played,
    time_min: played ? draft.time_min : 0,
    stakes_czk: played ? draft.stakes_czk : 0,
    winnings_czk: played ? draft.winnings_czk : 0,
    submitted_at: existing?.submitted_at ?? now,
    updated_at: existing ? now : null,
  }
}

/** Derived, never stored: submitted more than one calendar day after the behavior day. */
export function isBackfill(behavior_date: ISODate, submitted_at: ISOTimestamp): boolean {
  return submitted_at.slice(0, 10) > nextDate(behavior_date)
}

export function dayStateOf(params: {
  behavior_date: ISODate
  today: ISODate
  check_in: CheckIn | undefined
}): DayState {
  const { behavior_date, today, check_in } = params
  if (behavior_date >= today) return 'future'
  if (!check_in) return 'missing'
  return isBackfill(behavior_date, check_in.submitted_at) ? 'backfilled' : 'completed'
}

export interface RecordCheckInInput {
  user_id: UserId
  week_no: number
  draft: CheckInDraft
  context: { today: ISODate; week_first_day: ISODate }
}

export interface RecordCheckInDeps {
  checkIns: CheckInRepository
  now: () => ISOTimestamp
  newId: () => string
}

/**
 * The check-in use case — covers both first submit and later edit (upsert
 * semantics): validate the draft, reuse an existing day's record if present
 * (preserving submitted_at, stamping updated_at), and persist. Pure aside
 * from the injected repo/now/newId. Feedback (status/remaining) is produced
 * by the shared weekly evaluator, not here.
 */
export async function recordCheckIn(
  input: RecordCheckInInput,
  deps: RecordCheckInDeps,
): Promise<CheckIn> {
  const result = validateCheckIn(input.draft, input.context)
  if (!result.valid) {
    throw new Error(`check-in: invalid draft — ${result.errors.map((e) => e.field).join(', ')}`)
  }
  const existing = await deps.checkIns.getByDate(input.user_id, input.draft.behavior_date)
  const record = buildCheckInRecord({
    user_id: input.user_id,
    draft: input.draft,
    week_no: input.week_no,
    now: deps.now(),
    newId: deps.newId,
    existing,
  })
  await deps.checkIns.upsert(record)
  return record
}
```

Also remove the now-superseded type-only stubs that would collide (`ValidateCheckIn`, `SubmitCheckIn`, `IsBackfill`, `DayStateOf`) — the concrete functions replace them. Keep `CheckInDraft`, `CheckInFieldError`, `CheckInFieldErrorField`, `CheckInValidation`, `DayState`.

- [ ] **Step 8: Run to confirm all check-in domain tests pass**

Run: `npm test -- domain/checkin`
Expected: PASS (all blocks).

- [ ] **Step 9: Full gate + commit**

```bash
npm run check
git add src/domain/checkin.ts tests/jest/domain/checkin.test.ts
git commit -m "feat(domain): check-in validation, record builder, day-state + recordCheckIn service"
```

---

## Task 3: ReviewRepository port + ReviewAdapter

**Files:**
- Modify: `src/domain/ports.ts`
- Create: `src/data/adapters/reviewAdapter.ts`
- Modify: `src/core/index.ts`
- Test: `tests/jest/data/review-adapter.test.ts`

**Interfaces:**
- Consumes: `Review`, `UserId` from `@domain/model.ts`; `DexieRepository`, `AppDatabase`, `Repository` from `@data`. The `reviews` table already exists in `db.ts` with unique index `&[user_id+review_week_no]`.
- Produces:
  ```ts
  export interface ReviewRepository {
    /** Append-only: one review per (user, week); a duplicate week is rejected. */
    save(review: Review): Promise<void>
    getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined>
    listByUser(userId: UserId): Promise<Review[]>
  }
  ```

- [ ] **Step 1: Write the failing adapter test**

Create `tests/jest/data/review-adapter.test.ts`:

```ts
import { type ReviewEntity } from '@data/model.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'

describe('ReviewAdapter', () => {
  const FIXED_NOW = '2026-09-08T08:00:00.000Z'
  let db: AppDatabase
  let data: DataLayer

  beforeEach(() => {
    db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    data = createDataLayer(db, () => FIXED_NOW)
  })

  afterEach(async () => {
    db.close()
    await db.delete()
  })

  const week1: ReviewEntity = {
    review_id: 'rev-1',
    user_id: 'A001',
    review_week_no: 1,
    review_completed_at: FIXED_NOW,
    limit_changed: true,
    incomplete: false,
  }

  it('saves and reads a review by week', async () => {
    await data.reviews.save(week1)
    await expect(data.reviews.getByWeek('A001', 1)).resolves.toEqual(week1)
  })

  it('returns undefined for a week with no review', async () => {
    await expect(data.reviews.getByWeek('A001', 2)).resolves.toBeUndefined()
  })

  it('enforces one review per week (append-only)', async () => {
    await data.reviews.save(week1)
    await expect(data.reviews.save({ ...week1, review_id: 'rev-2' })).rejects.toThrow()
  })

  it('lists reviews by week ascending', async () => {
    await data.reviews.save(week1)
    await data.reviews.save({ ...week1, review_id: 'rev-2', review_week_no: 2 })
    const list = await data.reviews.listByUser('A001')
    expect(list.map((r) => r.review_week_no)).toEqual([1, 2])
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm test -- review-adapter`
Expected: FAIL — `data.reviews` undefined / `ReviewAdapter` not found.

- [ ] **Step 3: Add the `ReviewRepository` port**

In `src/domain/ports.ts` add `Review` to the model import and append:

```ts
export interface ReviewRepository {
  /** Append-only: one review per (user, week); a duplicate week is rejected by the unique index. */
  save(review: Review): Promise<void>
  getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined>
  listByUser(userId: UserId): Promise<Review[]>
}
```

- [ ] **Step 4: Implement `ReviewAdapter`**

Create `src/data/adapters/reviewAdapter.ts` (mirrors `limitAdapter.ts`):

```ts
import { type ReviewEntity } from '@data/model.ts'
import { type ReviewRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'
import type { Review, UserId } from '@domain/model.ts'

/**
 * Weekly reviews. Append-only: the `&[user_id+review_week_no]` unique index
 * rejects a second review for the same week (with a new review_id), so the
 * historical record per week is never overwritten.
 */
export class ReviewAdapter implements ReviewRepository {
  private readonly repo: Repository<ReviewEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.reviews)
  }

  async save(review: Review): Promise<void> {
    await this.repo.put(review)
  }

  getByWeek(userId: UserId, weekNo: number): Promise<Review | undefined> {
    return this.repo.table.where('[user_id+review_week_no]').equals([userId, weekNo]).first()
  }

  listByUser(userId: UserId): Promise<Review[]> {
    return this.repo.query({ where: { field: 'user_id', equals: userId }, sortBy: 'review_week_no' })
  }
}
```

- [ ] **Step 5: Wire `reviews` into the composition root**

In `src/core/index.ts`: import `ReviewAdapter`, add `ReviewRepository` to the ports type import, add `reviews: new ReviewAdapter(database)` to the `createDataLayer` return, and `reviews: ReviewRepository` to the `DataLayer` interface.

- [ ] **Step 6: Run to confirm it passes**

Run: `npm test -- review-adapter`
Expected: PASS (4 tests).

- [ ] **Step 7: Full gate + commit**

```bash
npm run check
git add src/domain/ports.ts src/data/adapters/reviewAdapter.ts src/core/index.ts tests/jest/data/review-adapter.test.ts
git commit -m "feat(data): ReviewRepository port + ReviewAdapter"
```

---

## Self-Review

**Spec coverage (architecture.md port tables):**
- CheckInRepository `upsert`/`getByDate`/`listByUser`/`listByWeek` → Task 1. ✅
- CheckInService `submitCheckIn`/`editCheckIn` → Task 2 (`recordCheckIn` covers both via upsert; scope note explains the merge and the deferred `CheckInResult` feedback). ✅
- ReviewRepository `save`/`getByWeek`/`listByUser` → Task 3. ✅
- Graded tests (CLAUDE.md): three states + ≥1 missing-record case → `dayStateOf` tests (completed/backfilled/missing/future) in Task 2. ✅ (80%/90% limit tests already covered by existing `limits.test.ts`.)

**Deferred, by design (not gaps):** `CheckInResult` status/remaining feedback and `week_no`/`today`/`week_first_day` resolution from `StudyCalendar` belong to the caller (dispatcher) and the shared weekly evaluator delivered with DashboardService (item #4). UsageEventRepository is not a dependency of any of these three and is out of scope.

**Placeholder scan:** none — every step carries real code.

**Type consistency:** `CheckInRepository` shape identical in ports.ts (Task 1 Step 3), adapter (Step 4), and the fake in the domain test (Task 2 Step 5). `recordCheckIn(input, deps)` signature matches between the Interfaces block, the test fake, and the implementation. `DataLayer` gains `checkIns` (Task 1) and `reviews` (Task 3) — both consumed by tests via `createDataLayer`.
