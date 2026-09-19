# Athlete Profile — George

Last updated: 2026-09-19. All figures pulled live from intervals.icu unless marked
**(ask)**.

> ⚠️ This file holds personal health data. The repository is currently **public**.
> Do not commit this file until the repository is private.

---

## Identity and accounts

| Item | Value |
|---|---|
| intervals.icu athlete ID | `i119853` (display name `Gjar93`) |
| Location | Abu Dhabi, United Arab Emirates |
| Time zone | `Asia/Dubai` (UTC+4) |
| Age / height / weight | **(ask)** — no weight recorded in intervals.icu |

## Connected systems — all verified live on 2026-09-19

| System | Status | Role |
|---|---|---|
| **intervals.icu** | ✅ API key working | Source of truth. Everything flows through here. |
| **Garmin** | ✅ `icu_garmin_training: true`, `icu_garmin_upload_workouts: true` | Records workouts **and receives planned workouts from intervals.icu.** Last upload 2026-09-15. |
| **Whoop** | ✅ scopes: recovery, sleep, cycles, body, workout | Sleep, HRV, resting HR, readiness → intervals.icu |
| **Strava** | ✅ authorised (`strava_id 93726324`) | Redundant capture. Not used for analysis. |
| **Hevy** | Pro subscription, API key pending | Strength logging |
| **Google Calendar** | ✅ connected | The plan. Calendar `Fitness`. |

---

## The goal

**A-race:** Olympic distance triathlon — 1.5 km swim / 40 km bike / 10 km run.
**Date:** Saturday 14 November 2026. Exactly 8 weeks from 19 September.
**Event name, start time, venue, water temperature, wetsuit rules:** **(ask)**

There are no B or C races on the calendar. **(ask)** whether to add a tune-up
event in mid-October.

---

## Thresholds — from intervals.icu sport-settings

| Sport | Value | Confidence |
|---|---|---|
| **Bike FTP** | **250 W** | Set. Verify the test date — **(ask)** |
| Bike LTHR | 163 bpm | |
| Max HR | 180 bpm | |
| Bike HR zones | 131 / 145 / 152 / 162 / 166 / 171 / 180 | |
| **Swim threshold pace** | **0.833 m/s = 2:00 / 100 m** | Implies 1.5 km ≈ 30 min |
| Run HR zones | 137 / 145 / 153 / 162 / 166 / 171 / 180 | |
| **Run threshold pace** | **NOT SET** | ⚠️ Gap. Cannot prescribe run pace zones properly until this exists. |

**Action:** set a run threshold. Do not field-test at maximum effort with this
knee. Derive it from a controlled effort or from HR-anchored work instead.

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
effort is not in doubt. FTP 250 W is a genuinely useful number.

### Swim — a distance gap, not a speed gap

Longest logged: 1.12 km (6 Sep). Lesson sessions log 0.2–0.78 km over 50–60 min,
which is normal for technique work with rests. Threshold pace of 2:00/100 m puts
1.5 km around 30 minutes. **The gap is continuous distance, not speed.**
Needs one continuous 1.5 km time trial to confirm. **(ask)** pool or open water,
and whether the race allows a wetsuit.

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
- Short, simple, clear English. Answer first.
- Fuels deliberately before gym sessions.
- Upper body training is for aesthetics. Lower body is for the knee.
- Does not want nutrition coaching.

---

## Open questions

1. Which knee — left or right?
2. "Kettlebell knee raises" — knee-over-toe work, or hanging core raises?
3. Race name, start time, venue, wetsuit rules?
4. Height, weight, age?
5. When was FTP 250 W last tested?
6. Any travel before 14 November?
7. Does 08:15–09:45 on Tuesday and Thursday work for gym, straight after the swim?
