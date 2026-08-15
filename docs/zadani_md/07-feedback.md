# 07 — Automatic Feedback

Immediately after a check-in, tell the user where they stand for the week —
and at POZOR and PŘEKROČENO, remind them of their chosen coping strategy.

## Inputs
- the just-saved check-in
- `WeekEvaluation` recomputed for the current week (doc 06)
- `profile.coping_strategy`

## Outputs
- a feedback view/payload:
  - both dimensions' status and percentage
  - how much specifically remains (minutes and CZK)
  - coping-strategy reminder when status is POZOR or PŘEKROČENO
  - a route back to the dashboard

## Rules
- Feedback is automatic — it follows the save, it's not a separate action
  the user has to trigger.
- Both dimensions are always shown, with remaining amounts, not just the
  worse one.
- Coping strategy shows at POZOR *and* PŘEKROČENO, not only once exceeded.
- The app is explicitly not a substitute for professional treatment or
  crisis help; target users are 18–34 wanting more control, not in crisis.
  Keep the tone factual and non-judgemental — nothing that reads as clinical
  advice.

## Content shape (suggested)
```
Week 2 · after your check-in

Time    350 / 480 min      73%   OK        130 min left
Stakes  6 500 / 8 000 CZK  81%   POZOR     1 500 CZK left

Overall: POZOR
→ Your strategy: go outside for 15 minutes
```

## Patterns
- Presenter / view-model: `WeekEvaluation` + profile → a flat, formatted
  structure. Formatting (h/min, thousands separator, percent) belongs here,
  not scattered across the domain and the template.
- Rule table instead of branches: map status → {message key, show coping?}.
  Three rows. Easy to reword on the fly if the jury asks for different
  wording at 14:00 on day two.
- Flat i18n key/value map even if you only ever ship Czech text — costs
  nothing now, and the repo is going open source in English-speaking
  context.

## Edge cases
- A check-in with `played = false` can still produce POZOR/PŘEKROČENO
  feedback, carried over from earlier days in the week. Don't special-case
  "didn't play today" into a congratulatory message that contradicts the
  week's actual status.
- Zero limit → no percentage, but the message still has to read coherently
  ("any wagering is above your limit").
- Missing days in the week → feedback should carry the same "data
  incomplete" note the dashboard shows. Staying silent here overstates how
  well the week is actually going.

## Open questions
- Should feedback ever be celebratory at OK? Nothing in the brief asks for
  it. Keep it factual — for a gambling intervention specifically, not
  gamifying the good weeks is a defensible design choice worth stating out
  loud in the demo, not just an omission.
