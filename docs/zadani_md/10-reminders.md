# 10 — Reminders / Notifications

Delivers one working reminder scenario with a tap-through into the check-in.
The brief allows a simplified trigger, but you have to say so in the README
— it's an explicit condition of that shortcut being acceptable.

## Inputs
- current study day, list of missing days (docs 02, 08)
- notification permission state

## Outputs
- a notification with a deep link / route into the check-in for a specific
  `behavior_date`
- an in-app banner as a guaranteed fallback

## Rules
- The app has to alert the user about a missing check-in in two places: on
  the dashboard (missing days shown, offer to fill in) and via a
  notification prompting backfill.
- One functional scenario with click-through is enough. Don't build a
  scheduling engine — that's scope the brief didn't ask for.
- The simplification has to be documented in the README, not just quietly
  present.

## Recommended scope — cheapest thing that fully satisfies the requirement
```
Trigger:  app open, or a short in-session timer, or an explicit
          "send me a test reminder" dev control
Condition: exists a day ≤ today−1 in the current week with no check-in
Action:   Notification("You haven't logged yesterday") → tap →
          /checkin?date=YYYY-MM-DD  → prefilled form
```
An explicit, dev-triggered notification is defensible and demoable. A
half-working background scheduler that doesn't fire during the actual demo
slot is worth nothing — pick the one that survives being clicked on stage
in front of the jury.

## Patterns
- Ports & adapters again: `NotifierPort.notify(payload)`, with a
  web-notification adapter and an in-app-banner adapter. If permission is
  denied on the jury's phone — likely — the banner alone still demonstrates
  the whole flow. That fallback is the actual difference between a working
  demo and an awkward one.
- Deep link routing: the notification carries `behavior_date`; the route
  resolves it through the same edit policy from doc 05, so a link to a
  now-closed week lands somewhere sensible instead of a broken form.
- Policy object: `shouldRemind(today, checkins) → date | none`. Pure,
  testable, reused by both the notification and the dashboard banner —
  don't duplicate this logic between the two.

## Edge cases
- Permission denied or unsupported → fall back to the in-app banner, never
  a silent failure with nothing shown.
- iOS Safari PWA notification support is historically restrictive and
  generally requires the app to be installed to the home screen. Assume
  the jury's phone will hit this, and build the fallback first, the
  notification second.
- Notification for a day that got backfilled in the meantime → re-evaluate
  on tap, land on the dashboard if nothing's missing anymore.

## README lines to pre-write
```
Reminder trigger is simplified: it is evaluated on app open and can be
fired manually from the developer drawer. No background scheduler is
implemented. Deep link into the check-in for a specific behavior_date works
in both cases. In-app banner is the fallback when notification permission
is unavailable.
```

## Open questions
- One reminder type enough, or does a "time to check in" reminder matter
  too, alongside "you missed a day"? Brief asks for one functional scenario
  — default to the missing-day one, since it's the one directly tied to the
  missing-≠-zero requirement elsewhere in the spec.
