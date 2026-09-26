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

---

## 2026-09-20 — Dashboard built. Two findings corrected.

**Built:** the health dashboard, live on Vercel, six tabs, ten measured
insights. Each insight states its own sample size. No insight prints without
a significance test behind it.

**Corrections to things I told him before:**
1. I said his HRV was falling. It fell from April to June, then FLATTENED.
   The last three months read 28.1, 27.25, 26.89. A decline that stopped is a
   level shift already absorbed, not a problem getting worse.
2. His dashboard showed 22 sessions when he had done 78. intervals.icu returns
   Strava-sourced activities as stubs with no data. Use the athlete-summary
   endpoint to see through them.

**Engine bugs found and fixed (all were producing wrong statements):**
- `Math.abs()` on the form-vs-HRV correlation. r = -0.241 is BACKWARDS, not
  strong. Testing the absolute value called a broken relationship a good one.
- Form counted 149 of 231 days. ctl/atl decay to tiny non-zero values, so days
  with no training looked like training days. Filter `ctl >= 5`. Now 15 of 94.
- Two separate changepoint cards for one event. Merged into one week.
- Bar charts on a truncated y-axis made April and May invisible and exaggerated
  small month-to-month moves. Changed to dot-and-line.

**Tooling note — do not repeat:**
`pkill -f "next start"` matches its own shell command line and kills the shell
(exit 144) while leaving the server running. Find the PID with
`ps -eo pid,args | grep next-server` and `kill <pid>`.

**Still open:**
- Hevy API key never supplied. No Hevy data is in the dashboard.
- Garmin-only metrics (Body Battery, running tolerance, VO2max trend) are not
  in the dashboard yet. They need a Python runtime the serverless app lacks.
- The dashboard URL sits behind Vercel Auth. His call whether to open it up.

---

## 2026-09-20 — The morning brief failed. Root cause and fix.

**What happened:** the 05:45 routine fired into a blank session and reported it
could find no repo, no `athlete/` files and no `skills/tri-coach/`. It refused
to write a brief rather than invent data. That refusal was correct.

**What it was NOT:** the repo was never lost. It is intact in the working
session and pushed. The failing session was a different, empty one.

**Root cause:** the routine has `persist_session: false`. It creates a NEW,
EMPTY session on every fire. `folders: []` — no repository is ever attached.
My prompt opened with "SETUP — read `skills/tri-coach/SKILL.md`...", which
reads as mandatory, so the run stopped at step 1. It had a working
INTERVALS_API_KEY the whole time and could have written the brief.

**Fix applied to the routine prompt:**
- It now states that a blank session is expected, and clones the repo itself:
  `git clone https://github.com/george-gush/claude-coach` (public, no auth).
- A failed clone is explicitly NOT a reason to stop. Write the brief from
  intervals.icu plus the inline KEY CONTEXT.
- Closing line changed to: "A missing repo is not a reason to stop; missing
  DATA is."
- Write-back has a fallback chain: git push → GitHub tools → put the note in
  the reply and say it was not saved.

**Stale facts corrected in the routine prompt at the same time:**
- It said "HRV falling ~17% over three weeks". Wrong on both counts. The fall
  ran April to June and then STOPPED. Prompt now forbids telling him his HRV
  is falling.
- Baseline HRV moved 25 → 27.
- Added: heat is seasonal; form does not measure his recovery (r=-0.241);
  Strava stubs are real sessions, cross-check athlete-summary.

**Limitation to remember:** `update_trigger` cannot attach a repository or
rebind a routine to an existing session. It takes only name, cron, enabled,
model and prompt. Self-cloning is the only fix available from here.

---

## 2026-09-20 — Dashboard redesign, and a finding I had to withdraw

**His feedback:** the screens were not informative. The Insights tab was walls of
text. Nothing was clickable. He wants to read less and click more.

**Audit findings:** 10 prose cards, roughly 800 words before a single number.
Every card carried an always-visible explainer paragraph. Nothing was clickable
except one table. Tabs were named by topic, not by question.

**Rebuilt around one rule: number first, claim second, prose behind a click.**
- Every finding is now a tile: severity dot, one big number, a one-line claim,
  a caption, and the action. The prose is behind "Why this matters".
- Every tile, metric, correlation bar and session row opens a detail sheet with
  the stat tokens, the chart and the method.
- Tabs cut 6 → 5. Body merged into Recovery, where those signals belong.

**A finding I got wrong and have now withdrawn.**
"The weeks you train hardest are the weeks you sleep least" was the top card,
marked critical, r=-0.379 across 32 weeks. I told him this morning it was the
loop most worth breaking. It was an artefact. 18 of those 32 weeks were before
he started training at all, so the correlation was measuring "training versus
not training", not "hard weeks versus easy weeks". Restricted to weeks with
real load: n=14, r=-0.317, NOT significant. Above load>5: r=-0.106, nothing.
The rule now excludes zero-load weeks, the n>=20 gate stops it firing, and the
card is gone. Told him directly rather than letting it disappear quietly.

**Second real bug: a daytime pulse shown as a resting heart rate.**
Today's wellness row carried restingHR 75 with every overnight field null —
Garmin posts an intraday sample hours before Whoop uploads the night. The
dashboard showed 75 at +5.41 SD in red. His true range is 49-57. A day is now
only treated as synced once hrv or sleep has landed; otherwise it falls back to
the last complete day and says so on screen.

**Palette:** validated with the dataviz validator rather than by eye. Light mode
failed the 3:1 contrast floor on green (2.74:1). Darkening green alone broke
green/orange CVD separation (protan ΔE 5.1). Moving both — bike #eb6834 →
#e0552c, run #1baf7a → #17a06f — passes every check in both modes.

**Rule to keep:** a correlation across a regime change is not a finding. Check
what the zero-cluster in a scatter actually is before reporting the r.

**Deployment gotcha found the same day.** Vercel had silently stopped building
on push. The last three commits sat on GitHub undeployed while the live site
served a 10-hour-old build — no errors, no queued builds, nothing to notice.
Two of those commits touched only `athlete/`, so a skipped build was correct;
the third rebuilt the whole dashboard and should have deployed.

Fix that works from here, without a Vercel token or CLI link:
`create_deployment` with `deploymentId` of the last good deploy plus
`withLatestCommit: true` and `forceNew: 1`. It inherits root directory and env
vars and picks up the branch head. Verify with `get_deployment` that `state` is
READY and that `alias` includes `tri-dashboard-george-2fa2.vercel.app` — a READY
build that is not aliased is not the live site.

ALWAYS check the deployed commit SHA after pushing. Do not assume a push means
a deploy.

**Access:** `ssoProtection` is on for `all_except_custom_domains`, so every
vercel.app URL needs a Vercel login. A custom domain would be exempt. Turning
SSO off would put his health data on the open internet. Raised with him; his
call, not mine.

---

## 2026-09-21 — The stress score question, answered with data

**He asked: "can't we get it from Whoop?"** No. Verified, not assumed:
- Whoop's public API exposes sleep, recovery, workouts and cycle strain only.
  No Stress Monitor, no continuous daytime HR or HRV.
- The Whoop -> intervals.icu sync is narrower still: 8 overnight fields.
  `stress` and `baevskySI` are 0 of 233 days. Nothing populates them.
- Everything Whoop gives is measured while he is asleep. That is the structural
  reason a stress score could not be built from it.

**Garmin has it, and it is real.** 480 three-minute samples across a full 24h,
plus Body Battery.

**The independence test — the number that decided this:**
| Candidate                              | Shared variance with overnight HRV |
|----------------------------------------|-----------------------------------|
| Composite of Whoop fields (HRV+RHR+sleep+ATL) | 76% — HRV relabelled       |
| Garmin daytime stress                  | **3.4%** (r=-0.185, n=21)         |
| Body Battery high                      | 10.3% (r=+0.321, n=20)            |

Garmin daytime stress is genuinely new information. The Whoop composite was not.

**But the history is thin: 21 days, from 2026-08-27.** Nothing significant at
that n. A z-scored stress metric needs ~60 days of his own distribution first.
Decision: ingest now, display raw with an explicit "building baseline — N of 60
days" state, score it later. No placeholder number.

**Standing rule for any future composite:** re-test it against overnight HRV.
If |r| > 0.7, it is HRV wearing a hat — drop it.

**Fetch method that works** (the agent found this; the obvious endpoints do not):
`get_user_summary(date)` per day carries stress averages, all four duration
buckets and all four Body Battery values in one call. `get_weekly_stress`
returns only a weekly aggregate; `get_body_battery` rejects ranges over 28 days
and never returns high/low; `get_stress_summary` returns percentages, not
durations. Resume tokens from /root/.garminconnect, 0.25s between days, no 429s.

**Architecture note:** garminconnect is Python; the dashboard is Node on Vercel.
The app cannot call Garmin directly. The daily brief routine already holds the
credentials and runs every morning — it writes a snapshot into the repo and the
dashboard reads that. Up to 24h stale, and it must say so on screen.

**Also fixed today: `correlate()` was conflating significance with effect size.**
It returned "strong" off a t-test alone, so at n=228 breathing rate (r=-0.225)
was labelled exactly as strong as HRV (r=+0.741). Now reports `significant`
(the t-test) and `strength` (the effect size) separately, plus `shared` — r
squared as a percentage, which is the number he can actually use:
  HRV 54.8% · resting HR 24.3% · sleep score 10.2% · sleep hours 6.0% ·
  breathing 5.1%

---

## 2026-09-21 — Verdict layer. The audit's diagnosis, and what it changed.

**Six parallel audit agents, 557k tokens, 7 minutes.** Their one-line diagnosis
was right and worth keeping: *every screen computes a number and then stops one
sentence short — it never says which direction is good, what he should be aiming
at, or what the verdict is.*

**Built:**
- Findings -> **Critical Markers**, four themed sections (heart / sleep /
  activity / fitness). Each has a status header computed from the DATA, not from
  whether a rule fired — a category with no firing rule is not thereby healthy.
- Category is set LITERALLY per rule, never derived from `metric`.
  readiness-redundant and respiration-lead are statements about his autonomic
  signal and belong under heart, not under their own metric.
- Fitness status is coloured by the CTL ramp and NEVER by form. Form correlates
  negatively with his HRV, so a red header off a negative-form streak would be
  actively false for him.
- Recovery gained a "where you are against where you should be" band per metric:
  direction-of-good as TEXT (not colour alone), target = his own 75th percentile
  over 60 days, labelled "your own good days".
- Population references added ONLY where published ranges are firm — resting HR,
  breathing rate, blood oxygen — in smaller italic text marked as external.
  Deliberately NO population HRV band. He chose this.
- Correlations now lead with shared variance as a percentage plus a plain
  sentence. HRV 54.8%, resting HR 24.3%, sleep length 6.0%.
- Sport-correct pace at last: swim min/100m, run min/km, bike km/h. The old
  `pace()` had "/km" baked into the formatter so it could never render a swim,
  and `paceSecPerKm` was computed only for runs, so swims and rides fell through
  to a km/h branch.
- Sessions are badge rows with a plain-English descriptor. Strava stubs render
  greyed and explain themselves rather than looking like a data bug.
- Race readiness strip: swim 75%, bike 137%, run 63% of race distance.
- Strength renders as "not tracked", never as zero.

**Two bugs found while building, both mine:**
1. **The in-progress week was identified by POSITION.** A zero-hour current week
   gets filtered out by `hours > 0`, and `completeWeeks[length-2]` then skipped
   the real last complete week. On a Monday it reported the week before last:
   3.46 h instead of 4.72 h. Now identified by DATE. Fixing it surfaced a
   genuine finding: load jumped 35.9% in one week, which matters for the knee.
2. **The target band clipped any dot beyond p10/p90** at the track edge. Domain
   now padded 8% each side.

**Rule to keep:** identify "the current period" by date, never by array position.
A filter upstream can silently shift what position means.

---

## 2026-09-23 — Brief moves from a fixed fire to polling

**Why:** a fixed 05:45 fire read the wellness row before Whoop had uploaded, so
the brief either carried no overnight numbers or, worse, caught a half-written
row (a daytime pulse sitting in restingHR with everything else null).

**How it works now:** the routine fires hourly and gates itself.
1. Clone, read `athlete/.brief_state` — one line, the date of the last brief.
   Matches today (Dubai) -> exit, reply `no-op: brief already sent today`.
2. Fetch today's wellness. HRV and sleepSecs both null, and before the cutoff ->
   exit, reply `no-op: overnight data has not synced yet`. Next tick retries.
3. Data landed, or cutoff reached -> send. At the cutoff with no data it says so
   plainly and writes the brief from the plan and yesterday's training. It never
   estimates a number.
4. After sending, write today's Dubai date to `.brief_state`, commit, push. That
   is what makes the remaining ticks no-op.

**Two deviations from what he specified, both forced:**
1. **15-minute ticks are rejected.** The platform minimum is 1 hour:
   *"cron expression may fire runs as little as 15 minutes apart; the minimum
   interval is 1 hour"*. Settled on hourly.
2. **His cron was in the wrong timezone.** He gave `0,15,30,45 5-10 * * *` for
   "05:00-10:45 local", but cron is stored in UTC — that expression fires
   09:00-14:45 Dubai. The existing `45 1 * * *` labelled "05:45 Dubai" already
   proved UTC storage. Stored `0 1-6 * * *` = 05:00-10:00 Dubai.

**Failure mode designed for:** if the clone fails the routine cannot read or
write the marker, so it must not send on an early tick or he gets six copies.
It sends only at the cutoff in that case, and says the clone failed.

**Rule to keep:** cron on this platform is UTC and the minimum interval is one
hour. Convert before writing an expression, and never trust a schedule labelled
with a local time without checking the stored value.

---

## 2026-09-23 — Gym A (22 Sep) log corrected in Garmin; first-session lessons

**Corrected in Garmin**, activity 24452568935. Original saved at
`athlete/metrics/garmin_backups/2026-09-22_gymA_exercise_sets_ORIGINAL.json`.
- Tibialis raise set 1: the watch sat on it ~34 min between swim and gym.
  Moved to the minute before its rest; duration 60 s.
- Side lunge set 2 -> 6 reps, bodyweight.
- Med-ball chest pass set 1 -> 12 reps x 6 kg. He confirmed it was a real set but
  did not give the reps; matched to his other three sets. Change if he says otherwise.
- Bulgarian split squat set 2 -> 9 reps. All sets bodyweight (first time).
- Single-leg calf raise: he did 3 x 12 each leg. Set 2 was blank over a 92 s
  window with no gap before the next exercise, so it was split into sets 2 and 3.
- Deleted: end-of-session wall squat (skipped), both Pallof chops (skipped),
  a trailing 8 s unknown set.
- Result: 43 working sets, 0 zero-rep sets bar the two wall-squat holds (holds
  log 0 reps by design). 6,265 kg volume. Lifting 09:42-11:23 Dubai, ~1h41m.

**What cannot be fixed from here:** the activity's TOTAL time (2h26m) and its
calories/average HR come from the recording, not the sets. Editing sets does not
trim the dead 34 minutes out of the activity.

**How the write works** (no MCP tool exists for it):
`client.put("connectapi", f"{garmin_connect_activity}/{id}/exerciseSets",
json={"activityId": id, "exerciseSets": [...]}, api=True)`. The array REPLACES
the whole set list, so deletion is by omission. A new set needs an unused
`messageIndex`. Always back up the GET first, dry-run, then re-read to verify.

**Confirmed by him:**
- Hack squat 62.6 kg is correct — the machine has odd plate weights.
- Side lunge and Bulgarian split squat were bodyweight in week 1.

**Findings that change the programme:**
1. **Power work drifted into conditioning.** Med-ball chest pass is programmed
   4 x 3 at maximum intent with 90 s rest; he did 4 x 12. KB swing is 3 x 8; he did
   3 x 12. Low reps on power moves are the point — tell him before the next A.
2. **Spanish squat appears twice in Session A by design** — Block 0 (2 x 30 s,
   pain-damping before load) and the finisher (3 x 45 s, loading). He did the first
   and skipped the second as redundant. Recommend dropping the finisher hold; the
   Block 0 one is what protects the meniscus. Pending his agreement.
3. **Sessions are running long.** ~1h41m of lifting against an 85 min plan.
4. **Watch habit:** start the workout at the gym, when Block 0 starts — not while
   resting between sessions.

**Back work** is all in Session B by design (A = quad + push, B = hinge + pull):
chest-supported row or weighted pull-up 4 x 6-10, lat pulldown 3 x 12.

**23 Sep:** very sore after his first full Gym A. HRV 32.0 (record), readiness 95,
7.5 h sleep — systemic recovery complete; the soreness is local muscle damage.
Skipped the run intervals and the easy bike. Walk only. Correct call.

---

## 2026-09-23 (later) — Workouts rebuilt: supersets, power loads, no time cap

**His decisions:**
- Remove the end-of-session Spanish squat hold from Gym A. Done.
- **Supersets for isolation moves only** — compounds and power stay straight.
- **No 85-minute cap.** His gym is large and he needs his rests. He is right: the
  cap was my estimate, not a physiological limit. The real rule is no EXTRA
  volume. Week 1 ran long because of 4x the reps on power moves, straight sets
  where the plan had supersets, and 34 min of idle watch time.
- Trimmed Gym B loaded for 24 Sep alongside the full one. He picks in the morning.

**My error, owned:** the plan always had A1/A2 supersets. The first Garmin build
put every exercise on as straight sets, so they never reached his watch.

**On the watch now** (all verified by re-reading from Garmin):
- Gym A `1702370915` — updated in place. Supersets: calf raise + lateral raise;
  cable fly + triceps extension (same cable). Finisher hold gone. Med ball 6 kg
  4 x 3, KB swing 20 kg 3 x 8, each with a note on the watch.
- Gym B full `1702371548` — updated in place. Supersets: band walk + Copenhagen;
  lat pulldown + face pull (same cable); seated calf raise + DB curl. KB swing
  24 kg, sled ~40 kg with notes. Single-leg RDL straight (compound).
- Gym B trimmed `1707522816` — new. Scheduled 24 Sep.
- Stale duplicate Gym B `1702364740` unscheduled from 24 Sep (template kept).
- **Canonical IDs are the ones above.** `1702364739` (A) and `1702364740` (B) are
  stale duplicates from the first build. Never schedule them.
- Originals backed up in `athlete/metrics/garmin_backups/`.

**Mechanics that work:**
- Superset = one RepeatGroupDTO containing [exercise A, exercise B, rest].
- Weight on a step: `weightValue` (kg) + `weightUnit: {unitId: 8, unitKey:
  "kilogram", factor: 1000.0}`. Verified it round-trips.
- Step `description` carries a note shown on the watch.
- Update in place: GET the live workout, replace `workoutSteps` (strip stepId on
  rebuilt steps, renumber stepOrder/childStepId), PUT
  `/workout-service/workout/{id}`. Keeps the ID and the schedule.

**Open gap:** the leg-extension isometric at 60 degrees (Session B, Block 6) is
in the plan but was dropped from the first Garmin build. Not restored yet.

**Superset rule tightened the same evening (his words):** isolation moves on
*completely different muscle groups* — lower + upper. My first pairings broke it:
- Gym A: cable fly + triceps extension — both pressing muscles. Now **leg curl +
  cable fly** (his pairing) and calf raise + lateral raise. Triceps straight.
- Gym B: band walk + Copenhagen (both hip) and lat pulldown + face pull (both
  back; pulldown is a compound). Now **band walk + banded face pull** (same band,
  same spot) and seated calf raise + DB curl. Pulldown, Copenhagen, KB knee raise
  straight — no upper isolation move left to pair them with.
All three workouts re-verified from Garmin's copy after the PUT.

**Leg-extension isometric restored to Gym B** (full and trimmed), 3 x 30 s per
leg, timed, left then right. Garmin has no machine leg extension; mapped to
Banded Exercises / Leg Extension with a watch note. He did not know the exercise
existed — it had never reached his watch.

**Knee, 22 Sep:** pain at the start of Gym A only, gone once warm. No swelling.
Green. He expects the pain to keep fading as he gets stronger — that is the
direction the evidence points (exercise therapy for degenerative meniscus;
see injuries.md).

**Open:** the Block 0 Spanish-squat hold is still encoded as a 1-rep step in both
A and B, so it logs 0 reps. Should become a timed 30 s hold like the leg
extension. Offered, not yet done.

---

## 2026-09-24 — Peak soreness day; holds made timed

**He woke more sore than yesterday, "can barely get out of bed".** That is ~46 h
after Gym A — the normal peak of delayed-onset soreness, which usually tops out
at 24-72 h. Expected after a first full session done at 4x the prescribed power
reps. Not an injury signal on its own.

**Decision:** swim lesson yes (non-weight-bearing; easy legs). Gym B only as the
**upper + knee** version unless the soreness has clearly eased by then. The
second Gym B option on the watch (`1707522816`) was rebuilt from "trimmed" into
"UPPER + KNEE ONLY": Block 0, chest-supported row, lat pulldown, band walk + face
pull, DB curl, leg-extension hold, dead bug. No KB swing, sled, hip thrust or RDL.

**Red flag told to him once:** dark, cola-coloured urine with severe muscle pain
after a big first session means see a doctor the same day (exertional muscle
breakdown). Unlikely, but the scenario fits, so it was named.

**Holds are now timed on the watch** — no more 1-rep placeholders logging as 0:
- Spanish squat (Block 0, Gym A + B): 2 x 30 s.
- Leg-extension isometric (Gym B): 3 x (30 s left + 30 s right).
- Copenhagen plank (Gym B full): 3 x (20 s left + 20 s right), short lever.

## 2026-09-26 Sat — long run missed; missed hinge block moves to today

**What happened this week:** only one run (Mon 33 min) and one watch-recorded
gym session. Wed run + bike, Fri easy run and Sat long run all missed. CTL fell
17.9 → 16.2. He is under-loaded, not tired.

**Sat long run:** cancelled at his request. Sunday is a group ride, so it cannot
move there. The intervals.icu event stays on Sat 26 Sep so it shows as missed.
Week 2 long run repeats 61 min (8 × 5/1). Do not add volume to make it up.

**Missed Gym B hinge work (Thu):** done today, midday, as a ~35-min block.
The earlier "not Saturday" advice was only to protect the long run; that reason
is gone. Trimmed-B volume: Block 0 → KB swing 2 × 8 @ 20 → hip thrust 3 × 8
(40 → 50 → 60 kg, 2 in reserve) → SL RDL 2 × 8/side @ 12 kg DB → Copenhagen
2 × 20 s/side short lever. No sled, no KB knee raise. Finish ≥3 h before the
17:00 open-water swim.

**Sun group ride** replaces the 90-min endurance bike. Instruction: sit in,
mostly zone 2, do not chase surges.

**Update, same day (his call):** swim first (17:00 open water), gym after. Fine:
the swim barely loads the legs, and DOMS peaks ~46 h later, so Monday's rest day
takes it, not Sunday's ride. He asked to go harder and add the KB knee raise, so
today is the **full Gym B lower half** (still no extra volume, and no sled, to
protect the ride): Block 0 → KB swing 4 × 8 @ 24 (20 if the bell stops floating)
→ hip thrust 4 × 8 (50 → 60 → 70 → 70, 2 in reserve; 80 on the last set if 70
is easy) → SL RDL 3 × 8/side @ 14 kg → Copenhagen 3 × 20 s/side short lever →
KB knee raise 3 × 10/side @ 8 kg. Eat between swim and gym.

**Update 2 (his call):** open water pushed to next Saturday (3 Oct), as
inconvenient today. Regular pool swim instead, then the gym.

**Last recorded pool swim = Sun 20 Sep** (Garmin 24431056438, 25 m pool). Tue/Thu
lessons this week are not on the watch. 1,125 m in 40 min: 26 min swimming,
13 min resting. 100 warm-up (free + breast) → 18 × 50 free (+ one 25) on ~40 s
rest → 100 cool-down. 50s: first five ~58 s (1:56/100 m), last five 62–81 s;
median 63 s. Strokes per 50 rose from 22–27 to 31–33 and SWOLF from 40 to 50–56:
**the stroke shortens as he tires.** Speed is fine; holding form over distance is
the gap. Today's progression: same volume in longer reps with shorter rest, and a
stroke-count cap.
