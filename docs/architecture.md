# Architecture — Hexagonal (Ports & Adapters)

**Port state:** 📝 `DRAFT` (designed only) · 🚧 `IN PROGRESS` (partially built) · 🔍 `REVIEW` (built, under review) · ✅ `DONE` (built & tested).

Every port lists its contract as **Method · Accepts · Returns · Description**, where
Accepts/Returns name a definition shown as JSON below the table (`—` = nothing, `?` =
nullable, `[]` = array). Inbound services speak camelCase DTOs; outbound repositories
speak the snake_case domain models they store.

## Layers & flow

The hexagon end to end: the UI drives the domain through inbound ports; the domain
reaches storage through outbound ports that data adapters implement. Calls flow outward,
dependencies point inward.

```mermaid
flowchart TB
    subgraph driving["Driving side — src/ui + src/app (proposed)"]
        UI["React UI<br/>zustand = UI state only"]
        DISP["Dispatcher<br/>thin facade, 1 method / use case"]
        UI --> DISP
    end

    subgraph coreHex["Domain core — src/domain (pure, no I/O)"]
        IN(["Inbound ports<br/>Onboarding · CheckIn · Dashboard<br/>Review · Reminder · Export"])
        SVC["Domain services<br/>+ pure functions & model"]
        OUT(["Outbound ports<br/>Profile · Limit · CopingStrategy<br/>CheckIn · Review · UsageEvent · Clock"])
        IN --> SVC --> OUT
    end

    subgraph driven["Driven side — src/data"]
        ADP["Dexie adapters<br/>implement outbound ports"]
        REPO["DexieRepository — generic"]
        DB[("AppDatabase<br/>IndexedDB")]
        CLK1["SystemClock<br/>real (systemNow)"]
        CLK2["TimeMachineClock<br/>demo, advanceable"]
        ADP --> REPO --> DB
    end

    HTTP["HttpApiAdapter — future server"]

    DISP --> IN
    OUT --> ADP
    OUT -.-> CLK1
    OUT -.-> CLK2
    OUT -.-> HTTP

    ROOT["Composition root — src/core<br/>createDataLayer() / createApp()"]
    ROOT -. wires .-> DISP
    ROOT -. wires .-> SVC
    ROOT -. wires .-> ADP

    class HTTP,ROOT dashed
    classDef dashed stroke-dasharray: 5 5,opacity:0.75
```

## Model seams — DTO ⟷ Domain ⟷ Entity

One model shape per boundary with a mapper at each seam — identical today, free to
diverge later without touching the core.

```mermaid
flowchart LR
    DTO["DTO<br/>src/app/dto (proposed)<br/>UI-shaped, camelCase"]
    DOM["Domain model<br/>src/domain/model.ts<br/>framework-free"]
    ENT["Entity<br/>src/data/model.ts<br/>storage rows"]
    DTO <-->|"domain ⇄ DTO mapper<br/>(dispatcher / app layer)"| DOM
    DOM <-->|"entity ⇄ domain mapper<br/>(data adapter)"| ENT
```

## Inbound ports (driving)

Use-case entry points the UI calls through the dispatcher; each is implemented by a
domain service. **Depends on** lists the ports the service needs, split into inbound and
outbound sub-lists.

### OnboardingService

**Status:** 🚧 IN PROGRESS — `completeOnboarding()` built & tested (`src/domain/onboarding.ts`, `tests/jest/domain/onboarding.test.ts`); `setReference`/`getSuggestedLimits` not wrapped as service methods yet (logic exists as `suggestLimit`/`limitPercentView` in `limits.ts`)

**Depends on**
- Inbound
  - (none)
- Outbound
  - ProfileRepository
  - LimitRepository
  - CopingStrategyRepository
  - Clock

| Method             | Accepts                    | Returns                     | Description                                                  |
|--------------------|----------------------------|-----------------------------|--------------------------------------------------------------|
| getSuggestedLimits | `ReferenceWeekRequest`     | `SuggestedLimitsResponse`   | 80% suggestion + 90% ceiling from the reference week         |
| complete           | `OnboardingProfileRequest` | `OnboardingProfileResponse` | Finalize onboarding: persist profile + week-1 limit + coping |

**ReferenceWeekRequest**

```json
{
  "timeMinutes": 600,
  "stakesAmount": 10000
}
```

**SuggestedLimitsResponse**

```json
{
  "timeMinutes": 480,
  "stakesAmount": 8000,
  "timePercent": 80,
  "stakePercent": 80
}
```

**OnboardingProfileRequest**

```json
{
  "reference": {
    "timeMinutes": 600,
    "stakesAmount": 10000
  },
  "limits": {
    "timeMinutes": 480,
    "stakesAmount": 8000
  },
  "coping": [
    {
      "label": "Jít na 15 minut ven",
      "type": "default"
    }
  ]
}
```

**OnboardingProfileResponse**

```json
{
  "reference": {
    "timeMinutes": 600,
    "stakesAmount": 10000
  },
  "limits": {
    "timeMinutes": 480,
    "stakesAmount": 8000
  },
  "coping": [
    {
      "label": "Jít na 15 minut ven",
      "type": "default"
    }
  ],
  "interventionStartDate": "2026-09-01"
}
```

Wired end to end — the reference example for the whole hexagon:

```mermaid
flowchart LR
    UIw["UI onboarding wizard"] --> SVC(["OnboardingService<br/>inbound port"])
    IMPL["OnboardingServiceImpl<br/>(domain)"] -. implements .-> SVC
    IMPL --> P(["ProfileRepository"])
    IMPL --> L(["LimitRepository"])
    IMPL --> C(["CopingStrategyRepository"])
    IMPL --> CLK(["Clock (port)"])
    P -. implemented by .-> PA["ProfileAdapter"]
    L -. implemented by .-> LA["LimitAdapter"]
    C -. implemented by .-> CA["CopingStrategyAdapter"]
    PA --> DBx[("IndexedDB")]
    LA --> DBx
    CA --> DBx
```

### CheckInService

**Status:** 📝 DRAFT — `src/domain/checkin.ts` has types/signatures only (`ValidateCheckIn`, `SubmitCheckIn`, `DayStateOf`, `IsBackfill`); no implementations yet. (Its outbound repos are further along — see `CheckInRepository`/`CheckInEditRepository` below.)

**Depends on**
- Inbound
  - (none)
- Outbound
  - CheckInRepository
  - LimitRepository
  - Clock

| Method | Accepts | Returns | Description |
|---|---|---|---|
| submitCheckIn | `CheckInRequest` | `CheckInResultResponse` | Record a day's check-in |
| editCheckIn | `CheckInRequest` | `CheckInResultResponse` | Edit an existing check-in (sets `updatedAt`) |

**CheckInRequest**

```json
{
  "behaviorDate": "2026-09-03",
  "played": true,
  "timeMinutes": 60,
  "stakesAmount": 500,
  "winningsAmount": 0
}
```

**CheckInResultResponse**

```json
{
  "behaviorDate": "2026-09-03",
  "status": "POZOR",
  "remainingTimeMinutes": 130,
  "remainingStakesAmount": 1500,
  "copingReminder": "Jít na 15 minut ven"
}
```

### DashboardService

**Status:** 📝 DRAFT — `src/domain/dashboard.ts` has the `DashboardVM`/`AxisView`/`DayCell` shapes and a `BuildDashboardVM` type only; no builder function yet

**Depends on**
- Inbound
  - (none)
- Outbound
  - ProfileRepository
  - LimitRepository
  - CheckInRepository
  - ReviewRepository
  - Clock

| Method | Accepts | Returns | Description |
|---|---|---|---|
| getDashboard | `—` | `DashboardResponse` | Cumulative weekly evaluation vs both limits, missing days surfaced |

**DashboardResponse**

```json
{
  "studyDay": 3,
  "weekNo": 1,
  "time": {
    "used": 350,
    "limit": 480,
    "percent": 73,
    "remaining": 130,
    "status": "OK"
  },
  "stakes": {
    "used": 6500,
    "limit": 8000,
    "percent": 81,
    "remaining": 1500,
    "status": "POZOR"
  },
  "overallStatus": "POZOR",
  "missingDays": [
    "2026-09-02"
  ],
  "pendingAction": "checkin_due"
}
```

### ReviewService

**Status:** 📝 DRAFT — no `review.ts`; `CanReview`/`IsWeekClosed` signatures exist in `guards.ts` but are unimplemented

**Depends on**
- Inbound
  - (none)
- Outbound
  - ProfileRepository
  - LimitRepository
  - CheckInRepository
  - ReviewRepository
  - Clock

| Method | Accepts | Returns | Description |
|---|---|---|---|
| getPendingReview | `—` | `ReviewResponse?` | The review due for a closed week, if any |
| completeReview | `CompleteReviewRequest` | `void` | Close the week and set the next week's limits |
| getFinalSummary | `—` | `FinalSummaryResponse` | Final summary after day 28 (no limit-setting) |

**ReviewResponse**

```json
{
  "weekNo": 1,
  "time": {
    "used": 350,
    "limit": 480,
    "status": "OK"
  },
  "stakes": {
    "used": 6500,
    "limit": 8000,
    "status": "POZOR"
  },
  "missingDays": [
    "2026-09-02"
  ],
  "suggestedNextLimits": {
    "timeMinutes": 480,
    "stakesAmount": 8000
  }
}
```

**CompleteReviewRequest**

```json
{
  "reviewWeekNo": 1,
  "nextLimits": {
    "timeMinutes": 460,
    "stakesAmount": 7500
  },
  "incomplete": false
}
```

**FinalSummaryResponse**

```json
{
  "weeks": [
    {
      "weekNo": 1,
      "timeStatus": "OK",
      "stakesStatus": "POZOR",
      "overall": "POZOR"
    }
  ]
}
```

### ReminderService

**Status:** 📝 DRAFT — no `reminder.ts`; `PendingAction`/`ResolvePendingAction` type exists in `guards.ts` but is unimplemented

**Depends on**
- Inbound
  - (none)
- Outbound
  - CheckInRepository
  - ProfileRepository
  - Clock

| Method | Accepts | Returns | Description |
|---|---|---|---|
| getDueReminder | `—` | `ReminderResponse?` | The one working reminder scenario, if due |

**ReminderResponse**

```json
{
  "kind": "checkin_due",
  "behaviorDate": "2026-09-02",
  "message": "Doplňte prosím včerejší check-in."
}
```

### ExportService

**Status:** 📝 DRAFT — no `PersonDayRow` builder / CSV row derivation logic exists yet

**Depends on**
- Inbound
  - (none)
- Outbound
  - ProfileRepository
  - LimitRepository
  - CheckInRepository
  - ReviewRepository

| Method | Accepts | Returns | Description |
|---|---|---|---|
| exportPersonDaysCsv | `—` | `string` (CSV of `PersonDayRow`) | Person-day CSV, one row per study day 1–28 |

**PersonDayRow** (one CSV line)

```json
{
  "userId": "A001",
  "interventionStartDate": "2026-09-01",
  "studyDay": 3,
  "weekNo": 1,
  "behaviorDate": "2026-09-03",
  "checkinStatus": "completed",
  "played": true,
  "timeMinutes": 60,
  "stakesAmount": 500,
  "winningsAmount": 0,
  "submittedAt": "2026-09-04T08:00:00+02:00",
  "updatedAt": null,
  "isBackfill": false
}
```

## Outbound ports (driven)

Storage contracts the domain depends on, each implemented by a data-layer adapter (and,
later, an HTTP adapter). Accepts/Returns reference the snake_case domain models.

### ProfileRepository

**Status:** ✅ DONE · adapter: `ProfileAdapter`

| Method | Accepts | Returns | Description |
|---|---|---|---|
| save | `Profile` | `void` | Insert or replace the profile |
| get | `UserId` | `Profile?` | Read the profile by user |

**Profile**

```json
{
  "user_id": "A001",
  "onboarding_completed_at": "2026-08-31T21:30:00+02:00",
  "intervention_start_date": "2026-09-01",
  "reference_time_min": 600,
  "reference_stakes_czk": 10000
}
```

### LimitRepository

**Status:** ✅ DONE · adapter: `LimitAdapter`

| Method | Accepts | Returns | Description |
|---|---|---|---|
| save | `Limit` | `void` | Append a weekly limit (one per week, never overwritten) |
| listByUser | `UserId` | `Limit[]` | All limits for a user, by week |

**Limit**

```json
{
  "limit_id": "3f2b…",
  "user_id": "A001",
  "week_no": 1,
  "weekly_limit_time_min": 480,
  "weekly_limit_stakes_czk": 8000,
  "limit_set_at": "2026-09-01T08:00:00+02:00"
}
```

### CopingStrategyRepository

**Status:** ✅ DONE · adapter: `CopingStrategyAdapter`

| Method | Accepts | Returns | Description |
|---|---|---|---|
| loadDefaults | `—` | `CopingStrategyDefault[]` | Predefined suggestions for the onboarding picker |
| create | `CopingStrategyInput` | `CopingStrategy` | Write a custom or adopted strategy |
| setActive | `copingStrategyId, active` | `void` | Toggle a strategy active/inactive |
| listByUser | `UserId` | `CopingStrategy[]` | The user's strategies, by priority |

**CopingStrategyInput**

```json
{
  "user_id": "A001",
  "label": "Zavolat bratrovi",
  "type": "custom",
  "priority": 2,
  "active": true
}
```

**CopingStrategy**

```json
{
  "coping_strategy_id": "9a1c…",
  "user_id": "A001",
  "label": "Jít na 15 minut ven",
  "type": "default",
  "priority": 1,
  "active": true,
  "created_at": "2026-08-31T21:30:00+02:00",
  "updated_at": null
}
```

**CopingStrategyDefault**

```json
{
  "code": "step_out",
  "label": "Jít na 15 minut ven",
  "priority": 1,
  "reminder_text": "Vyjdi ven na 15 minut."
}
```

### CheckInRepository

**Status:** ✅ DONE · adapter: `CheckInAdapter` — tested (`tests/jest/data/checkin-adapters.test.ts`)

| Method | Description |
|---|---|
| save | Insert or replace a check-in, keyed on (user, behavior_date) |
| get | One check-in by id |
| listByUser | All check-ins for a user, ordered by `behavior_date` |

Note: method names above have drifted from the original draft (`upsert`/`getByDate`/`listByWeek`) — this reflects what's actually implemented today.

### CheckInEditRepository

**Status:** ✅ DONE · adapter: `CheckInEditAdapter` — tested (`tests/jest/data/checkin-adapters.test.ts`)

Not in the original port list — added alongside `CheckInRepository` to log check-in edits (`CheckInEdit`: create/update, before/after snapshots, changed fields).

| Method | Description |
|---|---|
| save | Append an edit-log row |
| get | One edit-log row by id |
| listByCheckIn | A check-in's edit history, oldest first |

### ContactRepository

**Status:** ✅ DONE · adapter: `ContactAdapter` — tested (`tests/jest/data/contactAdapter.test.ts`)

Not in the original port list — supports a counselling/emergency contacts list (`Contact` model: category, phone, url, availability, priority).

| Method | Accepts | Returns | Description |
|---|---|---|---|
| upsert | `CheckIn` | `void` | Insert or replace, keyed on (user, behavior_date) |
| getByDate | `UserId, ISODate` | `CheckIn?` | One day's check-in |
| listByUser | `UserId` | `CheckIn[]` | All check-ins for a user |
| listByWeek | `UserId, weekNo` | `CheckIn[]` | Check-ins for a given study week |

**CheckIn**

```json
{
  "check_in_id": "b7e0…",
  "user_id": "A001",
  "behavior_date": "2026-09-03",
  "week_no": 1,
  "played": true,
  "time_min": 60,
  "stakes_czk": 500,
  "winnings_czk": 0,
  "submitted_at": "2026-09-04T08:00:00+02:00",
  "updated_at": null
}
```
| Method | Description |
|---|---|
| seed | Idempotent seed from `CONTACTS`, safe on every boot |
| list | All contacts, by priority |
| get | One contact by id |

### ReviewRepository

**Status:** 📝 DRAFT · adapter: `ReviewAdapter`

| Method | Accepts | Returns | Description |
|---|---|---|---|
| save | `Review` | `void` | Append a review (one per week) |
| getByWeek | `UserId, weekNo` | `Review?` | A week's review |
| listByUser | `UserId` | `Review[]` | All reviews for a user |

**Review**

```json
{
  "review_id": "c4d9…",
  "user_id": "A001",
  "review_week_no": 1,
  "review_completed_at": "2026-09-08T09:00:00+02:00",
  "limit_changed": true,
  "incomplete": false
}
```

### UsageEventRepository

**Status:** 📝 DRAFT · adapter: `UsageEventAdapter`

| Method | Accepts | Returns | Description |
|---|---|---|---|
| append | `UsageEvent` | `void` | Add an interaction event |
| listByUser | `UserId` | `UsageEvent[]` | All events for a user |

**UsageEvent**

```json
{
  "usage_event_id": "e12a…",
  "user_id": "A001",
  "event_type": "app_opened",
  "occurred_at": "2026-09-04T08:00:00+02:00",
  "screen": "dashboard",
  "detail": null
}
```

### Clock

**Status:** 🚧 IN PROGRESS · adapters: `SystemClock` (real, ✅ DONE), `TimeMachineClock` (demo, 📝 DRAFT)

| Method | Accepts | Returns | Description |
|---|---|---|---|
| now | `—` | `ISOTimestamp` (string) | Current instant as an ISO 8601 timestamp |

Both implement the `Clock` port (`now()`); the composition root picks which one —
`SystemClock` in production, `TimeMachineClock` for the demo and tests. The domain only
ever sees `now()`; any extra controls stay outside the port.

**SystemClock** — ✅ DONE · `src/data/clock.ts`

Returns real wall-clock time as an ISO 8601 string (`systemNow`). Stateless, no controls.
The default everywhere except the demo and tests.

**TimeMachineClock** — 📝 DRAFT · proposed `src/data/timeMachineClock.ts`

Holds a virtual "now" that the demo can move, so the jury can walk days 1–28 — missing
day, backfill, weekly review, final summary — without waiting for real time. It honours
the same `now()` contract; its controls below are exposed to a demo drawer / test helper,
never called by the domain.

| Control | Effect |
|---|---|
| setNow(iso) | Pin the virtual clock to a specific instant |
| advanceDays(n) | Jump forward n calendar days |
| reset | Return to real time (or the seeded start date) |

## TODO — domain

Everything downstream of onboarding is still unimplemented in `src/domain`. In priority order (each blocks a "must work" jury flow):

1. **CheckInService** (`checkin.ts`) — implement `validateCheckIn`, `submitCheckIn`, `dayStateOf`, `isBackfill` against the existing type signatures. Its outbound repos (`CheckInRepository`, `CheckInEditRepository`) are already built, so this is the next unblocked piece.
2. **DashboardService** (`dashboard.ts`) — implement `buildDashboardVM`: derive cumulative usage, net loss, weekly totals, and overall state from check-ins + limit history (never stored, per CLAUDE.md).
3. **guards.ts implementations** — only `evaluateLimitAdjustment` is built. Still missing: `canEditCheckIn`, `isWeekClosed`, `canReview`, `resolvePendingAction`. These block both `CheckInService` (edit window) and `ReviewService` (week-closing).
4. **ReviewService** (new `review.ts`) — `getPendingReview`, `completeReview`, `getFinalSummary`; depends on guards #3 and a `ReviewRepository` adapter (currently 📝 DRAFT, no adapter yet).
5. **ReminderService** (new `reminder.ts`) — `getDueReminder`; depends on `resolvePendingAction` from guards #3.
6. **ExportService** (new `export.ts`) — `PersonDayRow` builder for the CSV export; depends on #1–#2 for source data, and must respect the missing-vs-no-play blank/zero distinction (CLAUDE.md CSV gotcha).
7. **Outbound gaps**: `ReviewRepository` and `UsageEventRepository` have no adapters yet (`src/data/adapters` has no `reviewAdapter.ts`/`usageEventAdapter.ts`); `TimeMachineClock` (the demo/jury clock) is still 📝 DRAFT — needed before any 28-day walkthrough can be demoed without waiting real days.
