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
