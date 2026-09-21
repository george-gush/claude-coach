# Athlete Profile

Last updated: 2026-09-21
Status: **ACTIVE** — built from measured intervals.icu data, not from estimates.

## Data sources

- **intervals.icu** — connected. Athlete `i119853` ("Gjar93"), Abu Dhabi, Asia/Dubai.
  Read through the REST API with `INTERVALS_API_KEY`.
- **Garmin Forerunner 970** — the device behind every usable activity record.
  `source = GARMIN_CONNECT` on all 7 swims.
- **Strava** — 56 records present but **unreadable**. intervals.icu returns
  `"STRAVA activities are not available via the API"`. Any gym session logged
  through Strava is invisible to this profile.
- **Whoop** — **no Whoop-sourced record found.** Every activity comes from
  Garmin. Whoop may sync elsewhere, or under a different account.
- TrainingPeaks: not connected.

## Physical data

| Field | Value | Source |
|---|---|---|
| Sex | Male | Stated, and confirmed by intervals.icu profile |
| Age | 32 | Stated |
| Height | 174 cm | Stated |
| **Bodyweight** | **74.0 kg** | **Garmin, logged on all 7 swims.** Athlete said 75 kg |
| Resting HR | 47–57, trend down | intervals.icu wellness, 14 days |
| HRV | 21.7–30.2, trend up | intervals.icu wellness, 14 days |
| Body-fat % | — | Not measured. 15% assumed for the REDs floor |

Derived at 74 kg: BMR **1672 kcal**. Baseline (x1.2) **2007 kcal**.

## Training load (intervals.icu, 2026-09-21)

CTL 17.4 · ATL 20.8 · TSB −3.4. CTL rose 14.3 → 18.7 over two weeks, so the
athlete is ramping. Resting HR falling and HRV rising across the same window
means the ramp is being absorbed well at present.

## Disciplines — measured, 2026-08-28 to 2026-09-20

This is a **multi-sport load**, not the swim-plus-gym pattern first recorded.

| Discipline | Sessions | Range |
|---|---|---|
| Run | 13 | 0.3–6.3 km, up to 487 kcal |
| Swim | 7 | 200–1125 m |
| Ride | 3 | 16.7–54.8 km. The 09-14 ride was 134 min, 1270 kcal |
| Gym / strength | **0 recorded** | Not in the API. Strava-logged or unlogged |

Earliest typed activity is 2026-08-28, so this record covers ~3.5 weeks only.

### The swim sessions

| Date | Day | Start | Distance | Elapsed | kcal gross | kcal net | Avg HR | RPE |
|---|---|---|---|---|---|---|---|---|
| 09-01 | Tue | 07:04 | 200 m | 63 min | 304 | 231 | 91 | 8 |
| 09-03 | Thu | 07:03 | 0 m* | 60 min | 0* | — | 88 | 6 |
| 09-06 | Sun | 15:36 | 1125 m | 56 min | 281 | 216 | 111 | — |
| 09-10 | Thu | 07:15 | 625 m | 68 min | 250 | 172 | 90 | 4 |
| 09-15 | Tue | 17:32 | 320 m | 11 min | 75 | 62 | 107 | 5 |
| 09-15 | Tue | 17:51 | 780 m | 33 min | 234 | 196 | 117 | 7 |
| 09-20 | Sun | 14:44 | 1125 m | 52 min | 322 | 262 | 122 | 7 |

*The 09-03 record failed to capture distance or calories.

**The morning class** (07:00–07:15 starts) is a low-intensity, long-duration,
low-distance session. 200 m in 63 minutes at an average HR of 91 is a
technique or learn-to-swim format, not a conditioning swim. Note that the
athlete rated 09-01 at RPE 8 while HR stayed at 91 — difficulty is technical
and psychological, not cardiovascular.

**Only one Tuesday morning swim exists** in the record (09-01). The other two
morning swims fall on Thursday. The 09-15 Tuesday swims are evening sessions.

## Sleep — flagged

Mean **6.4 h** over 14 nights. **5 of 14 nights under 6 h.** Lowest 4.7 h.
This runs alongside a rising CTL. Sleep is the largest available recovery
lever here, and it is larger than any nutrition change.

## Thresholds

None established. No CSS, no FTP, no threshold pace. Prescribe by RPE.
A 400 m + 200 m timed trial would set CSS and make swim sessions measurable.

## Goals

**Not yet defined.** The run, ride and swim mix suggests triathlon intent,
but nothing is confirmed. All nutrition targets stay at maintenance until
a goal and a date exist.

## Open actions

1. Define the goal and its date.
2. Log gym sessions somewhere readable. They are the one training input
   still being estimated rather than measured.
3. Confirm bodyweight: Garmin says 74.0 kg, athlete said 75 kg.
4. Measure body fat to firm up the REDs floor.
5. Address sleep before any further nutrition tuning.
6. Establish CSS from a 400 m + 200 m trial.
