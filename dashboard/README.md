# Tri Dashboard

Live training, recovery and race-readiness dashboard. Next.js on Vercel.

Data comes from **intervals.icu** (Garmin activities + Whoop recovery) via a
server-side API route, so the API key never reaches the browser.

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `INTERVALS_API_KEY` | yes | intervals.icu -> Settings -> Developer. Auth is HTTP Basic with username `API_KEY`. |
| `INTERVALS_ATHLETE_ID` | no | Defaults to `i119853`. |

## Tabs

- **Today** — race countdown, readiness verdict, recovery markers, today's session
- **Week** — planned against actual, weekly volume by sport
- **Trends** — longest run per week, sleep, HRV, fitness/fatigue/form
- **Sessions** — every session, tap for detail

## Notes

- `/api/data` is `force-dynamic` and never cached, so every load is current.
- Activity rows with a null sport or zero duration are intervals.icu artefacts
  and are filtered out before anything is counted.
- Sport colours are validated for colour-vision deficiency in both light and
  dark mode. Sleep and HRV are deliberately separate charts — different scales
  must never share an axis.
- Longest run is **session distance including walk breaks**, not continuous
  running. The race run is planned as run-walk.

## Local

```bash
npm install
INTERVALS_API_KEY=... npm run dev
```
