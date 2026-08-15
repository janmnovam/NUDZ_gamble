# CLAUDE.md

Self-control app for gambling harm reduction (DigiWELL Hackathon 2026). PWA,
single demo user, local-only data, one complete loop: onboarding → daily
check-in → automatic feedback → dashboard → weekly review.

Target users: 18–34 y/o wanting more control over their gambling. Not a
substitute for treatment. **Priority: a narrower, reliable, extensible core
beats more half-finished features.**

## Where things live (single source of truth — don't copy here)

- Stack, commands, scripts, layout, licenses → [README.md](README.md).
- Full requirements, data model, CSV export spec → [Zadání_Hackathon_2026_shared.docx.md](Zadání_Hackathon_2026_shared.docx.md) (Czech, authoritative). The rules below are an English digest, not a replacement.
- **Runtime stack:** TypeScript + Tailwind + React + Vite, persistence on IndexedDB via Dexie in `src/data/`. (Test runners, ESLint/Prettier, and `vite-plugin-pwa` are dev tooling, not runtime deps.)
- **Architecture rule that bites:** the ESLint `no-restricted-imports` rule forbids `src/domain/**` from importing react/dexie/zustand/`@ui`/`@data`. Keep domain pure and storage-agnostic, or the lint gate fails.

## Workflow

- Run `npm run check` (typecheck + type-aware ESLint + Prettier + Jest) before every commit — it's the CI gate. `npm run lint:fix` and `npm run format` autofix most of what it flags.

## Language

Multilanguage, **Czech-first**. Czech is the source of truth; every user-facing string must go through the translator element (no hardcoded text in components) so the UI can switch to English. Keep locale files as **mirrors** — English is a key-for-key copy of the Czech file; the two must always have identical keys.

## Domain rules (the part that's easy to get wrong)

- **Reference week**: user's usual weekly time (min) and stakes (CZK). Baseline for comparison.
- **Limits**: auto-suggested at **80%** of reference; user may adjust down, or up to at most **90%**. These (80/90) are centrally managed constants. If reference is 0, limit is 0, percentages hidden, any positive value = exceeded.
- **Limit is on stakes, not winnings.** Financial limit tracks total amount staked only. Winnings are recorded solely to compute net loss; they never affect limit fulfillment.
- **Daily check-in** covers the *previous* calendar day. Default question: "did you play yesterday?" No → store zeros, valid record. Yes → time, stakes, winnings. ~45s.
- **Missing ≠ no-play.** A no-play day is a valid record (played=false, zeros). A missing check-in is NA — must be surfaced on the dashboard and via a reminder. Backfill allowed only for still-missing days of the *current* week; closed weeks cannot be edited. Backfill status is never shown to the user.
- **States**: OK ≤ 80%, POZOR (warning) > 80% ≤ 100%, PŘEKROČENO (exceeded) > 100%. Computed separately for time and stakes; overall = the worse of the two, but UI always shows both + remaining. Percentages are vs the **weekly limit**, not the reference.
- **Coping strategy**: chosen at onboarding (≥2, active). Feedback reminds it on POZOR/PŘEKROČENO.
- **28-day self-tracking, individual weeks.** Day 1 = first full calendar day after onboarding (`intervention_start_date`). Week 1 = days 1–7, …, Week 4 = days 22–28. Not calendar weeks, not rolling 7 days.
- **Reviews** offered after days 7/14/21 (e.g. week-1 review opens during day 8, even if day-7 check-in is missing). Set both limits for next week, again ≤ 90% of reference. Previous limits are never overwritten — one historical record per week. Final summary opens during day 29, no next-week limits. Reviews must be completable even with missing check-ins (saved as `incomplete`).
- **Derived, never stored**: cumulative usage, net loss, weekly totals, overall state — always computed from source records + limit history.

## Data model — the rule, not the fields

Four record types: `profile`, `limit` (one per week), `check-in`, `review`. Exact fields are in the spec. **The one thing to never break:** cumulative usage, net loss, weekly totals, and overall state are *derived* from source records + limit history — never stored.

## Must work (jury clicks through on a phone, no code changes)

Onboarding (reference, suggested limits, adjust within range, coping) · daily check-in incl. backfill of current week · cumulative weekly evaluation vs both limits with immediate feedback (remaining time & amount) · dashboard (limits, progress, % used, missing data) · reviews after 7/14/21 + final summary after 28 · one working reminder scenario clicking through to check-in (trigger may be simplified — note it in README) · runs on mobile, data survives refresh · **CSV export at person-day level** (see below) · **seed data + reset/demo mode** so the jury can verify missing day, backfill, weekly review, and final summary without waiting 28 real days.

## Reference scenario (seed data must reproduce)

Reference 600 min (10h) / 10 000 CZK → suggested 480 min (8h) / 8 000 CZK → adjust cap 540 min (9h) / 9 000 CZK. At 350 min (5h50m) / 6 500 CZK: time 73% (OK), stakes 81% (POZOR), overall POZOR.

## CSV export (mandatory) — the gotcha

User-triggered, ≥1 CSV, one row per planned day 1–28 including no-play and missing days. Field list & conventions in the spec (Příloha 2). **Never confuse the two empties:** a no-play day is `completed`/`played=false` with **zeros**; a `missing` day leaves the value fields **blank/NA — never zeros**.

## Required tests (graded)

80% limit suggestion (time & money), 90% adjust cap (time & money), the three states, and ≥1 missing-record case.

## Licensing

MIT, permissive deps only. Full policy in README/LICENSE. Disclose AI-assisted code on submission.
