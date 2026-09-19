# Scheduling — Where Each Session Goes

Three systems, three jobs. Do not confuse them.

| System | Job | What the athlete sees |
|---|---|---|
| **intervals.icu** `events` | The workout itself — steps, targets, duration | Pushed to his Garmin watch automatically |
| **Garmin watch** | Execution | Press start, follow the steps |
| **Google Calendar** | The time block and the reason | When to be where, and why this session exists |

**Verified live on 2026-09-19:** his intervals.icu account has
`icu_garmin_upload_workouts: true` and `icu_garmin_training: true`, with a last
upload on 15 September. **A planned workout written to intervals.icu already
appears on his Garmin watch.** No Garmin integration needs building.

So for swim, bike and run:

1. Write the structured workout to `POST /api/v1/athlete/i119853/events`
2. intervals.icu pushes it to Garmin Connect, and it lands on the watch
3. He starts it on the watch, which guides him through the steps
4. Garmin sends the completed activity back to intervals.icu
5. You read it back and compare planned against actual

For strength, the same calendar event is written, but the session content goes to
Hevy instead. See `strength.md` §10.

**Rule:** never write a session to only one of these. A calendar block with no
workout behind it is a reminder, not a session. A workout with no calendar block
is one he will forget.

---

## 1. Calendar facts

| Item | Value |
|---|---|
| Target calendar | **Fitness** — `c_049449fbb5852458d717c4c9bc45bd40fd7ed459407908ddde740e4a99901771@group.calendar.google.com` |
| Personal calendar | `c_82cab7487cc4eba60f89d0babb1332e576c7bf2c903bd0857d3866dd611233a0@group.calendar.google.com` — physio and appointments. **Read it, never write training to it.** |
| Work calendar | `george@findgush.com` — **read only**, to find conflicts |
| Time zone | `Asia/Dubai` (UTC+4). Always pass explicit `+04:00` offsets. |

> The athlete first said "Personal". His training is in fact all on **Fitness**.
> Confirm once, then record the answer here and stop asking.

### Fixed commitments — plan around these, never over them

| What | When | Notes |
|---|---|---|
| Swim lessons | Tue + Thu, 07:00–08:00 | Recurring. Coach-led. Not moveable. |
| Physiotherapy | ~1 × per week | On the Personal calendar. Reduced from 2 × as pain settled. Check it before placing a Saturday or Monday session. |

---

## 2. Event naming

Match the athlete's existing convention exactly. He already reads these at a glance.

```
Swim — Lesson
Swim — Solo (technique)
Bike — Endurance
Bike — Intervals
Run — Easy
Run — Intervals
Run — Long
Gym A — Quad + Push
Gym B — Hinge + Pull
Brick — Bike + Run
```

## 3. Event body format

Every event body follows this shape. The athlete reads it on his phone at the
door, so put the doing first and the reasoning last.

```
WARM-UP
- <the Block 0 items that apply — always present for run, bike and gym>

MAIN SET
- <the actual work, in the units he trains by: pace per km, cadence, zone, time>

COOL-DOWN
- <5–10 min easy>

WHY
<One or two short sentences. What this session is for, and what "good" looks like.>
```

Rules:
- **Every** run and gym event carries a warm-up section. The athlete's knee hurts
  on cold starts. This is the mechanism that prevents it.
- Use his units. Runs in min/km. Bike in zone plus rpm. Swim in metres.
- Never write a session he cannot execute in the time booked.
- Put the load target in the body, not the title.

## 3b. Writing structured workouts to intervals.icu

```
POST /api/v1/athlete/i119853/events          # create
PUT  /api/v1/athlete/i119853/events/{id}     # change
POST /api/v1/athlete/i119853/events/bulk     # a whole week at once
```

Auth is HTTP Basic: username is the literal string `API_KEY`, password is the key.

- Set `category` to the planned-workout type and `start_date_local` to the
  session date in `Asia/Dubai`.
- Write the steps in intervals.icu workout syntax in the `description`. The
  server compiles them into `workout_doc` for you.
- **Read `garmin-workouts.md` before writing one.** The compiler fails silently.
  `400m` means 400 *minutes*; a bare `Z2` is a *power* zone and he has no power
  meter; `bpm` targets are dropped without an error.
- `POST /events/bulk` writes a full week in one call. Prefer it.
- After the session, `GET /events/{id}` shows whether it was completed and what
  was actually done against it.

**Run workouts must include the warm-up as real steps**, not as a note. If it is
a step on the watch, he does it. If it is a note, he skips it — and a cold start
is exactly what hurts his knee.

## 4. Writing and changing events

- Create with `create_event`. Always set `calendarId` and an explicit `timeZone`.
- To change a session, **update the existing event**. Do not delete and recreate
  — that loses the history of what was originally planned, which is what the
  planned-versus-actual review depends on.
- When a session is moved or softened, say why in the body, on a new line:
  `CHANGED <date>: <reason>`. The athlete's existing events already do this
  ("Moved to evening (hot/humid AM)"). Keep that habit.
- Never create a week further than 14 days ahead. Plans that far out are guesses.

---

## 4a. The daily loop

He asked on 2026-09-19 to **discuss plans daily**, not only at a weekly check-in.
The weekly loop still sets the shape of the week. The daily loop adjusts it.

Keep it short — a few lines, not a report. Each day:

1. **Read before speaking.** Yesterday's activity from intervals.icu, last night's
   sleep and HRV from the wellness endpoint, and the knee status colour.
2. **Say what today is** and whether it still stands.
3. **Adjust if the data says so**, using the green/amber/red rules in
   `load-and-recovery.md`. Name the change and the reason in one sentence.
4. **Ask the one thing you cannot read** — usually how the knee feels, or whether
   something has landed in his day.

Do not re-plan the whole week every day. Do not repeat numbers he saw yesterday.
If nothing has changed, say so in one line and stop.

## 5. The weekly planning loop

Run this once a week. Saturday is the natural slot — it is the start of the UAE
working week and it is after the weekend's long sessions.

**This is a conversation, not a broadcast.** The athlete asked to "work out our
workouts together". Propose, then ask, then write. Never write a week to the
calendar before he has seen it.

### Step 1 — Gather (do this before saying anything)
- Last 7 days completed, from intervals.icu: `/api/v1/athlete/{id}/activities`
- Recovery: `/api/v1/athlete/{id}/wellness` — HRV, resting HR, sleep, from Whoop
- Load trend: fitness, fatigue, form
- Last 7 days of strength, from Hevy: actual loads, reps, and whether sessions happened
- The coming 14 days on **all three** calendars — travel, work blocks, physio
- `athlete/injuries.md` — the current knee status colour

### Step 2 — Report
Short. What happened against what was planned. Completion rate. The one thing
that stands out. Knee status. Do not flatter and do not scold.

### Step 3 — Propose
Give the coming week as a table: day, session, duration, purpose. State the one
trade-off you made and why. Name what you would drop first if the week goes wrong.

### Step 4 — Agree
Ask what is already blocked in his week. Ask how the knee feels. Adjust.

### Step 5 — Write
Only now, and in this order:
1. **intervals.icu** — structured swim, bike and run workouts to `/events`.
   These reach his Garmin watch automatically.
2. **Hevy** — the two strength routines.
3. **Google Calendar** — the time blocks, with the warm-up and the reason in the
   body.

Confirm what you wrote, one line per session.

### Step 6 — Log
Append the decision to `athlete/decisions.md`:
`trigger → what the data showed → what was decided → what you expect to happen`.
Review that prediction at the next check-in. This is what makes the coaching
adaptive instead of just repetitive.

---

## 6. Default week shape

**One full rest day per week is non-negotiable.** He asked for it and his data
backs it up — his form has not been positive once in three weeks. Monday is the
default, because the long weekend sessions land on Saturday and Sunday.

Ten sessions across six training days. Total: 3 swims, 3 runs, 2 rides, 2 gym.

| Day | AM | PM |
|---|---|---|
| **Mon** | **REST — full day off** | — |
| Tue | **Swim — Lesson** 07:00 | Gym A 09:00–10:30 |
| Wed | Run — Intervals | Bike — Easy |
| Thu | **Swim — Lesson** 07:00 | Gym B 09:00–10:30 |
| Fri | Run — Easy | — |
| Sat | **Run — Long** | Swim — Solo / open water |
| Sun | Bike — Endurance | — |

Notes on this shape:
- **Saturday holds the long run, not Sunday.** It is the most important session
  of the week, so it goes on a free day, on fresh legs, after Friday's easy run.
- **Sunday is the long ride.** It has the time, and it costs the knee nothing.
- **Gym stacks onto swim days, 09:00–10:30.** The swim warms the knee for free
  and it saves two trips to the gym.
- **Wednesday is the only midweek double**, and the bike half of it stays easy.
  It exists to hit two rides a week without touching the rest day.
- **Friday's easy run is the release valve.** It is the first session to go in a
  bad week.
- Heat: Abu Dhabi from September to October is severe. Outdoor work goes before
  06:30 or after sunset. Move it, do not cancel it, and say why in the event body.

## 7. What to do when the week breaks

Priority order when sessions must be dropped. Cut from the bottom.

1. **Saturday long run** — the race limiter. Protect first.
2. **Swim lessons** — fixed, paid, coach-led.
3. **Gym A and B** — this is knee rehab. Dropping it costs run capacity later.
4. Sunday endurance ride.
5. Wednesday run intervals.
6. Wednesday easy bike.
7. Solo technique swim.

Never replace a dropped session with a harder version of another one.
**Never** fill the rest day. A week that eats its rest day is a week that was
too big, and the fix is the following week, not that day.
