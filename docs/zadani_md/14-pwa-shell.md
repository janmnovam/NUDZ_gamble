# 14 — PWA Shell & Delivery

Gets the app onto the jury's phone, working, with data surviving refresh.
PWA is *recommended* by the brief, not mandated — but "runs on a phone" and
"data survives refresh" are hard requirements regardless of how you deliver
it.

## Requirements
- App runs on a phone (PWA recommended)
- Data survives refresh
- The jury clicks through the whole loop with no code changes
- Offline UI loading is listed as optional bonus, not a requirement — don't
  spend day-one time on it

## Minimum viable PWA
```
manifest.json   name, short_name, start_url, display: standalone,
                theme_color, icons (192, 512)
service-worker  cache the app shell; network-first or cache-first for
                static assets only
https           required for service workers and notifications
```
Don't attempt offline data sync. Offline *shell* is the bonus; offline
*sync* was never asked for, and it'll eat your Sunday for a feature nobody's
scoring.

## Hosting for the demo
The riskiest twenty minutes of a hackathon is "it works on my laptop."
Decide this early, not on Sunday:

| Option | Notes |
|---|---|
| Static host (Netlify/Vercel/GH Pages) | HTTPS free, QR code straight to the jury's phone. Best option, no contest. |
| Laptop dev server on LAN | No HTTPS → no service worker, no notifications. Avoid. |
| Local network + self-signed cert | Fiddly on iOS specifically. Avoid. |

Deploy something trivial Saturday morning, before the app does anything at
all. A "hello world" on the real URL at 10:30 removes the entire class of
Sunday-afternoon deployment panic — that panic is a solved problem the
moment the pipeline exists early.

## Mobile UI constraints
- Touch targets ≥ 44px; the check-in is a 45-second interaction, every extra
  mis-tap costs proportionally more.
- Numeric input modes for the three number fields.
- No hover-dependent affordances — there's no hover on a phone.
- Test on a real phone from hour two, not just a desktop emulator —
  safe-area insets, the keyboard covering the input field, and iOS scroll
  behaviour don't reliably show up in devtools.
- Handle the on-screen keyboard pushing the submit button off screen. This
  is *the* classic mobile form bug, and the jury will hit it within the
  first thirty seconds of the demo if it's not handled.

## Patterns
- App shell: static shell cached, data rendered client-side on top of it.
- Composition root: one file wires clock + storage adapter + notifier +
  services together. Swapping to fakes for tests or demo mode happens here
  and nowhere else in the codebase.
- Route guards derived from state: no profile → onboarding; review pending
  → review; day 29 → summary. Same priority order as doc 08's
  `pending_action` — define it once, reuse it, don't let routing and the
  dashboard CTA drift apart.

## Edge cases
- iOS PWA: notifications require install-to-home-screen. Assume failure and
  rely on the in-app banner fallback (doc 10) as the primary path, not a
  backup you hope not to need.
- Service worker caching a stale build during the demo itself — have a
  hard-refresh or version-bump story ready, and test the *deployed* build
  on the phone before your demo slot, not the dev build you were just
  running locally.
- Refresh mid-flow must not lose the profile — this is the same requirement
  as doc 11, tested end-to-end here on the actual delivery mechanism.

## Open questions
- Native wrapper, or plain web? Nothing in the brief suggests a wrapper is
  wanted, and PWA is explicitly the recommendation. Don't spend time
  deciding here.
