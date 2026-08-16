# CLAUDE.md

Self-control app for gambling harm reduction (DigiWELL Hackathon 2026). PWA,
single demo user, local-only data, one complete loop: onboarding → daily
check-in → automatic feedback → dashboard → weekly review.

Target users: 18–34 y/o wanting more control over their gambling. Not a
substitute for treatment. **Priority: a narrower, reliable, extensible core
beats more half-finished features.**

## Where things live (single source of truth — don't copy here)

- **Index of every document, plus which one wins in a conflict → [docs/README.md](docs/README.md).**
- Stack, commands, scripts, layout, licenses → [README.md](README.md).
- Tables, field names, invariants, Dexie stores → [docs/data-model.md](docs/data-model.md) (authoritative for the data layer).
- Full requirements, data model, CSV export spec → [Zadání_Hackathon_2026_shared.docx.md](Zadání_Hackathon_2026_shared.docx.md) (Czech, authoritative). The rules below are an English digest, not a replacement.
- **Where we knowingly deviate from that spec → [docs/decisions.md](docs/decisions.md).** Check it before "fixing" something that looks wrong against the spec — it may be a decision, not a bug.
- Hexagon layout, ports, DTOs, per-port build status → [docs/architecture.md](docs/architecture.md) (authoritative). The Architecture section below is a digest, not a replacement — check that doc for the current status of any port before assuming it's implemented.
- **Runtime deps** (everything in `dependencies`): React + React DOM, Dexie (IndexedDB, in `src/data/`), Zustand (UI state only — persistent data stays in Dexie), `lucide-react` icons, and two `@fontsource-variable` families. Written in TypeScript, styled with Tailwind 4 — but the compiler, Vite, Tailwind's plugin, test runners, ESLint/Prettier and `vite-plugin-pwa` are all **dev tooling**, not runtime deps.
- **Architecture rule that bites:** the ESLint `no-restricted-imports` rule forbids `src/domain/**` from importing react/dexie/zustand/`@ui`/`@data`. Keep domain pure and storage-agnostic, or the lint gate fails.

## Architecture (digest — [docs/architecture.md](docs/architecture.md) is the source of truth)

Hexagonal (ports & adapters). Calls flow outward from the UI, dependencies point inward toward the domain.

- **Flow**: React UI (`src/ui`) → inbound ports (`src/app/ports`, one method per use case) → service impls (`src/app/services`) → domain (`src/domain`, pure, no I/O) → outbound ports → Dexie adapters (`src/data`, via a generic `DexieRepository`) → IndexedDB. A composition root (`src/core`: `createDataLayer()` / `createApp()`) wires services and adapters; the UI reaches them through `AppProvider` / `useOnboardingService()` & co. (`src/ui/app/`).
- **Inbound ports** (driving side, one service impl each): `OnboardingService`, `CopingStrategyService`, `ContactService`, `CheckInService`, `DashboardService`, `ReviewService`, `ReminderService`, `NotificationService`, `ExportService`, `AdminService`.
- **Outbound ports** (driven side, each backed by a Dexie adapter): `ProfileRepository`, `LimitRepository`, `CopingStrategyRepository`, `OnboardingRepository`, `ContactRepository`, `CheckInRepository`, `CheckInEditRepository`, `ReviewRepository`, `UsageEventRepository`, `DatabaseAdmin`. An `HttpApiAdapter` is a future, not-yet-built alternative to the Dexie adapters.
  - `OnboardingRepository` is write-only and atomic (profile + week-1 limit + coping in one transaction); `DatabaseAdmin` is the destructive drop-a-user port and carries no domain objects. Both are easy to miss when scanning for `*Repository`.
- **No `Clock` port.** Time is not injected into the domain: every time-dependent service method takes the instant as a parameter, and the UI is the only thing that reads a real clock (`clientNow()` in `src/ui/clock.ts`, offset-bearing so "today" doesn't drift near midnight). The demo time machine is UI-side (`src/ui/admin/`, `src/dev/`), not a clock adapter.
- **Model seams**: DTO (`src/app/dto`, UI-shaped camelCase) ⟷ domain model (`src/domain/model.ts`, framework-free) ⟷ storage entity (`src/data/model.ts`) — one mapper per seam. The domain is camelCase and the storage entity snake_case, so the entity mapper is a real rename; the DTO seam is thin today but free to diverge.
- Each port carries a build status (📝 DRAFT · 🚧 IN PROGRESS · 🔍 REVIEW · ✅ DONE) tracked only in the architecture doc — don't assume a port is wired up without checking it there.

## Workflow

- Run `npm run check` (typecheck + type-aware ESLint + Prettier + Jest) before every commit — it's the CI gate. `npm run lint:fix` and `npm run format` autofix most of what it flags.

## Naming convention

**camelCase everywhere in TypeScript** — the rename of `src/domain/model.ts` is done, so there is no snake_case left to tolerate in code.

That rule is about **identifiers**. As identifiers, snake_case survives in exactly two places, and both are contracts rather than names we chose: the **Dexie store rows** (`src/data/model.ts`, plus the schema strings in `src/data/db.ts`, mapped at the adapter boundary) and the **CSV export column names** (`src/app/mappers/exportMapper.ts`). Neither may be camelCased — the store shape is persisted data and the CSV headers are what the researchers read.

Separately, plenty of **string literal values** are snake_case on purpose — `'not_found'`, `'checkin_due'`, `'review_due'`, `'review_available'`, `'future_date'`, `'locked_week'`, `'outside_window'`. Those are domain union members, not identifiers; leave them alone.

## Language

Multilanguage, **Czech-first**. Czech is the source of truth; every user-facing string must go through the translator element (no hardcoded text in components) so the UI can switch to English. Keep locale files as **mirrors** — English is a key-for-key copy of the Czech file; the two must always have identical keys.

## Domain rules (the part that's easy to get wrong)

- **Reference week**: user's usual weekly time (min) and stakes (CZK). Baseline for comparison.
- **Limits**: auto-suggested at **80%** of reference; user may adjust down, or up to at most **90%**. These (80/90) are centrally managed constants. If reference is 0, limit is 0, percentages hidden, any positive value = exceeded.
- **Limit is on stakes, not winnings.** Financial limit tracks total amount staked only. Winnings are recorded solely to compute net loss; they never affect limit fulfillment.
- **Daily check-in** covers the *previous* calendar day. Default question: "did you play yesterday?" No → store zeros, valid record. Yes → time, stakes, winnings. ~45s.
- **Missing ≠ no-play.** A no-play day is a valid record (played=false, zeros). A missing check-in is NA — must be surfaced on the dashboard and via a reminder. Backfill allowed for a still-missing day only inside a rolling **5-day window** (`BACKFILL_WINDOW_DAYS`): a day is fillable iff `1 ≤ studyDay(today) − studyDay(day) ≤ 5` **and** its week isn't review-closed (the window may reach into a previous, not-yet-closed week). Enforced once in `canEditCheckIn` (`src/domain/guards.ts`), reused by the check-in service and the dashboard's `backfillable` flag; an out-of-window/closed-week submit is refused with a localized `CHECKIN_OUTSIDE_WINDOW` / `CHECKIN_WEEK_CLOSED`. Backfill status is never shown to the user in-app (it *is* flagged in the CSV export + audit log — see below).
- **States**: OK ≤ 80%, POZOR (warning) > 80% ≤ 100%, PŘEKROČENO (exceeded) > 100%. Computed separately for time and stakes; overall = the worse of the two, but UI always shows both + remaining. Percentages are vs the **weekly limit**, not the reference.
- **Coping strategy**: chosen at onboarding (≥1). Feedback reminds it on POZOR/PŘEKROČENO.
- **28-day self-tracking, individual weeks.** Day 1 = **the calendar day onboarding is completed** (`intervention_start_date`), so the first check-in comes the very next morning. (Deviates from the spec's "first full calendar day after onboarding" — see [docs/decisions.md](docs/decisions.md). Day 1 is therefore a partial day.) Week 1 = days 1–7, …, Week 4 = days 22–28. Not calendar weeks, not rolling 7 days.
- **Reviews** offered after days 7/14/21 (e.g. week-1 review opens during day 8, even if day-7 check-in is missing). Set both limits for next week, again ≤ 90% of reference. Previous limits are never overwritten — one historical record per week. Final summary opens during day 29, no next-week limits. Reviews must be completable even with missing check-ins (saved as `incomplete`).
- **Derived, never stored**: cumulative usage, net loss, weekly totals, overall state — always computed from source records + limit history.

## Data model — the rule, not the fields

Four record types carry the intervention: `profile`, `limit` (one per week), `check_in`, `review`. Four more exist and are just as real — `coping_strategy` and `usage_event` (both required by the brief), `check_in_edit` (the append-only edit audit trail) and the global `contact` directory (no `user_id`, not per-user). Exact fields, keys and invariants: [docs/data-model.md](docs/data-model.md).

**The one thing to never break:** cumulative usage, net loss, weekly totals, and overall state are *derived* from source records + limit history — never stored.

## Must work (jury clicks through on a phone, no code changes)

Onboarding (reference, suggested limits, adjust within range, coping) · daily check-in incl. backfill within the rolling 5-day window · cumulative weekly evaluation vs both limits with immediate feedback (remaining time & amount) · dashboard (limits, progress, % used, missing data) · reviews after 7/14/21 + final summary after 28 · one working reminder scenario clicking through to check-in (trigger may be simplified — note it in README) · runs on mobile, data survives refresh · **CSV export** (raw tables — see below) · **seed data + reset/demo mode** so the jury can verify missing day, backfill, weekly review, and final summary without waiting 28 real days.

## Reference scenario (seed data must reproduce)

Reference 600 min (10h) / 10 000 CZK → suggested 480 min (8h) / 8 000 CZK → adjust cap 540 min (9h) / 9 000 CZK. At 350 min (5h50m) / 6 500 CZK: time 73% (OK), stakes 81% (POZOR), overall POZOR.

## CSV export (mandatory)

**Agreed shape: raw tables, as raw as it gets** ([why](docs/decisions.md)). User-triggered, one ZIP with four CSVs — `profile`, `check_in`, `limit`, `coping_strategy` — each a straight dump of the stored table, no derived rows. This is a deliberate team decision (see README's "Exporting data from app"), taken over the person-day shape the spec's Příloha 2 describes.

What that means in practice, and why it is not an oversight: a day with no check-in has **no row at all** rather than a blank-valued one, and there is no derived `study_day` / `checkin_status`. The one derived exception is `is_backfill` on the `check_in` table — a boolean computed at export time (via `isBackfill`, submitted more than a calendar day after the day it covers), added so a backfilled record is distinguishable in the dump. Anyone comparing the export against Příloha 2 will still see differences — they are intended.

**Still true, and easy to get wrong:** a no-play day is a real record — `played=false` with **zeros**. It is not the same as a missing day, which simply has no row. Never write zeros to stand in for "no data".

## Required tests (graded)

80% limit suggestion (time & money), 90% adjust cap (time & money), the three states, and ≥1 missing-record case.

## Licensing

MIT, permissive deps only. Full policy in README/LICENSE. Disclose AI-assisted code on submission.
