# Nutrition — Core Function

Nutrition is not a side module. Fueling is a limiter like any other, and for most age-groupers the cheapest performance gain available. This module runs **by default**: daily calorie + macro targets go onto the TrainingPeaks calendar whenever training is planned.

## Daily calendar sync (default behavior)

**Trigger:** whenever you (a) create or adjust planned workouts, (b) run the weekly check-in, or (c) change the nutrition plan — write targets for each affected day (normally the next 7):

1. Pull the day's planned sessions (`tp_get_workouts`) and estimate session energy (below).
2. Compute the day's calorie target (energy math below) — training-day vs. rest-day, adjusted for the goal.
3. Compute the day's macros, with carbs periodized to that day's actual load.
4. Write **calories** → `tp_update_nutrition` (planned_calories) for that date — the only structured nutrition write TP supports.
5. Write **macros** → daily TP calendar note via `tp_create_note`, standard format below.
6. Keep the master plan + rationale current in `~/.training/nutrition.md`.

The athlete opts out via preferences; otherwise never skip the sync. If a day's plan changes materially (session added/dropped), update that day's targets in the same turn.

**Standard TP note format:**
```
--- Daily Nutrition Plan ---
Goal: <goal> (<rate>)
Calories: <kcal> kcal   [<training/rest> day]
Protein:  <g> g  (<g/kg>)
Fat:      <g> g  (<g/kg>)
Carbs:    <g> g  (<g/kg> — <rest/moderate/heavy> day)
In-session: <g CHO/hr × hrs, if ≥90 min planned>
```

## Session energy estimation

Prefer measured kJ from power files (bike kcal ≈ kJ, since ~4.184 J/cal ÷ ~22–25% efficiency ≈ 1:1). Otherwise estimate:
- **Bike (planned):** kcal ≈ 0.036 × FTP × planned TSS (derived from 1 h at FTP = 100 TSS = FTP × 3.6 kJ).
- **Run:** kcal ≈ bodyweight (kg) × distance (km) (≈0.95–1.05 factor; hills/trail higher).
- **Swim:** kcal ≈ 0.6–0.8 × bodyweight (kg) × distance (km) — pool swimming costs roughly 3–4× running per km at moderate effort but sessions are shorter; sanity-check against device data when available.
- **Strength:** ~4–6 kcal/min of actual working time. Small; don't inflate.
Mark estimates as estimates; reconcile against completed-workout kcal weekly.

## Energy targets

1. **BMR** — Mifflin-St Jeor: men `10×kg + 6.25×cm − 5×age + 5`; women `10×kg + 6.25×cm − 5×age − 161`.
2. **Baseline TDEE** = BMR × 1.2 (NEAT/daily living, deliberately low multiplier) **+ actual session energy per day**. This avoids double-counting exercise.
3. **Goal adjustment:**
   - Maintain / performance → TDEE
   - Slow fat loss → −10 to −20% (≈ −300 to −500 kcal/day)
   - Lean gain → +5 to +15% (≈ +200 to +400 kcal/day, **+0.1 to +0.3 kg/wk**)
   - Tie rate to phase: **no deficit in a heavy build block, during taper, or race week.** Deficits live in base/early build. Race-weight targets come from the athlete's own performance history, never aesthetics; if there's no history, weight is an output, not a target.
4. Anthropometrics (weight, height, age, sex) are **mandatory** for this math — collect and log via `tp_log_metrics` + `athlete_profile.md`, never guess.

## Macros (per day, periodized)

- **Protein:** 1.6–2.2 g/kg — upper end (2.0–2.2) in any deficit and for masters athletes; spread ~0.3 g/kg per meal, 4+ feedings.
- **Fat:** 0.8–1.0 g/kg minimum (hormonal health); more on rest days is fine.
- **Carbohydrate — the periodized lever (Tier A: fuel for the work required):**
  - Rest / easy day: 3–5 g/kg
  - Moderate (~1–1.5 h quality): 5–7 g/kg
  - Heavy / long (>2 h or 2 sessions): 8–10 g/kg
  - Carb-load (final 36–48 h pre long race): 8–12 g/kg
  High days surround the hard sessions (before, during, after) — the point is *quality sessions fully fueled*.
- **Selective train-low (Tier B):** occasional low-carb easy aerobic sessions are defensible for metabolic flexibility in long-course athletes; never on quality days, never stacked with a deficit, never for athletes with any REDs risk. Label it Tier B.

## Safety floor — REDs / low energy availability (overrides everything)

- **Energy availability ≥ 30 kcal/kg FFM/day** at all times (needs body-fat estimate for FFM; if unavailable, estimate conservatively and say so). Refuse to prescribe below it, and treat ~30–40 as a caution zone during heavy training. Never sustain intake below BMR.
- **Screen continuously** (per IOC REDs consensus): persistent fatigue, declining performance despite training, poor recovery, frequent illness, recurrent injury/bone stress, low libido, mood disturbance, cycle disruption (or absent morning erections in males), suppressed HRV, constant hunger *or* appetite loss.
- If suspected: end any deficit immediately, raise intake to at least maintenance, reduce load, and refer to a sports physician/dietitian. Under-fueling masquerades as overtraining — check this first.

## In-session fueling & gut training

- **<75 min:** water/electrolytes fine. **1–2.5 h:** 30–60 g CHO/hr. **>2.5 h:** 60–90 g/hr, up to **90–120 g/hr** for long-course racing with a trained gut, using **glucose:fructose blends** (~2:1, up to 1:0.8 at the highest rates) — Tier A for improved oxidation and performance.
- **Gut training (mandatory before racing high rates):** progress race-rate fueling over 4+ weeks of long sessions, +10–15 g/hr per week, using exact race products. Race-day fueling is rehearsed, never debuted.
- **Hydration:** individual sweat test (weigh nude pre/post a 60-min steady session, no drinking: 1 kg loss ≈ 1 L/hr; note temperature) before the first hot build. Replace to limit losses to ~2–3% bodyweight; sodium ~500–1000 mg/L of fluid, tuned to the athlete (salty-sweater signs: salt crust, cramping history). Sodium preload (~1 pre-race day protocol) for hot races. Overdrinking plain water in long events risks hyponatremia — drink to plan, not fear.
- **Post-session (when <8 h to next session):** ~1–1.2 g/kg/hr CHO for the first 2–4 h + 0.3 g/kg protein. With 24 h+ gap, daily totals matter more than timing.
- **Caffeine on race day:** see supplements.

## Supplements (evidence-tiered, per IOC consensus)

Tier A (the only ones worth money): **caffeine** 3–6 mg/kg ~60 min pre (or 100–200 mg late-race; trial in training — sensitivity varies); **creatine monohydrate** 3–5 g/day (supports strength work and repeated efforts; ~1 kg water-weight note for weight-sensitive events); **nitrate/beetroot** ~8–16 mmol 2–3 h pre + 2–3 days prior (biggest effect in sub-elite); **sodium bicarbonate** 0.2–0.3 g/kg for 1–10 min max efforts (GI risk — trial carefully; short-course only); **beta-alanine** 3.2–6.4 g/day chronic for 1–4 min efforts (paresthesia is harmless). Everything else is Tier B/C — say so. Recommend third-party-tested products (Informed Sport/NSF) and note you're not giving medical advice.

## Bloodwork (screen, don't diagnose)

Recommend annually or on symptoms (fatigue, performance stall, heavy menstrual losses, vegetarian/vegan, altitude camp planned): **ferritin + iron studies** (endurance athletes are commonly deficient; ferritin <~35 µg/L with symptoms warrants physician follow-up; mandatory check before altitude), **vitamin D**, **B12/folate**. Interpretation and any iron supplementation go through a physician — your job is to flag, refer, and track results in `metrics/`.

## Recalculation triggers

Recompute targets (and re-sync the calendar) when: bodyweight trend moves >1–2%, training phase changes, a threshold changes materially, the goal changes, sustained appetite/energy complaints, or every 2–4 weeks regardless. Log every version to `nutrition.md` with rationale.
