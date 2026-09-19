# Athlete Profile — George

Last updated: 2026-09-19. All figures pulled live from intervals.icu unless marked
**(ask)**.

> Note: this file holds personal health data and the repository is **public**.
> The athlete was told and chose to proceed on 2026-09-19. Do not re-raise it.

---

## Identity and accounts

| Item | Value |
|---|---|
| intervals.icu athlete ID | `i119853` (display name `Gjar93`) |
| Location | Abu Dhabi, United Arab Emirates |
| Time zone | `Asia/Dubai` (UTC+4) |
| Age | **32** |
| Height | **174 cm** |
| Weight | **~73–75 kg** (self-reported, not logged). BMI ≈ 24.4 |

## Connected systems — all verified live on 2026-09-19

| System | Status | Role |
|---|---|---|
| **intervals.icu** | ✅ API key working | Source of truth. Everything flows through here. |
| **Garmin** | ✅ `icu_garmin_training: true`, `icu_garmin_upload_workouts: true` | Records workouts **and receives planned workouts from intervals.icu.** Last upload 2026-09-15. |
| **Whoop** | ✅ scopes: recovery, sleep, cycles, body, workout | Sleep, HRV, resting HR, readiness → intervals.icu |
| **Strava** | ✅ authorised (`strava_id 93726324`) | Redundant capture. Not used for analysis. |
| Hevy | Pro subscription | **Fallback only.** He does not want his phone in the gym. |
| **Google Calendar** | ✅ connected | The plan. Calendar `Fitness`. |

---

## The goal

**A-race: T100 Dubai** — Olympic distance, 1.5 km swim / 40 km bike / 10 km run.
**Date:** Saturday 14 November 2026. Exactly 8 weeks from 19 September.
**Start: 06:00.** Swim is **open water**. He will race in a **trisuit, no wetsuit**.

Three consequences that change the plan:

1. **Open water, non-wetsuit, is a real gap.** He swims in a resort pool. No
   wetsuit means less buoyancy and a harder swim, especially for a developing
   swimmer. He needs open-water practice and at least one non-wetsuit 1.5 km
   before race day. Sighting and a group start also need rehearsing.
2. **A 06:00 start means warming up at about 05:00, in the dark.** His knee hurts
   on cold starts. The race-morning warm-up is a written, timed item, not an
   afterthought.
3. **He trains in Abu Dhabi and races in Dubai.** Roughly 1.5 hours' drive. A
   06:00 start means either a very early departure or a night in Dubai. Settle
   this well before race week.

There are no B or C races on the calendar. **(ask)** whether to add a tune-up
event in mid-October.

---

## Thresholds — from intervals.icu sport-settings

| Sport | Value | Confidence |
|---|---|---|
| **Bike FTP** | **250 W** | ⚠️ **Do not trust.** Origin unknown, probably a Garmin estimate. He has no power meter. |
| Bike LTHR | 163 bpm | |
| Max HR | 180 bpm | |
| Bike HR zones | 131 / 145 / 152 / 162 / 166 / 171 / 180 | |
| **Swim threshold pace** | **0.833 m/s = 2:00 / 100 m** | Implies 1.5 km ≈ 30 min |
| Run HR zones | 137 / 145 / 153 / 162 / 166 / 171 / 180 | |
| **Run threshold pace** | **NOT SET** | ⚠️ Gap. Cannot prescribe run pace zones properly until this exists. |

**Action:** set a run threshold. Do not field-test at maximum effort with this
knee. Derive it from a controlled effort or from HR-anchored work instead.

**Bike: prescribe by heart rate, not power.** There is no power meter, so a power
target on the watch gives him nothing to follow. This is what broke his previous
coach's bike workouts — see `garmin-workouts.md` §4. A power meter is on the way;
retest FTP properly when it arrives, then switch to power.

---

## Where the fitness actually is — last 3 weeks

### Run — this is the limiter

| Date | Time | Distance | Pace | Avg HR |
|---|---|---|---|---|
| 7 Sep | 42 min | 5.01 km | 8:20 /km | 141 |
| 12 Sep | 54 min | 5.24 km | 10:59 /km | 137 |
| 16 Sep | 58 min | **6.30 km** | 9:44 /km | 128 |
| 19 Sep | 42 min | 3.95 km | 10:50 /km | 107 |

Longest session **6.3 km**. Paces 8:20–11:00 /km. Most sessions are run-walk —
the 16 Sep title `400Wx150R_10REP` confirms it. Heart rate is moderate, well
under LTHR, so the limiter is musculoskeletal, not aerobic.

**Race requirement: 10 km continuous, off a 40 km bike, in 8 weeks.**
From 6.3 km, a 10% weekly build reaches ~12 km by race week. It is achievable.
It is also the entire job of this block.

### Bike — the strongest leg

| Date | Time | Distance | Speed | Avg HR |
|---|---|---|---|---|
| 14 Sep | 134 min | **54.78 km** | 24.0 kph | 136 |
| 9 Sep | 47 min | 20.95 km | 25.1 kph | 139 |
| 3 Sep | 45 min | 16.69 km | 21.7 kph | 137 |

54 km already covered at an easy heart rate, well below LTHR 163. 40 km at race
effort is not in doubt. Note the speed is from GPS, not power — the FTP figure
above is not evidence of anything until the power meter arrives.

### Swim — a distance gap, not a speed gap

Longest logged: 1.12 km (6 Sep). Lesson sessions log 0.2–0.78 km over 50–60 min,
which is normal for technique work with rests. Threshold pace of 2:00/100 m puts
1.5 km around 30 minutes. **The gap is continuous distance, not speed.**

**The race swim is open water, non-wetsuit.** That makes the gap wider than the
pool numbers suggest. No wetsuit means less buoyancy, a lower body position and
a harder swim. Needs: one continuous 1.5 km time trial, then the same distance in
open water without a wetsuit, well before race day.

---

## Recovery — the real constraint

Whoop data, 29 Aug to 19 Sep:

| Metric | Trend | Read |
|---|---|---|
| **Sleep** | 4.7 – 8.3 h, mostly **5–7 h** | ⚠️ Chronically short. 4.7 h on 19 Sep. |
| **HRV** | ~30 → ~25 over three weeks | ⚠️ Declining. About 17% below the late-August baseline. |
| Resting HR | 49–57, stable | Normal |
| Whoop readiness | Fell to 30 on 13 Sep, back to ~70 | Recovering but volatile |
| **Form (CTL−ATL)** | **−7 to −18, never positive** | ⚠️ Constant fatigue, no absorption days |
| Fitness (CTL) | 11.6 → 18.7 in 3 weeks | Ramp ~+2.4/week — reasonable |

**This is the most important finding in the file.** The training ramp is sensible.
The recovery is not. Sleep under 7 hours with a falling HRV, plus form that never
goes positive, is the pattern that precedes injury and illness — and he is adding
two 90-minute gym sessions.

**Coaching consequence:** sleep is a prescribed session, not advice. Before adding
load, add sleep. If HRV keeps falling while sleep stays under 6 hours, cut load —
do not push through it. Revisit at every weekly check-in.

---

## Constraints

- **Knee — degenerated meniscus.** See `injuries.md`. This is the anchor.
- **Swim lessons** Tuesday and Thursday, 07:00–08:00. Fixed.
- **Physiotherapy** about once a week, down from twice. On the Personal calendar.
- **Heat.** Abu Dhabi, September to November. Outdoor sessions go early or late.
- **Work** — calendar `george@findgush.com`. Read it for conflicts. **(ask)** about
  travel between now and 14 November.

## Preferences

- Plan the week **together**, do not dictate it.
- **Discuss plans daily**, not only weekly. Stated 2026-09-19. Short daily
  check-in; the weekly loop still sets the week's shape.
- **One full rest day per week**, Monday by default. Stated 2026-09-19. Not
  negotiable, and not to be quietly filled when a session slips.
- Short, simple, clear English. Answer first.
- Fuels deliberately before gym sessions.
- Upper body training is for aesthetics. Lower body is for the knee.
- Does not want nutrition coaching.
- **Do not predict finish times.** Stated 2026-09-19. He will check the cut-offs
  himself. Give pacing targets and effort caps, not a projected total. Drop the
  estimate from any race plan until he asks for one.
- **Expects the coach to build things, not hand him setup work.** If a route
  needs manual data entry by him, that is a last resort, and say so plainly
  rather than presenting it as the plan.

---

## Settled on 2026-09-19

- **Left knee.**
- **"Kettlebell knee raise"** = standing, kettlebell hooked over the foot, lift the
  knee. A loaded hip-flexor raise. Low load on the knee joint itself, so it needs
  no staging. Goes in Session B accessory work.
- **Race:** T100 Dubai, 06:00, open water, trisuit, no wetsuit.
- **Open water access confirmed** — a local beach. **Saturday is the open-water
  day.** The Saturday solo swim becomes an open-water session. He has never swum
  open water, so build it from short and close to shore.
- **Gym: 09:00–10:30 Tuesday and Thursday**, after the swim lesson.
- 174 cm, ~74 kg, 32 years old.
- FTP 250 W is not trustworthy. Power meter coming.
- Repository stays public. He was told what it contains and accepted it.

## Still open

1. Any travel between now and 14 November?
2. Longest **continuous** run without walking, and did the knee complain?
4. What is the swim coach working on in the Tuesday and Thursday lessons?
5. Race-day logistics — drive up at 04:00, or stay in Dubai the night before?
