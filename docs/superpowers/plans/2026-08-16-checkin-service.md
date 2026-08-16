# CheckInService Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use `- [ ]`.

**Goal:** Finish the backend CheckInService — submit and edit a day's check-in with validation, backfill rules, week-close locking, and an audit trail.

**Architecture:** Pure domain command handlers (`validateCheckIn`, `submitCheckIn`) in `@domain/checkin.ts` against the existing type signatures; `CheckInServiceImpl` orchestrates repos + calendar and returns camelCase DTOs. Mirrors the ReviewService/OnboardingService app-layer shape.

**Tech Stack:** TypeScript, hexagonal (domain/app/data), Jest (`NODE_OPTIONS=--experimental-vm-modules`), `npm run check`.

**Spec:** `docs/zadani_md/05-checkin.md` (+ `07-feedback.md` for the scope note in Task 0).

## Global Constraints

- **Clock model (as of main `b881033`): `time: ISOTimestamp` is a per-request argument on each service method** (e.g. `getDashboard(time)`), NOT an injected dep — `createApp()` takes no clock. `userId` and `newId` are injected deps. Domain functions receive `time` as a value; `createStudyCalendar(start, time, config)` takes the instant directly. This plan assumes these; it does not solve ID/clock sourcing.
- Single-user fallback: `DEMO_USER_ID` default, optional `userId?` dep for tests (`@/app/constants.ts`).
- Domain purity: no `new Date()`/`Date.now()`/`crypto.randomUUID()`; `time: Clock` and `newId` are injected. "today" = `calendarDate(time())`.
- Timestamps: `behaviorDate` is `ISOCalendarTimestamp` (UTC-midnight); compare day portions with `calendarDate()`.
- Upsert keyed on `behaviorDate` — never a duplicate row.
- Do NOT validate stakes against the limit (doc 05): over-limit is a legal outcome, not a form error.
- `played=false ⟹ timeMin=stakesCzk=winningsCzk=0`.

---

## Task 0: Decide the two open scope questions (no code)

Resolve before writing code — they change the deps and DTOs:

1. **Feedback payload (doc 07).** ✅ DECIDED: **the backend builds it.** `submitCheckIn` returns the week feedback (both axes' status/pct/remaining + coping reminder). Requires injecting `copingStrategies: CopingStrategyRepository` and a `buildCheckInFeedback` presenter (Task 6). Reuse `classifyStatus`/`axisView`-style math from `@domain/limits.ts`/`@domain/dashboard.ts` — do not re-derive status thresholds locally.

2. **Result on invalid input.** `submitCheckIn` returns a discriminated result (`{ ok: true, checkIn, feedback } | { ok: false, errors }`) rather than throwing — field errors are user-facing form state, not exceptions. Reserve `throw` for policy refusals (closed/future week) and missing profile.

---

## Task 1: `validateCheckIn` domain implementation

**Files:**
- Modify: `src/domain/checkin.ts` (add `export const validateCheckIn: ValidateCheckIn`)
- Test: `tests/jest/domain/checkin.test.ts`

**Interfaces:**
- Consumes: `CheckInDraft`, `CheckInValidation`, context `{ today: ISODate; weekFirstDay: ISOCalendarTimestamp }` (all already declared).
- Produces: `validateCheckIn(draft, context): CheckInValidation`.

Validation table (doc 05):
- `timeMin`: integer, `0 ≤ timeMin ≤ 1440`.
- `stakesCzk`: integer `≥ 0`. `winningsCzk`: integer `≥ 0`.
- `played=false` ⟹ all three numerics must be 0 (else field errors on the non-zero ones).
- `behaviorDate`: `calendarDate(behaviorDate) ≥ calendarDate(weekFirstDay)` (in current week) AND `calendarDate(behaviorDate) < today` (≤ today−1). Both failures are `behaviorDate` field errors.

- [ ] **Step 1: Write failing tests** — valid played row; valid not-played zero row; `played=false` with non-zero stakes → error; `timeMin=1441` → error; `timeMin=-1` → error; non-integer `stakesCzk` → error; `behaviorDate === today` → error; `behaviorDate` before `weekFirstDay` → error; `behaviorDate` = yesterday in-week → valid.
- [ ] **Step 2: Run, verify fail** (`validateCheckIn` not exported).
- [ ] **Step 3: Implement** the guard collecting `CheckInFieldError[]`; return `{ valid: true }` iff empty. Use `Number.isInteger`.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** `feat(checkin): implement validateCheckIn`.

## Task 2: `submitCheckIn` domain implementation

**Files:**
- Modify: `src/domain/checkin.ts` (add `export const submitCheckIn: SubmitCheckIn`)
- Test: `tests/jest/domain/checkin.test.ts`

**Interfaces:**
- Consumes: `SubmitCheckIn = (userId, draft, weekNo, time, existing?) => CheckIn`.
- Produces: a `CheckIn`. On `existing`: keep `checkInId` + `submittedAt`, set `updatedAt = time`. On new: `checkInId` is the caller's concern — **the type has no `newId` param**, so the service assigns the id (see Task 4); domain sets `submittedAt = time`, `updatedAt = null`. Force numerics to 0 when `!played`.

> Note: `newId` is an injected parameter (see Global Constraints). Widen the domain signature to `(userId, draft, weekNo, time, newId, existing?)` so record construction stays pure and in one place: on create it uses `newId()`; on edit it reuses `existing.checkInId`. No open question here — just thread the already-available `newId` through.

- [ ] **Step 1: Write failing tests** — new played row builds correct record (weekNo, submittedAt=time, updatedAt=null, id from newId); `played=false` forces numerics to 0 even if draft carried values; edit path preserves `checkInId`/`submittedAt` and sets `updatedAt=time`.
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** (with the widened signature from the note).
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** `feat(checkin): implement submitCheckIn`.

## Task 3: App DTOs + mapper

**Files:**
- Create: `src/app/dto/checkin.ts`
- Modify: `src/app/ports/checkInService.ts` (replace `Record<string,unknown>` placeholders)
- Create: `src/app/mappers/checkinMapper.ts`
- Test: `tests/jest/app/lib` or inline in service test.

DTOs:
- `CheckInRequest { behaviorDate: ISOCalendarTimestamp; played: boolean; timeMin: number; stakesCzk: number; winningsCzk: number }`
- `CheckInFieldErrorDto { field: string; message: string }`
- `CheckInResultResponse = { ok: true; checkIn: CheckIn; feedback: CheckInFeedbackDto } | { ok: false; errors: CheckInFieldErrorDto[] }`
- `CheckInFeedbackDto { weekNo: number; time: AxisDto; stakes: AxisDto; overall: Status; copingReminder: string | null; incompleteWeek: boolean }` — `copingReminder` non-null only when `overall` is POZOR or PREKROCENO; `incompleteWeek` true when the week has any missing past day (doc 07's "data incomplete" note). Reuse the existing `AxisDto` from `@/app/dto/dashboard.ts`.
- `CheckIn` is already camelCase — return it directly, no redundant `CheckInDto`/mapper.

- [ ] Mapper: `toCheckInDraft(req): CheckInDraft`. (Result maps straight through if `CheckInDto = CheckIn`.)
- [ ] Commit `feat(app): checkin DTOs + mapper`.

## Task 4: Fix `CheckInServiceDeps` wiring (reviews + newId)

**Files:**
- Modify: `src/app/services/checkInServiceImpl.ts` (deps)
- Modify: `src/core/app.ts` (wire `reviews: data.reviews`, `newId`)

`editCheckIn` uses `canEditCheckIn({ behaviorDate, today, weekClosed })` where `weekClosed = isWeekClosed(recordWeekNo, reviews)`. The current deps have **no `reviews` repo** — it's required. `newId` arrives with the standard injected-params work (Global Constraints); if it isn't wired yet, add it here too. Add:
```
reviews: ReviewRepository
copingStrategies: CopingStrategyRepository   // for the doc-07 feedback coping reminder
newId: () => string   // if not already added by the shared injected-params change
```
and pass `reviews: data.reviews`, `copingStrategies: data.copingStrategies` (and `newId`) in `app.ts`.

- [ ] Add deps, wire in `app.ts`, `npm run check` still green (methods still throw). Commit `chore(app): inject reviews + coping + newId into CheckInService`.

## Task 5: `CheckInServiceImpl.submitCheckIn` + `editCheckIn`

**Files:**
- Modify: `src/app/services/checkInServiceImpl.ts`
- Test: `tests/jest/app/checkInService.test.ts` (new)

`submitCheckIn(req)`:
1. Load profile (throw if none). Build `calendar = createStudyCalendar(profile.interventionStartDate, time)`.
2. `today = calendarDate(time())`; `weekFirstDay = calendar.dateOf(calendar.firstDay(calendar.currentWeek()))`.
   - Entry is guaranteed to be day ≥ 1: the check-in screen is only opened by the "check-in due" popup, which never fires before day 1, so `currentWeek()` is always valid here. (Optional one-line defensive guard `Math.max(currentDay(), 1)` if we ever add another entry point.)
3. `validateCheckIn(draft, { today, weekFirstDay })` → on invalid return `{ ok: false, errors }`.
4. `behaviorWeek = calendar.weekNo(calendar.studyDay(req.behaviorDate))`.
5. Upsert: `existing = (await checkIns.listByUser(userId)).find(c => calendarDate(c.behaviorDate) === calendarDate(req.behaviorDate))`.
6. If `existing` and `isWeekClosed(behaviorWeek, reviews)` → throw (visible refusal). (New submit into a closed week is already blocked by the current-week validation in step 3.)
7. `record = submitCheckIn(userId, draft, behaviorWeek, time(), newId, existing)`; `await checkIns.save(record)`.
8. Write audit: `checkInEdits.save({ action: existing ? 'updated' : 'created', before: existing ? JSON.stringify(existing) : null, after: JSON.stringify(record), changedFields, editedAt: time(), checkInEditId: newId(), checkInId: record.checkInId, userId })`.
   - `changedFields`: for `created` → `[]` (the whole record is the `after` snapshot). For `updated` → the subset of `['played','timeMin','stakesCzk','winningsCzk']` whose value differs between `existing` and `record`. **Exclude** `submittedAt`/`updatedAt`/ids from the diff so the list carries real behavioral changes, not clock noise.
9. Build feedback via `buildCheckInFeedback` (Task 6). Return `{ ok: true, checkIn: record, feedback }`.

`editCheckIn(req)`: same as submit but requires `existing`; if none → throw (nothing to edit); enforces `canEditCheckIn` (future/closed) explicitly before writing.

- [ ] **Tests:** new create writes checkIn + `created` audit; second submit same date = update (`updatedAt` set, no duplicate, `updated` audit); `played=false` zeroes numerics; invalid draft returns `{ ok:false }` and writes nothing; edit into a closed week (review exists) throws; future-date submit returns validation error.
- [ ] Commit `feat(app): implement CheckInService submit/edit`.

## Task 6: `buildCheckInFeedback` presenter (doc 07)

**Files:**
- Create: `src/domain/feedback.ts` (pure presenter) — or add to `@domain/checkin.ts` if small.
- Modify: `src/app/services/checkInServiceImpl.ts` (call it in submit/edit)
- Test: `tests/jest/domain/feedback.test.ts`

**Interfaces:**
- Consumes: current-week check-ins, the week's `Limit`, active coping strategies, `config`.
- Produces: `buildCheckInFeedback({ weekNo, checkIns, limit, copingStrategies, config }) => CheckInFeedbackDto`.

Logic (doc 07):
- Sum the current week's `timeMin`/`stakesCzk`; compute each axis via the same status/pct/remaining math the dashboard uses (`classifyStatus` + `remaining = limit - used`, unclamped). Do not fork the thresholds.
- `overall = worseStatus(time.status, stakes.status)`.
- `copingReminder`: the top-priority active coping strategy's `label` when `overall` is `POZOR` or `PREKROCENO`, else `null`.
- Zero-limit edge (doc 07): `pct = null`, status still classifies, message reads coherently ("any wagering is above your limit") — the UI owns the wording; the DTO just carries status + null pct.
- `incompleteWeek`: true if any past day of the current week has no check-in — reuse `dayStateOf`/`missingDays` logic rather than recomputing.

- [ ] **Step 1: Write failing tests** — OK week → `copingReminder: null`; POZOR → reminder = top-priority label; `played=false` today but week already POZOR → still POZOR (not congratulatory); zero limit → `pct null`, status set.
- [ ] **Step 2–4:** implement, run green.
- [ ] **Step 5: Commit** `feat(checkin): doc-07 feedback presenter`.

> Feedback reuses the current week's check-ins the service already loads in Task 5 step 5 — pass them in, don't re-query.

## Self-Review checklist
- Spec coverage: validation table ✅ (T1), upsert/backfill/lock ✅ (T5), audit trail ✅ (T5, built per decision), feedback ✅ (T6, backend-built per decision).
- `newId`/`time`/`userId` = injected params (Global Constraints); `submitCheckIn` signature widened to thread `newId` (T2).
- Types consistent: `CheckInResultResponse` discriminated union used identically in port and service; `CheckInFeedbackDto` reuses dashboard's `AxisDto`.
- Deps gap closed: `reviews` + `copingStrategies` (+`newId`) added to `CheckInServiceDeps` and `app.ts` (T4).
