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
| `garmin` MCP server in `.mcp.json` | ✅ configured, pinned, launch-tested |
| `GARMIN_EMAIL` / `GARMIN_PASSWORD` on the environment | ⬜ **pending — blocks gym workouts** |
| Hevy API key | ⬜ fallback only, not needed |
| Repository private | ⬜ athlete chose to keep it public (2026-09-19) |
| Run threshold pace in intervals.icu | ⬜ not set |

---

## 1. A note on what is in here

This repository is **public**, and `athlete/` holds personal health data —
injury history, HRV, sleep, physiotherapy. The athlete was told and chose to
keep it public on 2026-09-19. That decision is settled; do not re-raise it.

**Secrets are a separate matter and are not negotiable.** No API key, password
or token goes in the repo, in a commit, or in a chat message. `.env` is
gitignored and `.mcp.json` holds only `${VAR}` references.

## 2. Secrets

```bash
cp .env.example .env
```

Fill in:

```
INTERVALS_API_KEY=...     # intervals.icu → Settings → Developer Settings
INTERVALS_ATHLETE_ID=i119853
GARMIN_EMAIL=...          # used by the garmin MCP server
GARMIN_PASSWORD=...       # drop this once OAuth tokens exist
HEVY_API_KEY=...          # fallback only, needs Hevy Pro
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

## 5. Garmin Connect — the `garmin` MCP server

`.mcp.json` at the repo root runs `taxuspt/garmin_mcp` (pinned to `655efb8f`)
through `uvx` on Python 3.12. Nothing to install by hand — `uvx` fetches and
builds it on first use. Verified working in a cloud session on 2026-09-19.

It gives 110+ Garmin tools, including `create_strength_workout`,
`schedule_week` and `push_workout_to_device`. This is the **only** route to a
gym session on the watch; intervals.icu cannot structure one.

Set these on the environment, not in the repo:

```
GARMIN_EMAIL=...
GARMIN_PASSWORD=...
```

After the first successful login, OAuth tokens are written to `GARMINTOKENS`
(default `~/.garminconnect`). The refresh token lasts about a year, so the
password can be dropped after that.

**This is an unofficial API.** Garmin's official Training API requires partner
approval unavailable to individuals, so this uses Garmin Connect's own web
endpoints and can break when Garmin changes them. The athlete agreed to that
trade-off on 2026-09-19. Endurance training does not depend on it.

Exercise `category` and `name` values must come from
`skills/tri-coach/references/garmin-exercise-map.md` — an invalid category is
rejected with `400`, and an unrecognised name silently degrades to a plain
description.

## 6. Hevy

Base `https://api.hevyapp.com/v1/`. Needs Hevy Pro. Key from Settings →
Developer.

Verified: an unauthenticated call to `/v1/workouts` returns `401 InvalidApiKey`,
so the endpoint shape is right. **The exact auth header name has not yet been
confirmed** — the published docs are JavaScript-rendered and the spec file is not
reachable. Confirm it against the live API on the first authenticated call rather
than assuming.

Used for: reading completed strength workouts (actual loads and reps), and
writing routines for the next block.

## 7. Google Calendar

| Calendar | ID | Use |
|---|---|---|
| **Fitness** | `c_049449fbb5852458d717c4c9bc45bd40fd7ed459407908ddde740e4a99901771@group.calendar.google.com` | Write training here |
| Personal | `c_82cab7487cc4eba60f89d0babb1332e576c7bf2c903bd0857d3866dd611233a0@group.calendar.google.com` | Physio. Read only. |
| Work | `george@findgush.com` | Read only, for conflicts |

Time zone `Asia/Dubai`. Always pass explicit offsets.

## 8. Install the skill

```bash
mkdir -p ~/.claude/skills
cp -R skills/tri-coach ~/.claude/skills/tri-coach
```

Or leave it in the repo — Claude Code loads skills from a project's `skills/`
directory when working inside it.

## 9. Remaining setup jobs

1. Set `GARMIN_EMAIL` and `GARMIN_PASSWORD` on the environment ⬅ **blocking**
2. After the first login, save the OAuth tokens and drop the password
3. Set a run threshold pace in intervals.icu — derived, not max-effort tested
4. Confirm the FTP 250 W test date; retest properly when the power meter arrives
5. Tell him when the power meter arrives, then retest FTP and move the bike off HR
