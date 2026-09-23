# Garmin Exercise Map — Strength Sessions A and B

Validated against the Garmin Connect exercise catalogue on 2026-09-19.
Catalogue: **1,527 exercises across 47 categories**, from `garminconnect` 0.3.16
(`garminconnect.exercises`). Every row below was checked to exist with the exact
category and exercise key shown.

Use with `create_strength_set(category, step_order, sets, reps, rest_seconds,
exercise_name, weight_kg)`.

| Programme exercise | Garmin category | Garmin exercise key | Note |
|---|---|---|---|
| Bulgarian split squat | `LUNGE` | `BARBELL_BULGARIAN_SPLIT_SQUAT` |  |
| Cable fly | `FLYE` | `CABLE_CROSSOVER` |  |
| Chest-supported row | `ROW` | `CHEST_SUPPORTED_DUMBBELL_ROW` |  |
| Copenhagen plank | `BANDED_EXERCISES` | `SIDE_PLANK_LEG_LIFTS` | **Substitute** — adductor/lateral-hip equivalent |
| Cossack squat | `LUNGE` | `SIDE_LUNGE` | **Substitute** — same frontal-plane pattern |
| DB biceps curl | `CURL` | `ALTERNATING_DUMBBELL_BICEPS_CURL` |  |
| Dead bug | `HIP_STABILITY` | `DEAD_BUG` |  |
| Face pull | `ROW` | `BANDED_FACE_PULLS` |  |
| Hack squat | `SQUAT` | `BARBELL_HACK_SQUAT` |  |
| Hip abduction (banded walk) | `HIP_STABILITY` | `LATERAL_WALKS_WITH_BAND_AT_ANKLES` |  |
| Hip thrust | `HIP_RAISE` | `BARBELL_HIP_THRUST_ON_FLOOR` |  |
| Incline DB press | `BENCH_PRESS` | `INCLINE_DUMBBELL_BENCH_PRESS` |  |
| KB knee raise | `HIP_STABILITY` | `WEIGHTED_EXTERNAL_HIP_RAISE` | **Substitute** — loaded standing hip flexor |
| Kettlebell swing | `HIP_RAISE` | `KETTLEBELL_SWING` |  |
| Lat pulldown | `PULL_UP` | `CLOSE_GRIP_LAT_PULLDOWN` |  |
| Lateral raise | `LATERAL_RAISE` | `DUMBBELL_LATERAL_RAISE` |  |
| Lying leg curl | `LEG_CURL` | `WEIGHTED_LEG_CURL` |  |
| Med-ball chest throw | `PUSH_UP` | `MEDICINE_BALL_CHEST_PASS` |  |
| Overhead triceps extension | `TRICEPS_EXTENSION` | `CABLE_OVERHEAD_TRICEPS_EXTENSION` |  |
| Pallof press | `CHOP` | `HALF_KNEELING_STABILITY_CHOP` | **Substitute** — anti-rotation equivalent |
| Seated DB shoulder press | `SHOULDER_PRESS` | `SEATED_DUMBBELL_SHOULDER_PRESS` |  |
| Seated calf raise | `CALF_RAISE` | `SEATED_CALF_RAISE` |  |
| Single-leg RDL | `DEADLIFT` | `SINGLE_LEG_ROMANIAN_DEADLIFT_WITH_DUMBBELL` |  |
| Sled push | `SLED` | `PUSH` | `SLED` is the CATEGORY, not an exercise. Using it as the name silently produced a generic step. |
| Spanish squat / wall sit | `SQUAT` | `BODY_WEIGHT_WALL_SQUAT` | **Substitute** — standard isometric quad alternative |
| Standing calf raise | `CALF_RAISE` | `SINGLE_LEG_STANDING_CALF_RAISE` |  |
| Tibialis raise | `CALF_RAISE` | `SEATED_DUMBBELL_TOE_RAISE` | **Substitute** — closest tib ant loading in catalog |

## The six substitutions

These six are not in Garmin's catalogue under their usual names. The substitute
keeps the training intent, but **tell him what he is actually doing** — the watch
will show Garmin's name, not ours.

| Prescribed | Watch shows | Does it preserve the intent? |
|---|---|---|
| Cossack squat | Side Lunge | Yes. Same frontal-plane pattern, same depth staging applies. |
| Spanish squat | Body Weight Wall Squat | Yes. Both are isometric quad holds with low joint shear. |
| Tibialis raise | Seated Dumbbell Toe Raise | Yes. Same muscle, seated rather than against a wall. |
| Copenhagen plank | Side Plank Leg Lifts | Partly. Less adductor-specific. Keep the short-lever progression regardless of the name. |
| Kettlebell knee raise | Weighted External Hip Raise | Yes. Loaded standing hip flexor, which is what he described. |
| Pallof press | Half Kneeling Stability Chop | Yes. Anti-rotation family. |
| Leg-extension isometric @ 60 deg | Banded Exercises / Leg Extension | Yes. Garmin has **no machine leg extension**; this is the only knee-extension entry with quads as primary. Build it as a TIMED step (conditionTypeKey `time`, 30 s), LEFT then RIGHT in one repeat group, with a step note saying to use the machine. |

**Timed holds work on strength steps.** `endCondition: {conditionTypeId: 2, conditionTypeKey: "time"}` with `endConditionValue` in seconds. Use this for every isometric instead of a 1-rep placeholder — a 1-rep hold logs as 0 reps and looks like a missed set.

## Regenerating this map

```bash
python3.12 -m venv .venv && .venv/bin/pip install 'garminconnect>=0.3.16'
# then: garminconnect.exercises.find('<term>') -> [{name, category, exercise}]
```

`garminconnect` 0.3.16 requires **Python 3.12+**. `resolve()` needs the exact
display name; `find()` does substring search but returns first match, not best —
always check the category is sensible before trusting a result.
