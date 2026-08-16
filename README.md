# NUDZ_gamble

PWA for harm reduction in gambling — DigiWELL Hackathon 2026.

**Install:** open https://janmnovam.github.io/NUDZ_gamble/ in a compatible browser, then use the install/share icon in the address bar or menu and select "Install" or "Add to Home Screen".

# Features
 
App helps users track and limit time and money spent on gambling, over a 4-week program.
 
- **Onboarding** — set a reference week (usual time/money spent), set limits for week 1, pick coping strategies.
- **Daily check-in** — log if you gambled yesterday, how long, how much. Reminder notification each day.
- **Dashboard** — shows current week status (OK / Exceeded), time and money used vs. limits, weekly calendar.
- **Reports** — weekly and final summaries, data export.

## Stack

| Concern       | Choice                                    | Notes                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Build / dev   | Vite 8                                    | `host: true` so the app opens from a phone on the same LAN   |
| UI            | React 19                                  |                                                              |
| State         | Zustand 5                                 | UI/app state; persistent data stays in Dexie                 |
| Language      | TypeScript 6.0 (`~6.0.3`)                 | Pinned to 6.x — see "Why TypeScript 6" below                 |
| Styling       | Tailwind CSS 4 (`@tailwindcss/vite`)      | No `tailwind.config.js`; theme lives in `src/index.css`      |
| Local storage | Dexie 4 (IndexedDB)                       | Survives refresh; swappable for a server later               |
| PWA           | `vite-plugin-pwa` (Workbox)               | Manifest + service worker; SW off in dev, verify via `preview` |
| Linter        | ESLint 10 + typescript-eslint (type-aware)| `strictTypeChecked` + `stylisticTypeChecked`                 |
| Formatter     | Prettier 3 + `prettier-plugin-tailwindcss`| `eslint-config-prettier` disables conflicting ESLint rules   |
| Unit tests    | Jest 30 + ts-jest (+ `fake-indexeddb`)    | Owns `tests/jest/**`, mirrors the `src/` structure           |
| E2E tests     | Playwright 1.62                           | Owns `tests/e2e/**`, runs against the production build       |

### Why TypeScript 6

TypeScript 7 (the native Go port) is the current `latest`, but `typescript-eslint` still
declares `typescript@>=4.8.4 <6.1.0` as a peer — type-aware linting does not work on TS 7
yet. The project is therefore pinned to `typescript@~6.0.3`, which is the newest release
the linter supports. Note TS 6 deprecates `baseUrl`, so `paths` in `tsconfig.app.json` are
written relative to the config file (`./src/*`).

## Getting started

Requires **Node ≥ 20.19** (Vite 8 needs it; older Node fails on startup with a
`styleText` import error from `node:util`).

```bash
npm install
npx playwright install    # once, downloads the e2e browsers
npm run dev               # http://localhost:5173 (also served on the LAN IP)
```

`npm install` also wires the Git hooks (see [Git hooks](#git-hooks)).

## Scripts

| Script                  | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Vite dev server, PWA enabled                                |
| `npm run build`         | `tsc -b` then production build + service worker             |
| `npm run preview`       | Serve the production build locally                          |
| `npm run typecheck`     | Typechecks the app, the Jest project and the e2e project    |
| `npm run lint`          | ESLint (type-aware); `lint:fix` to autofix                  |
| `npm run format`        | Prettier write; `format:check` to verify                    |
| `npm run test`          | Jest — `tests/jest/**/*.test.ts(x)`                          |
| `npm run test:coverage` | Jest with coverage over `src/domain` and `src/data`          |
| `npm run test:e2e`      | Playwright — `tests/e2e/**/*.spec.ts`                        |
| `npm run test:all`      | Unit + e2e tests                                            |
| `npm run check`         | typecheck + lint + format:check + Jest (CI gate)            |

## Layout

```
src/
  ui/        presentation (React); the only layer that reads a real clock
  app/       application layer — inbound ports, service impls, DTOs, mappers
  domain/    intervention logic (pure, no I/O) + the outbound port contracts
  data/      persistence — Dexie adapters over IndexedDB
  core/      composition root — createDataLayer() / createApp()
  dev/       seeding helpers for the demo (dev builds only)
tests/
  jest/      unit tests (own tsconfig + setup), mirror the src/ structure
  e2e/       Playwright specs (own tsconfig)
public/      icons, favicon
```

The layering is hexagonal (ports & adapters) — [docs/architecture.md](docs/architecture.md)
is the authoritative description, including the per-port build status. All the other
written material is indexed in [docs/README.md](docs/README.md), which also spells out
which document wins when two of them disagree.

Path aliases `@/`, `@ui/`, `@domain/`, `@data/` are configured in `tsconfig.app.json`,
`vite.config.ts` and `jest.config.ts` (Jest does not read Vite's resolver, so the mapping
is restated there). `src/app/` and `src/core/` have no alias of their own — they are
reached through `@/app/…` and `@/core/…`.

## CI / CD

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push and PR to `main`. A `quality` job (typecheck, lint,
  format check, Vitest, Jest, build) and a parallel `e2e` job (Playwright on Chromium +
  WebKit, report uploaded as an artifact). Both run on Node 22.
- **`deploy.yml`** — runs on push to `main` (or manually via _Run workflow_). Builds with
  `BASE_PATH=/NUDZ_gamble/`, adds `404.html` (SPA fallback) and `.nojekyll`, then publishes
  to GitHub Pages via `actions/deploy-pages`.

### Base path

The app is served from `https://janmnovam.github.io/NUDZ_gamble/`, so the production build
needs a matching base. `vite.config.ts` reads `process.env.BASE_PATH` (default `/`), and the
deploy workflow sets it to `/NUDZ_gamble/`. Dev, unit tests and local `npm run build` keep
the `/` base. The PWA `start_url` and `scope` are derived from the base automatically. If the
repository is renamed or moved to a custom domain, update `BASE_PATH` in `deploy.yml`.

### One-time repository setup

GitHub Pages must be switched to the Actions source before the first deploy:
**Settings → Pages → Build and deployment → Source → GitHub Actions**. No branch or
`gh-pages` folder is used — the site is served straight from the workflow artifact.

### Layer boundary is enforced by the linter

`eslint.config.js` adds a `no-restricted-imports` rule that forbids `src/domain/**` from
importing `react`, `dexie`, `zustand`, `@ui/*` or `@data/*`. The intervention logic stays pure and
storage-agnostic, so swapping IndexedDB for a server later does not mean rewriting it.

### Unit tests

Jest is the only unit-test runner. Tests live in `tests/jest/**` (mirroring `src/`), not
next to the sources — `tests/jest/tsconfig.json` is the only tsconfig that pulls in
`@types/jest`, so the app tsconfig stays free of test globals. IndexedDB is provided by
`fake-indexeddb` in the Jest setup file.

## Git hooks

Native hooks live in `.githooks/` (no dependency). The `prepare` script points Git at them
on `npm install` (`git config core.hooksPath .githooks`), so contributors get them
automatically — no manual setup.

| Hook | Runs | Blocks |
| ---- | ---- | ------ |
| `pre-commit` | `npm run lint` | the commit if ESLint fails |
| `pre-push` | `npm run test` (Jest unit; **e2e excluded**) | the push if a unit test fails |

Bypass in a pinch with `git commit --no-verify` / `git push --no-verify`. E2E runs only in
CI and via `npm run test:e2e`, never on push.

## Dependency licenses

The project is released under MIT (`LICENSE`). All direct dependencies are permissive and
MIT-compatible; there is no GPL/LGPL/AGPL or share-alike code in the tree.

- **Apache-2.0** — `typescript`, `dexie`, `fake-indexeddb`, `@playwright/test`
- **MIT** — everything else: `react`, `react-dom`, `zustand`, `vite`, `@vitejs/plugin-react`,
  `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`, `vite-plugin-mkcert`, `eslint`, `@eslint/js`,
  `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`, `prettier`, `prettier-plugin-tailwindcss`,
  `@testing-library/react`, `jest`, `ts-jest`, `jest-environment-jsdom`, and the
  `@types/*` packages (DefinitelyTyped)

Icons in `public/` are generated for this repository and carry no third-party license.

## Known gaps

The full, ranked list with owners and next steps is
[docs/handover.md](docs/handover.md) — kept in one place so it stays true. The
headlines:

- **`usage_event` is never written.** The store, adapter and port exist, but nothing
  emits a row. The brief marks this log required, so it is the one gap that is not a
  deliberate simplification.
- **`reviewable_weeks` is hardcoded empty** in `buildDashboardVM`, so the dashboard can
  never resolve `pendingAction` to `review_available` on its own. Wiring, not missing
  logic.
- **Reminders fire on a single hardcoded slot** — `REMINDER_TIMES` is `['15:30']`, a demo
  simplification standing in for a notification-time setting the user can change.
- **Seed data is dev-only** — `window.__seed` is behind `import.meta.env.DEV`, so the
  deployed build cannot load a scenario. The time machine (day/time jump, reset) does
  work in production.
- Playwright's `mobile-safari` project needs `npx playwright install webkit`; only
  Chromium was installed and exercised so far.

## Debug mode

- A hidden feature that lets QA/testing set a specific intervention date or delete all data.
- This allows testing specific time periods without waiting for real time to pass.
- It's hidden behind the "Den 1" day heading shown on the Home screen.
- QA/testing must tap that heading exactly 7 times, with no pause longer than 2 seconds
  between taps, to reveal the Debug mode GUI (`useMultiTap` in `src/ui/admin/`).

## Exporting data from app

- The user can export data at any point during the intervention, via a dedicated button at the bottom of the Dashboard screen or during the weekly review.
- 4 .csv files are exported (and zipped together so that user doesn't have to select separate files).
  - .csv file nr.1 is export of CHECK_IN table containing fields:
    - check_in_id
    - user_id
    - behavior_date
    - played
    - time_min
    - stakes_czk
    - winnings_czk
    - submitted_at
    - updated_at
    - is_backfill (derived at export time: submitted more than a calendar day after the day it covers)
  - .csv file nr 2 is export of LIMIT table containing fields:
    - limit_id
    - user_id
    - week_no
    - weekly_limit_time_min
    - weekly_limit_stakes_czk
    - limit_set_at
  - .csv file nr 3 is export of COPING_STRATEGY table containing fields:
    - coping_strategy_id
    - user_id
    - label
    - type
    - when_to_use
    - how_to_start
    - active
    - created_at
    - updated_at
  - .csv file nr 4 is export of PROFILE table containing fields:
    - user_id
    - onboarding_completed_at
    - intervention_start_date
    - reference_time_min
    - reference_stakes_czk
- Format:
  - UTF-8
  - date YYYY-MM-DD
  - timestamps ISO 8601 including timezone
  - time_min as whole minutes
  - amounts in whole CZK
  - separator comma

## Technical debt

- TypeScript pinned to 6.x — dependency-driven, not a design choice. Revisit once typescript-eslint supports TS 7, since it blocks tooling/perf improvements.

## Suggested next steps

Not included in the hackathon version:
- Counting gains during betting.
- Logic of gains vs bets (net gain / loss).
Logical problems:
- After setting new weekly limits the user is not able to backfill for previous week anymore.
- Locking mechanism now doesn't have specific colour for "no backfill" but part of program. At the moment everything is grey.
Nice-to-have features (possible next steps before pilot):
- Filling new week's limit should not allow me to go over 90% of referential values of amount and time spent gambling.
- Allowing user to submit notes / feedback (free text). 
- Allowing user to edit already filled days (for both time and amount gambled).
- Tracking what dates were edited and how.
- Motivating user to lower their limits during every new week of intervention by 10% (meaning 1st week limit = 10 000 CZK, 2nd week limit suggestion 9 000 CZK).
- User profile accessing during the intervention (with optional choice to set the time of notifications).
- Homescreen shows all 28 days of the program, not just this week (allows user to backfill more easily in the 5 days window).
- Graphs for each review week.
- Consents (for the RCT user consent in paper form f2f)
- Opt-out of notifications.
- Change notification time.

## Tooling disclosure

Project bootstrap was generated with the assistance of Claude (Anthropic).
