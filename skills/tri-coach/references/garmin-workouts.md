# Programming Workouts onto the Garmin Watch

**Everything in this file was verified against the live API on 2026-09-19**, not
read from documentation. Where something is unverified it says so.

A previous AI coach wrote workouts that "didn't really work". §4 explains exactly
why. Read §4 before writing your first workout.

---

## 1. The pipeline — confirmed working

```
   you POST an event          intervals.icu pushes       he presses start
 ──────────────────────▶  intervals.icu  ───────────▶  Garmin watch
   swim / bike / run                                          │
                                  ▲    completed activity     │
                                  └──────────────────────────┘
```

**Proof, not assumption.** Creating a test event moved
`icu_garmin_last_upload` from `2026-09-15T00:46:48` to `2026-09-19T07:51:11`
— the second the event was written. The push is real and automatic.

Required account settings, all currently `true`:
`icu_garmin_upload_workouts`, `icu_garmin_training`, `icu_garmin_sync_activities`.

If a workout ever fails to appear on the watch, check those three first. The fix
is in intervals.icu Settings, never in code.

---

## 2. How to write one

```
POST   /api/v1/athlete/i119853/events          create
PUT    /api/v1/athlete/i119853/events/{id}     change
DELETE /api/v1/athlete/i119853/events/{id}     remove
POST   /api/v1/athlete/i119853/events/bulk     a whole week in one call
```

Auth: HTTP Basic, username the literal string `API_KEY`, password the key.

### Write the description, let intervals.icu compile it

**This is the preferred method.** You do not need to hand-build `workout_doc`.
Post a `description` in intervals.icu syntax and the server compiles the
structured steps itself — verified.

```json
{
  "start_date_local": "2026-09-22T07:00:00",
  "category": "WORKOUT",
  "type": "Run",
  "name": "Run — Intervals",
  "external_id": "wk1-tue-run",
  "description": "Warmup\n- 10m Z2 HR\n\nMain Set 4x\n- 0.4km 8:00 Pace\n- 90s Z1 HR\n\nCooldown\n- 5m Z1 HR"
}
```

Field notes:
- `start_date_local` — local time, no offset. The account is `Asia/Dubai`.
- `category` must be `WORKOUT`. Other values are races, notes, holidays.
- `type` — `Run`, `Ride`, `Swim`, `WeightTraining`, and 56 others.
- `external_id` — your own stable key, e.g. `wk3-sun-long-run`. Use it. It makes
  a workout findable and re-writable later without hunting for the numeric id.
- Blank line = new block. `- ` prefix = a step. `Nx` after a block name = repeat.

**Always read the response back** and check the compiled `workout_doc` before
telling him it is done. The compiler fails silently — see §4.

---

## 3. Verified syntax

Every row below was posted to the live API and the compiled output inspected.

### Targets

| You write | Compiles to | Use it? |
|---|---|---|
| `9:30 Pace` | `pace: {units: secs, value: 570}` | ✅ Runs |
| `Z2 HR` | `hr: {units: hr_zone, value: 2}` | ✅ **Default for bike and run** |
| `75-85% LTHR` | `hr: {units: "%lthr", start: 75, end: 85}` | ✅ Precise HR work |
| `ramp 60-80% LTHR` | `hr: {...}, ramp: true` | ✅ Progressive warm-ups |
| `90rpm` | `cadence: {units: rpm, value: 90}` | ✅ Combines with any target |
| `free` | duration only, no target | ✅ Deliberate easy/unstructured |
| `Z2` (bare) | `power: {units: power_zone, value: 2}` | ⚠️ **POWER.** See §4. |
| `140-150bpm` | **silently dropped — no target at all** | ❌ Never use |

### Duration and distance

| You write | Compiles to | Use it? |
|---|---|---|
| `10m` | 600 s | ✅ `m` = **minutes** |
| `90s` | 90 s | ✅ |
| `0.4km` | `distance: 400` | ✅ **Decimals for sub-km** |
| `1.5km` | `distance: 1500` | ✅ |
| `400m` | **24000 s — 400 MINUTES** | ❌ Catastrophic |
| `400 m` (with a space) | **step silently dropped** | ❌ |

### Repeats

```
Main Set 4x
- 0.4km 8:00 Pace
- 90s Z1 HR
```
→ `{reps: 4, steps: [...]}`. The `Nx` goes on the block heading line.

### Warm-up and cool-down
A block named `Warmup` sets `warmup: true`; `Cooldown` sets `cooldown: true`.
The watch treats these as lap-advance-on-press steps.

---

## 4. The four traps — this is why the last attempt failed

**1. `m` means minutes, not metres.**
`400m 8:00 Pace` compiles to a **400-minute** interval. On the watch that is a
6.7-hour step that never ends. Use `0.4km`. This alone would make a session
unusable.

**2. A bare `Z2` is a POWER zone, not a heart-rate zone.**
On a Ride it becomes `power_zone`. **He has no power meter.** The watch shows a
power target he cannot see, so the step has no guidance at all. His previous
bike workouts were written this way — `Warmup / - 15m Z2 90rpm` compiled to
`power: {units: power_zone, value: 2}`. That is the bug.
On a Run, a bare `Z2` *also* becomes a power zone, which is worse — there is no
running power source at all.
**Write `Z2 HR`. Always. Until the power meter arrives, never write a bare Z.**

**3. `bpm` is silently ignored.**
`140-150bpm` produced a step with a duration and **no target whatsoever**. No
error, no warning. Use `% LTHR` or `Z_ HR`.

**4. Silent failure is the normal failure mode.**
The API returns `200 OK` for all of the above. It does not validate. A workout
can be completely broken and still look like it worked.

---

## 5. Pre-flight checklist — run this every time

Before telling him a workout is on his watch:

1. **POST the event**, capture the response.
2. **Read back `workout_doc.steps`.** If it is `[]` or shorter than the number of
   steps you wrote, the compile failed.
3. **Check every step has a target** — `pace`, `hr`, or a deliberate `free`.
   A step with only `duration` and no target is a silent drop.
4. **Check no step has an absurd duration.** Anything over ~2 hours in a session
   under 2 hours means an `m`/`km` mistake.
5. **Check `workout_doc.duration`** matches the session you intended, roughly.
6. **Confirm the push:** re-read `GET /api/v1/athlete/i119853` and check
   `icu_garmin_last_upload` has moved to the current time.

Never skip step 6. It is the only thing that proves the watch got it.

### Current-athlete rules

- **Bike: HR only.** FTP 250 W is of unknown origin, probably a Garmin estimate,
  and there is no power meter. Write `Z2 HR` / `% LTHR`. Revisit when the power
  meter arrives, then re-test FTP and switch to power.
- **Run: pace or HR.** Pace for intervals, HR for easy running in the heat —
  heat inflates pace, so an HR cap is the honest target.
- **Every run workout starts with the knee warm-up as real steps.** A step on the
  watch gets done. A note gets skipped, and a cold start is what hurts his knee.

---

## 6. Strength — it does **not** work through intervals.icu

Tested directly. Posting `type: "WeightTraining"` with a description of blocks,
sets and reps returns `200 OK` and compiles to:

```json
"workout_doc": { "steps": [] }
```

**Empty.** intervals.icu accepts the event as a calendar entry and a load
placeholder, but it has no concept of an exercise, a set or a rep. Nothing
useful reaches the watch. Do not tell him otherwise.

### The options, honestly

| Option | Gets it on the watch | Cost |
|---|---|---|
| **Build the 2 routines in Garmin Connect once** | ✅ Yes | He types them in once on the web, reuses for ~4 weeks. Garmin's exercise library may not contain Cossack squat, Copenhagen plank, Spanish squat or tibialis raise — substitute or use a generic slot. **I cannot verify Garmin's library from here.** |
| **Freestyle strength on the watch** | Partly | Start a Strength activity, the watch counts sets and reps, he adds weights after. No prescription shown, so he needs the plan from somewhere. |
| **Unofficial Garmin Connect API** | ✅ Yes | A community library can create workouts programmatically. It needs his Garmin account password, it is not an official API, and it breaks when Garmin changes things. Only if he asks for it knowingly. |
| **Hevy** | ❌ Phone | Clean official API, best logging. Rejected — he does not want his phone in the gym. |

**Still write the `WeightTraining` event to intervals.icu** even though it is
empty. It keeps the calendar and the load model complete, and it gives a place to
read the session back from once Garmin syncs the completed activity.

---

## 7. Changing and removing

- **Change:** `PUT /events/{id}` with the new `description`. It recompiles and
  re-pushes. Prefer this over delete-and-recreate — it preserves what was
  originally planned, which the planned-against-actual review depends on.
- **Remove:** `DELETE /events/{id}`. Verified to return `200` and remove cleanly.
- **A whole week:** `POST /events/bulk`. Prefer it over seven separate calls.
- **Find later:** filter `GET /events?oldest=&newest=` on your `external_id`.

## 8. Reading back what he actually did

```
GET /api/v1/athlete/i119853/activities?oldest=&newest=
```

Data hygiene: entries with `type: null` and zero duration are artefacts. Filter
them out before counting sessions or you will report a completion rate that is
wrong.
