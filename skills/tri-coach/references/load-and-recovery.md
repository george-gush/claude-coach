# Load, Readiness and Recovery

Turn recovery data into a decision: go, soften, or stop. Never report a number
without a decision attached to it.

---

## 1. Where the data comes from

All of it is in intervals.icu. Whoop feeds sleep, HRV, resting HR and readiness.
Garmin feeds the workouts.

```
GET /api/v1/athlete/i119853/wellness?oldest=<date>&newest=<date>
```

Fields that matter: `hrv`, `restingHR`, `sleepSecs`, `readiness`, `ctl`, `atl`.
Form is `ctl - atl`; intervals.icu does not return it directly, so compute it.

```
GET /api/v1/athlete/i119853/activities?oldest=<date>&newest=<date>
```

**Data hygiene — apply before trusting anything:**
- Activities with `type: null` and zero duration are artefacts. Filter them out.
- Treadmill and GPS pace in the city both lie. Use heart rate indoors.
- Swim distances from lessons are short because of drills and rests. That is not
  a fitness signal — do not read it as one.
- One reading is noise. A 7-day trend is signal. Always.

---

## 2. This athlete's baselines — as of 19 September 2026

| Metric | Baseline | Current | Read |
|---|---|---|---|
| HRV | ~30 (late Aug) | **~25** | ⚠️ Down ~17%. Falling trend. |
| Resting HR | 49–57 | 49–53 | Normal and stable |
| Sleep | — | **5–7 h**, one night at 4.7 h | ⚠️ Chronically short |
| Form (CTL−ATL) | — | **−7 to −18** | ⚠️ Never positive in 3 weeks |
| Fitness (CTL) | 11.6 → 18.7 | rising ~+2.4/week | Fine. This is not the problem. |

**Read these together.** The training ramp is sensible. The recovery is not.
Falling HRV plus short sleep plus permanently negative form is the pattern that
comes before injury and illness. Adding two 90-minute gym sessions on top of it
needs sleep to improve first.

Update this table at every weekly check-in.

---

## 3. Daily decision rules

Use the **7-day average** HRV against his own baseline, not yesterday's number.

**GREEN — proceed as planned**
7-day HRV in or above the normal range, resting HR normal, sleep adequate, no
unusual soreness, knee green. This is the only state in which to schedule a
breakthrough session or add distance to the long run.

**AMBER — keep the duration, drop the intensity**
Any one of: 7-day HRV below normal range; resting HR up about 5 bpm; sleep under
6 h before a key session; unusual soreness; knee amber.
Action: keep the session length, convert the work to easy aerobic. Or swap it
with an easy day later in the week. Re-check tomorrow.
**Two amber days in a row counts as red.**

**RED — rest or very easy only**
7-day HRV suppressed for 3 days or more; resting HR up 5–7 bpm with symptoms;
any illness sign; knee red.
Action: rest, or 30–45 min very easy. Find the cause — illness, under-fuelling,
life stress, or accumulated load. Cut the coming week's load by 20–30% and
rebuild from the response.

**Rules of engagement:**
- Never cancel a key session on one bad overnight number with good context.
- Never push a key session through a red.
- HRV sharply *high* together with high resting HR and feeling terrible is not
  green. Treat it as amber.

---

## 4. Sleep is a prescribed session

For this athlete, sleep is the highest-leverage thing in the whole plan. It is
currently the binding constraint.

- **Target: 7.5–8 h in bed, consistent times.**
- Under 7 h chronically degrades adaptation and raises injury risk. Treat
  persistent short sleep as a **load problem** — reduce training until it is
  fixed, rather than adding recovery tricks on top.
- Raise it at every check-in where it appears. Do not let it become background
  noise that both of you have stopped noticing.
- Naps of 20–90 min before mid-afternoon are a legitimate tool in heavy weeks.
- Extend sleep deliberately in race week. The night two nights before the race
  matters more than the night before.

---

## 5. Load rules

- **Ramp rate.** CTL building faster than about +5 to +7 per week is a flag. He
  is at ~+2.4. That is fine.
- **Run load is tracked separately.** Global training load hides the thing that
  actually limits him. Run volume progresses on **musculoskeletal tolerance and
  knee response**, not on aerobic capability. The engine outgrows the chassis.
- **Long run progression: about 10% per week on the longest run**, and only from
  a green knee. Back off every third or fourth week.
- **Strength load is not captured well** by the intervals.icu load model. Do not
  let a low load number convince you a 90-minute gym session was free.
- Add volume or intensity, not both in the same week.

---

## 6. Illness

- **Above the neck only** — mild sore throat, runny nose, no fever, feeling
  roughly fine → easy aerobic only, short, no intensity. Reassess daily.
- **Below the neck, any fever, chest symptoms, body aches, or stomach illness →
  full rest.** No exceptions. Resume only after 24 h with no symptoms and no
  medication.
- **Returning:** as many easy days as there were days of fever. No intensity for
  about a week after any fever. Training through a fever risks heart
  inflammation. Say that plainly, do not soften it.

---

## 7. Heat — a live factor until November

Abu Dhabi from September to November is hot and humid. This affects every
outdoor session between now and the race.

- **Adjust pace expectations, not effort.** Hold the target heart rate or effort
  and accept a slower pace. Expect a real slowdown above roughly 15–18 °C,
  getting worse as humidity rises.
- Move outdoor sessions to early morning or after sunset. **Move them, do not
  cancel them** — and write the reason in the calendar event body.
- Heart rate runs higher for the same work in heat. Do not read that as lost
  fitness.
- Check the race-day forecast from about two weeks out. If the race is likely to
  be hot, heat acclimation becomes a planning item — see `race-execution.md`.

---

## 8. Overreaching

Distinguish three things:
- **Functional overreaching** — planned, recovers within a recovery week. Fine.
- **Non-functional overreaching** — performance suppressed more than two weeks
  despite rest. Not fine.
- **Overtraining syndrome** — months. Refer out.

If performance, HRV, mood and motivation all stay flat through a genuine recovery
week: stop progressing, cut load by half or more, and check for under-fuelling
and for sleep debt before anything else. Both are far more common than true
overtraining.
