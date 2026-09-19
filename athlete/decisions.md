# Decision Log

Format: date | trigger | what the data showed | decision | what I expect

Review every prediction at the next check-in. This is what makes the coaching adaptive rather than repetitive.

---

## 2026-09-19 — System build and intake

**Trigger:** first session. Forked skill adapted to this athlete.

**Data observed:**
- 8.0 weeks to race (14 Nov). Run longest 6.3 km at 9:44/km; race needs 10 km off the bike.
- Bike already covering 54.8 km at easy HR. FTP 250 W. Not a limiter.
- Swim threshold 2:00/100 m implies 1.5 km in ~30 min. Gap is continuous distance, not speed.
- Whoop: sleep mostly 5-7 h, HRV fallen ~30 to ~25 over 3 weeks, form (CTL-ATL) never positive.
- Knee: green, pain only on cold starts.

**Decisions:**
1. Run is the primary limiter. All other sessions are subordinate to protecting the long run.
2. Sleep is prescribed, not advised. It is the binding constraint on adding gym load.
3. Strength = 2 sessions/week, upper hypertrophy + lower knee rehab in every session.
4. Non-impact power now; plyometrics after the race.
5. intervals.icu is source of truth. Garmin receives planned workouts from it.

**Expected:** run longest reaches ~9-10 km by week 6 if knee stays green. HRV stabilises if sleep reaches 7 h+. If HRV keeps falling, load gets cut, not pushed.

**Review on:** next weekly check-in.

---

## 2026-09-19b — Garmin verified, Hevy dropped, race details settled

**Trigger:** athlete asked to run everything from the watch instead of Hevy, and
asked for certainty because a previous AI coach's Garmin workouts "didn't work".

**Data observed — all from live API tests, not documentation:**
- Creating an event moved `icu_garmin_last_upload` to that second. The
  intervals.icu -> Garmin push is confirmed working.
- intervals.icu compiles a plain-text `description` into structured steps. No
  need to hand-build `workout_doc`.
- Four silent failure modes found, any of which breaks a workout with a 200 OK:
  `400m` compiles to 400 MINUTES; a bare `Z2` becomes a POWER zone; `bpm`
  targets are dropped entirely; `400 m` with a space drops the step.
- His previous bike workouts used bare `Z2`/`Z3`, which compiled to power zones.
  He has no power meter. That is the root cause of the failures.
- `type: WeightTraining` compiles to `workout_doc: []`. intervals.icu cannot
  structure a strength session at all.

**Decisions:**
1. Bike and run prescribed by HEART RATE until the power meter arrives. Never a
   bare Z. Re-test FTP properly once the meter is fitted.
2. Every workout write is followed by a read-back check before telling him it is
   done. Pre-flight checklist in `garmin-workouts.md` §5.
3. Strength routines built by hand once in Garmin Connect, reused for the block.
   Hevy demoted to fallback.
4. FTP 250 W marked untrustworthy. It is probably a Garmin estimate.
5. Race is T100 Dubai, 06:00, open water, no wetsuit. This makes the swim gap
   wider than the pool numbers suggested.

**Expected:** workouts now arrive on the watch with followable targets. The open
-water non-wetsuit swim becomes the second priority after the run.

**Review on:** first week where workouts are pushed — confirm he could actually
follow them on the watch.

---

## 2026-09-19c — Week 1 written and verified

**Trigger:** athlete confirmed Garmin credentials on the environment and said go.

**Data observed:**
- Longest CONTINUOUS run is 2.5 km, not the 6.3 km I inferred from run-walk logs.
  I corrected an earlier statement that 10 km continuous was achievable.
- Open water: never done it. Race is open water, non-wetsuit, mass start, 06:00.
- Rest day requested: Monday, standing.

**Decisions:**
1. Race the run as run-walk. Training builds run-walk volume, not continuous
   distance. Stated plainly to him rather than left to race day.
2. Open water reclassified as the single biggest risk, above the run. Saturday
   is the open-water day. First session is comfort and safety only, no distance.
3. Week 1 written: 8 events to intervals.icu, 9 to the Fitness calendar.
4. All endurance targets are HR or pace. Zero power targets — verified by reading
   back every compiled step.

**Verification performed (not assumed):**
- Every workout read back; all steps carry a real target; no absurd durations.
- `icu_garmin_last_upload` moved to the second of writing, so the watch has them.
- Calendar re-listed and all 11 events confirmed on the right days.
- Caught and fixed: the all-day REST event landed on 20 Sep because a `+04:00`
  offset shifts an all-day event back a day in UTC. Pass a UTC-midday time for
  all-day events.

**Blocked:** Garmin strength workouts. The env vars were set after this container
started, so they are not visible here. Needs a new session.

**Expected:** see the prediction block in `plans/2026-09-21_week1.md`.

**Review on:** Saturday 26 September.
