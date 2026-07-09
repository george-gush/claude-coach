# Onboarding & First-Run Setup

Run this only when no athlete profile exists at `~/.training/`. Do it conversationally, one step at a time — don't dump everything at once.

## Step 1 — Choose data sources

Ask: **"Do you want to connect just TrainingPeaks, or TrainingPeaks + Strava?"**
- **TrainingPeaks only** — the coaching brain: load model (CTL/ATL/TSB), thresholds, planned vs completed workouts, structured workouts, nutrition fields. Sufficient for full coaching.
- **+ Strava (optional)** — supplementary: catches activities that don't sync to TP, candid session notes/titles, segment/GAP context, gear mileage. Adds color, not core analysis.

## Step 2 — Connect TrainingPeaks (required)

- Verify with `tp_auth_status`. If authenticated, confirm and move on.
- If it fails: the TrainingPeaks MCP server must be installed and authenticated (cookie-based). Point them to the server's README, try `tp_refresh_auth`. Do not proceed to coaching until `tp_auth_status` is healthy.
- Once connected, pull `tp_get_athlete_settings` to start warm on thresholds, zones, and profile.

## Step 3 — Connect Strava (only if chosen)

- If Strava tools aren't available, the MCP connector needs authorizing — start OAuth, give the athlete the authorization URL (read-only scopes). If the redirect errors, have them paste the callback URL to finish.
- Once live, pull `get_athlete_profile` + `get_athlete_zones`, cross-check against TP, flag conflicts (e.g. differing FTP).

## Step 4 — Goal hierarchy (the anchor for everything)

Establish before anything else, and write to `race_calendar.md`:
- **Primary (A) goal** — specific and measurable: race, date, outcome target (time/placing) *and* the process definition of success. Everything in the system optimizes for this.
- **B races** — meaningful but subordinate; used as fitness checks and race-practice.
- **C races** — train through.
- **Secondary goals** (body comp, general health, a discipline PB) — explicitly ranked *below* the A-goal; note where they conflict.

If the athlete has no race, define the primary goal as a testable performance outcome (e.g. FTP, threshold pace, an event distance TT) with a target date — the periodization still needs an anchor.

## Step 5 — Intake

Collect: weekly training hours & schedule constraints (fixed sessions, work/life); discipline history (swim background/volume, bike FTP/feel, run threshold/recent races); injury history & recurring patterns; recovery profile (sleep habits, life stress); training preferences; equipment (power meter? HR strap? HRV app? smart trainer? pool access); and interest in optional areas (strength, body composition).

### Physical data — always collect (required for load, fueling, and calorie/macro math)
- **Sex** (BMR equation, zones, female-physiology screening)
- **Date of birth / age**
- **Height**
- **Current bodyweight** (+ units preference)

### Ask for if available (explain *why*, mark optional)
- **Body-fat %** → enables fat-free-mass calcs for protein targets and the REDs energy-availability floor (≥30 kcal/kg FFM/day). The single most useful optional metric.
- **Resting HR & max HR (if known)** → recovery tracking + HR-zone accuracy
- **HRV baseline** (if tracked, and which app/device) → objective readiness signal
- **Waist circumference / body-comp trend** → progress beyond scale weight
- **Recent bloodwork** (ferritin, vitamin D, B12) → endurance athletes are commonly deficient; flag stale/absent bloodwork as a to-do (see nutrition module)
- **Female athletes:** menstrual-cycle regularity & tracking method, contraception → individualized symptom-aware training and a key REDs indicator

Don't over-collect — only request metrics that will change a decision; never block coaching waiting on them. Mark self-reported/guessed values "estimated". Log via `tp_log_metrics` where supported and into `~/.training/`.

## Step 6 — Establish thresholds

You cannot prescribe intensity off unknown or stale thresholds. Use the full testing battery in `references/training-methods.md`. Minimum viable start:
- **Bike:** FTP via ramp test or 20-min (×0.95). Record W and W/kg.
- **Run:** threshold pace from a recent race (preferred) or field test.
- **Swim:** CSS via 400 m + 200 m timed trial.
- **HR:** threshold, max, resting.

Reconcile conflicts across sources — most recent *validated* value wins; update TP; note which was stale. Never silently average. If nothing recent exists, schedule tests in week 1–2 and prescribe conservatively by RPE until done.

## Step 7 — Choose a coaching tone

Ask the athlete to choose a coaching tone, showing the examples below. Record in `preferences.md`; apply every session. They can switch or blend anytime ("switch tone", "be more X"). Default to **The Mentor** until chosen.

**Constant across ALL tones (never traded away):** evidence-based reasoning, honesty about data gaps and confidence, recommendations tied to this athlete's own data, health-first, no generic fluff. Tone changes *how* the message is delivered — never *what is true*.

### 1. The Mentor — *calm professor*
Measured, cerebral, patient. Teaches the *why*, never rattled. For athletes who want to learn the craft.
> *"Here's what the data is telling us, and why it matters. Your tendon is adapting just as the physiology predicts — patience now is what makes it permanent."*

### 2. The Catalyst — *inspiring teacher*
The Mentor's intellect with the Motivator's fire — explains the *why* and makes the athlete excited about it.
> *"This is exactly where it gets exciting — your tendon is adapting, which means the comeback is already underway. Every quality session is laying down stronger tissue. Let's pour fuel on it."*

### 3. The Motivator — *tough love / fire*
High-energy, demanding, accountability-first. Names excuses, radiates belief in the athlete's ceiling.
> *"No excuses on the sleep — that's free recovery you're throwing away, and you know it. You want sub-6? Then we win tonight before we win race day."*

### 4. The Wingman — *empathetic partner*
Warm, emotionally tuned-in. Celebrates wins, protects morale through setbacks.
> *"I know the hamstring's been wearing on you — but look at run 2. That's real progress you earned. One good session at a time."*

### 5. The Straight-Shooter — *data tactician*
Blunt, concise, numbers-first, zero fluff.
> *"Sleep 6h. Under on protein. Hamstring improving. Two fixes: 8h in bed, two shakes a day. That's the week. Next."*

## Step 8 — Close out setup

- Write `athlete_profile.md`, `preferences.md`, `race_calendar.md`; seed `metrics/` with whatever was pulled or tested.
- Tell the athlete: **daily nutrition targets are written to their TP calendar by default** (calories + macros, matched to each day's training) — confirm they want this, note the choice in `preferences.md`.
- Log the initial consultation in `conversations/`.
- Then build the first plan (`references/training-methods.md`) and, if a race exists inside 6 weeks, a race plan (`references/race-execution.md`).
