# Setup

What has to be true before the coach can work.

---

## Status — checked 2026-09-19

| Step | State |
|---|---|
| intervals.icu API key | ✅ working — athlete `i119853` |
| Garmin → intervals.icu (activities) | ✅ `icu_garmin_sync_activities: true` |
| intervals.icu → Garmin (planned workouts) | ✅ `icu_garmin_upload_workouts: true`, last upload 15 Sep |
| Whoop → intervals.icu (recovery) | ✅ sleep, HRV, resting HR, readiness, cycles |
| Google Calendar | ✅ connected — `Fitness` and `Personal` both readable |
| Hevy API key | ⬜ pending |
| Repository private | ⬜ **not done — blocks committing `athlete/`** |
| Run threshold pace in intervals.icu | ⬜ not set |

---

## 1. Make the repository private — do this first

`athlete/profile.md` and `athlete/injuries.md` hold injury history, HRV, sleep
and physiotherapy details. The repository is currently public.

GitHub → the repo → **Settings** → **General** → scroll to **Danger Zone** →
**Change repository visibility** → **Make private**.

Do not commit anything under `athlete/` until this is done. Git history cannot be
reliably erased once it is public.

## 2. Secrets

```bash
cp .env.example .env
```

Fill in:

```
INTERVALS_API_KEY=...     # intervals.icu → Settings → Developer Settings
INTERVALS_ATHLETE_ID=i119853
HEVY_API_KEY=...          # Hevy → Settings → Developer (needs Hevy Pro)
```

`.env` is gitignored. Check it with `git check-ignore -v .env`.

For a Claude Code web session, prefer setting these as **environment variables on
the environment** rather than as a file — the container is reclaimed between
sessions, but environment variables persist.

**Never paste a key into a chat message.** Transcripts are stored. If one has
been pasted, regenerate it once the environment variable is in place.

## 3. intervals.icu

Base URL `https://intervals.icu`. Auth is HTTP Basic — the username is the
literal string `API_KEY` and the password is the key.

```bash
curl -u "API_KEY:$INTERVALS_API_KEY" \
  "https://intervals.icu/api/v1/athlete/i119853/profile"
```

Endpoints in use:

| Purpose | Endpoint |
|---|---|
| Completed activities | `GET /api/v1/athlete/{id}/activities?oldest=&newest=` |
| Recovery — Whoop data | `GET /api/v1/athlete/{id}/wellness?oldest=&newest=` |
| Planned workouts | `GET POST PUT DELETE /api/v1/athlete/{id}/events` |
| A whole week at once | `POST /api/v1/athlete/{id}/events/bulk` |
| Thresholds and zones | `GET /api/v1/athlete/{athleteId}/sport-settings` |
| Power and pace curves | `GET /api/v1/athlete/{id}/power-curves{ext}` |

The full OpenAPI spec is at `https://intervals.icu/api/v1/docs`. Read it rather
than guessing a field name.

## 4. Garmin — nothing to build

Already wired, both directions. Confirm the switches are still on:

```bash
curl -u "API_KEY:$INTERVALS_API_KEY" \
  "https://intervals.icu/api/v1/athlete/i119853" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); \
    print({k:v for k,v in d.items() if 'garmin' in k.lower()})"
```

`icu_garmin_upload_workouts` must be `true` for planned workouts to reach the
watch. If it ever goes false, the fix is in intervals.icu → Settings, not in code.

## 5. Hevy

Base `https://api.hevyapp.com/v1/`. Needs Hevy Pro. Key from Settings →
Developer.

Verified: an unauthenticated call to `/v1/workouts` returns `401 InvalidApiKey`,
so the endpoint shape is right. **The exact auth header name has not yet been
confirmed** — the published docs are JavaScript-rendered and the spec file is not
reachable. Confirm it against the live API on the first authenticated call rather
than assuming.

Used for: reading completed strength workouts (actual loads and reps), and
writing routines for the next block.

## 6. Google Calendar

| Calendar | ID | Use |
|---|---|---|
| **Fitness** | `c_049449fbb5852458d717c4c9bc45bd40fd7ed459407908ddde740e4a99901771@group.calendar.google.com` | Write training here |
| Personal | `c_82cab7487cc4eba60f89d0babb1332e576c7bf2c903bd0857d3866dd611233a0@group.calendar.google.com` | Physio. Read only. |
| Work | `george@findgush.com` | Read only, for conflicts |

Time zone `Asia/Dubai`. Always pass explicit offsets.

## 7. Install the skill

```bash
mkdir -p ~/.claude/skills
cp -R skills/tri-coach ~/.claude/skills/tri-coach
```

Or leave it in the repo — Claude Code loads skills from a project's `skills/`
directory when working inside it.

## 8. Remaining setup jobs

1. Make the repository private ⬅ **blocking**
2. Add the Hevy API key and confirm the auth header against the live API
3. Set a run threshold pace in intervals.icu — derived, not max-effort tested
4. Confirm the race: name, start time, venue, water temperature, wetsuit rule
5. Record height, weight and age in `athlete/profile.md`
6. Confirm the FTP 250 W test date
