# Handover

Who picks up what, and what state they'd be picking it up in. This is the **one place**
open work is tracked — README and architecture.md point here rather than keeping their own
copies, because three lists is how the last set drifted.

## Where the project stands

The complete loop the brief asks for runs end to end, on a phone, with no code changes:

**onboarding → daily check-in → immediate feedback → dashboard → weekly review → final
summary**, plus CSV export and one working reminder.

Everything below that line is either a deliberate simplification (recorded in
[decisions.md](decisions.md)) or an open gap (listed here). Nothing is half-built and
undocumented — that was the point of the audit pass.

Health at handover: `npm run check` green — typecheck, type-aware ESLint, Prettier and
347 Jest tests across 62 suites.

## Open work — ranked

Ranked by what blocks a jury flow or a stated requirement, not by effort. **Owner column is
deliberately empty — fill it in when you split the work.**

| # | What | Why it matters | Where | Size | Owner |
|---|---|---|---|---|---|
| 1 | **`usage_event` is never emitted** | The brief marks the engagement log **required**. The store, `UsageEventAdapter` and port all exist and `createDataLayer()` wires the adapter — but no service injects it, so the table is always empty. This is the only gap that isn't a conscious trade-off. | inject `UsageEventRepository` into the services that should emit: onboarding (`onboarding_completed`), app start (`app_opened`, `exposed`), review (`review_reached`) | S–M | |
| 2 | **Seed data is dev-only** | `window.__seed` sits behind `import.meta.env.DEV`, so the deployed GitHub Pages build cannot load a scenario. If the jury clicks through the deployed URL rather than a local dev server, the reference scenario is unreachable. | `src/main.tsx` (the DEV guard), `src/dev/seed.ts` | S | |
| 3 | **`reviewable_weeks` hardcoded empty** | `buildDashboardVM` never fills it, so `pendingAction` can't resolve to `review_available` and the dashboard never *offers* a review on its own. Reviews are still reachable (see below), so this is polish, not a blocker. | `src/domain/dashboard.ts:211`, `dashboardServiceImpl.ts` — `ReviewRepository` is already injected for exactly this | S | |
| 4 | **Reminder fires on one hardcoded slot** | `REMINDER_TIMES: ['15:30']` stands in for a user-settable notification time. Fine for the demo, flagged as a simplification — the brief only requires *one* working scenario. | `src/domain/config.ts` | M (needs a settings surface) | |
| 5 | **Reports tab before day 29** | The tab is reachable from day 1 but the screen is designed as the *final* summary; unreached weeks render locked. Honest, but it is a product decision whether it should be there at all before day 29. | `src/ui/review/`, `TabBar` | product call | |
| 6 | **`mobile-safari` e2e never run** | Only Chromium was installed and exercised. | `npx playwright install webkit` | S | |

### Not on this list any more

**Week 2–4 limits.** `buildDashboardVM` still throws `DASHBOARD_NO_LIMIT` when a new week
has no limit — but that is now the *designed* path: `DashboardFlow` catches the code and
routes the user into the review flow to set the week's limits (`af4ee36`). If you read an
older note calling this a crash, it is out of date.

## Running a demo

The jury flow depends on being able to move through 28 days in minutes.

**Time machine** — works in the production build:

1. Open the dashboard and tap the **day heading** ("Den 1") **7×**, with no pause longer
   than 2 seconds.
2. The panel offers: *Přejít na den intervence* (jump to any study day), *Čas dne* (time of
   day, for testing the 15:30 notification slot), and *Smazat data* (wipe and start over —
   irreversible, keeps the contacts directory).

**Seed data** — dev build only (see open item 2). With `npm run dev`, in the console:

```js
await __seed({ /* scenario */ })   // then reload
```

It writes straight through the repositories, bypassing every guard, and fakes time by
backdating `interventionStartDate` — no clock is mocked. `docs/Tests.txt` holds a
hand-written 29-day scenario to reproduce.

**Reference scenario** (the numbers the brief checks): reference 600 min / 10 000 CZK →
suggested 480 / 8 000 → cap 540 / 9 000. At 350 min / 6 500 CZK: time 73 % (OK), stakes
81 % (POZOR), overall **POZOR**.

**PWA / service worker** is off in dev — verify install and offline behaviour with
`npm run build && npm run preview`.

## Submission checklist

What [the brief's doc 15](zadani_md/15-submission-checklist.md) asks for, and where it
already lives:

| Required | Where | State |
|---|---|---|
| Repository with readable history | this repo | ✅ |
| Running app or reproducible build | [README § Getting started](../README.md#getting-started) + the deployed Pages URL | ✅ |
| Architecture description | [architecture.md](architecture.md) | ✅ |
| Data-model description | [data-model.md](data-model.md) | ✅ |
| Tests | `npm run check`; the four graded cases are in `tests/jest/domain/limits.test.ts` and the missing-record cases in `checkin`/`dashboard` tests | ✅ |
| Statement of what's done and what was deliberately left out | [decisions.md](decisions.md) + this file | ✅ |
| Known limitations and technical debt | this file + [README § Technical debt](../README.md#technical-debt) | ✅ |
| Proposal for what to finish before a pilot | [README § Suggested next steps](../README.md#suggested-next-steps) | ✅ |
| Seed data for the reference scenario | `src/dev/seed.ts` + `Tests.txt` | ⚠️ dev-only — open item 2 |
| Short live demo | script in [doc 15](zadani_md/15-submission-checklist.md#demo-script-15-minutes--rehearse-it-once-before-sunday-afternoon) | rehearse |
| AI tools declared | [README § Tooling disclosure](../README.md#tooling-disclosure) | ✅ |
| Dependency licences listed | [README § Dependency licenses](../README.md#dependency-licenses) | ✅ |
| MIT `LICENSE` in the root | `LICENSE` | ✅ |

## If you're new here

Read in this order — about an hour:

1. [../CLAUDE.md](../CLAUDE.md) — the domain rules in one page. The parts that are easy to
   get wrong are marked as such.
2. [architecture.md § Layers & flow](architecture.md#layers--flow) and
   [§ The shape every service shares](architecture.md#the-shape-every-service-shares) — how
   a request travels, and the five conventions every service follows.
3. [data-model.md](data-model.md) — the tables and, more importantly, the invariants.
4. [decisions.md](decisions.md) — **before** you "fix" anything that looks wrong against
   the brief. Two things that look like bugs are decisions.

Then run `npm run dev`, complete onboarding, and use the time machine to walk a week.

Three rules that bite if you skip them:

- **Domain stays pure.** ESLint blocks `src/domain/**` from importing react/dexie/zustand/
  `@ui`/`@data`. The lint gate fails, not a runtime error.
- **No hardcoded user-facing strings.** Everything goes through the translator, and the
  Czech and English locale files must stay key-for-key mirrors.
- **Never store a derived value.** Cumulative usage, net loss, weekly totals and overall
  status are always computed from source records plus limit history.
