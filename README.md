# Tri Coach

A personal triathlon and strength coaching system for one athlete, one race.

**Target:** Olympic distance — 1.5 km swim, 40 km bike, 10 km run — on
**14 November 2026**.

This started as a fork of the **Adaptive Endurance Coach** skill. The method
content — evidence tiering, readiness decision rules, taper science, the decision
log, persistent athlete memory — comes from there and the credit is theirs. Almost
everything else has been rebuilt:

| Original | Here | Why |
|---|---|---|
| TrainingPeaks as source of truth | **intervals.icu** | Garmin and Whoop both already feed it. One API, one truth. |
| Strava as supplementary | **Garmin + Whoop**, via intervals.icu | Actual devices, already connected |
| Nutrition engine, on by default | **Removed** | Not wanted |
| Generic long-course periodization | **Olympic distance, 8-week block** | Different race, different problem |
| Strength as one section | **`strength.md`, a first-class module** | A degenerated meniscus makes strength the main event, not an accessory |
| No scheduling layer | **Google Calendar + intervals.icu → Garmin** | Sessions reach the watch, not just a document |
| Memory in `~/.training/` | **`athlete/` in the repo** | Survives an ephemeral container |

---

## How it works

```
        you agree the week                    auto push
  ───────────────────────────▶ intervals.icu ───────────▶ Garmin watch
     swim / bike / run                                    press start, follow
                                     ▲                          │
                                     │    completed activity    │
                                     └──────────────────────────┘
                                     ▲
                         Whoop ──────┘   sleep, HRV, resting HR, readiness

  strength ─────────────────▶ Hevy        loads and reps, read back for progression
  every session ────────────▶ Google Calendar   the time block and the reason
```

Nothing needed building for Garmin. intervals.icu already has
`icu_garmin_upload_workouts` switched on, so a planned workout written through the
API appears on the watch.

## The weekly loop

Once a week, usually Saturday:

1. **Gather** — completed work, recovery, strength loads, the next 14 days of calendar
2. **Report** — what happened against what was planned, in a few lines
3. **Propose** — next week as a table, with the trade-off named
4. **Agree** — it is a conversation, not a broadcast
5. **Write** — intervals.icu, then Hevy, then Calendar
6. **Log** — the decision and the prediction, so it can be checked next week

Step 6 is the one that matters. A prediction that never gets checked is a guess.

## Repo layout

```
skills/tri-coach/
  SKILL.md                    loaded every session
  references/
    strength.md               the gym — knee rehab, power, hypertrophy
    scheduling.md             calendar, intervals.icu writes, the weekly loop
    load-and-recovery.md      readiness rules, HRV, sleep, illness, heat
    training-methods.md       swim, bike, run — evidence-tiered
    race-execution.md         taper, pacing, race week
    review.md                 planned against actual

athlete/                      persistent memory
  profile.md                  thresholds, connected systems, open questions
  injuries.md                 the knee
  decisions.md                the decision log
  metrics/  plans/  reviews/
```

## Setup

See [`AGENT.md`](./AGENT.md).

## ⚠️ Privacy

`athlete/` contains personal health data — injury history, HRV, sleep, weight.
**Make this repository private before committing any of it.** Git history is
permanent, and a public repo may be cached or forked before you can undo it.

Secrets live in `.env`, which is gitignored. Never commit an API key, and never
paste one into a chat transcript.

## Disclaimer

This is not a physiotherapist and not a physician. The athlete's physio is the
authority on his knee. Catching, locking, giving way, or swelling that will not
settle are referrals, not coaching problems.
