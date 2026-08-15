# NUDZ_gamble

PWA for harm reduction in gambling — DigiWELL Hackathon 2026.

> **Status: technology bootstrap only.** The toolchain, build, PWA shell and the three
> test runners are wired up and green. No intervention logic has been implemented yet;
> `src/domain/` is intentionally empty.

## Stack

| Concern       | Choice                                    | Notes                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Build / dev   | Vite 8                                    | `host: true` so the app opens from a phone on the same LAN   |
| UI            | React 19                                  |                                                              |
| State         | Zustand 5                                 | UI/app state; persistent data stays in Dexie                 |
| Language      | TypeScript 6.0 (`~6.0.3`)                 | Pinned to 6.x — see "Why TypeScript 6" below                 |
| Styling       | Tailwind CSS 4 (`@tailwindcss/vite`)      | No `tailwind.config.js`; theme lives in `src/index.css`      |
| Local storage | Dexie 4 (IndexedDB)                       | Survives refresh; swappable for a server later               |
| PWA           | `vite-plugin-pwa` (Workbox)               | Manifest + service worker, `devOptions.enabled` for dev      |
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
  ui/        layer A — presentation (React)
  domain/    layer B — intervention logic (pure; empty for now)
  data/      layer C — persistence (Dexie/IndexedDB)
tests/
  jest/      unit tests (own tsconfig + setup), mirror the src/ structure
  e2e/       Playwright specs (own tsconfig)
public/      icons, favicon
```

Path aliases `@/`, `@ui/`, `@domain/`, `@data/` are configured in `tsconfig.app.json`,
`vite.config.ts` and `jest.config.ts` (Jest does not read Vite's resolver, so the mapping
is restated there).

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

## Dependency licenses

The project is released under MIT (`LICENSE`). All direct dependencies are permissive and
MIT-compatible; there is no GPL/LGPL/AGPL or share-alike code in the tree.

- **Apache-2.0** — `typescript`, `dexie`, `fake-indexeddb`, `@playwright/test`
- **MIT** — everything else: `react`, `react-dom`, `zustand`, `vite`, `@vitejs/plugin-react`,
  `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`, `eslint`, `@eslint/js`,
  `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`, `prettier`, `prettier-plugin-tailwindcss`,
  `@testing-library/react`, `jest`, `ts-jest`, `jest-environment-jsdom`, and the
  `@types/*` packages (DefinitelyTyped)

Icons in `public/` are generated for this repository and carry no third-party license.

## Known gaps

- `src/domain/` is empty — no intervention logic, limits, check-in or review flow yet.
- `src/data/db.ts` opens a placeholder store (`_bootstrap`); the real schema is not modelled.
- CSV export, seed/demo mode and the reminder scenario required by the brief are not built.
- Playwright's `mobile-safari` project needs `npx playwright install webkit`; only
  Chromium was installed and exercised so far.

## Tooling disclosure

Project bootstrap was generated with the assistance of Claude (Anthropic).
