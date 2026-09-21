# Nutrition Plan

Last updated: 2026-09-21
Bodyweight of record: 75 kg

## Energy targets

Bodyweight 75 kg. Male, 32, 174 cm.

**BMR** (Mifflin-St Jeor) = 10(75) + 6.25(174) - 5(32) + 5 = **1682 kcal**
**Baseline** (BMR x 1.2, daily living, no training) = **2019 kcal**

Session energy is added on top of the baseline. This avoids double counting.

### Session energy estimates

| Session | Estimate |
|---|---|
| Swim, 1.5 km | 338 kcal |
| Swim, 2.0 km | 450 kcal |
| Swim, 2.5 km | 562 kcal |
| Gym, ~40 min working time | 200 kcal |

Swim figures use **3.0 kcal/kg/km**. See "Swim coefficient" below.
Mark all of these as estimates. Reconcile against device data when available.

### Daily targets by day type

Goal is undefined, so every row is **maintenance**. No deficit, no surplus.

| Day | kcal | Protein | Fat | Carbs | Carbs g/kg |
|---|---|---|---|---|---|
| Rest | 2019 | 150 g | 65 g | 208 g | 2.8 |
| Gym only | 2219 | 150 g | 65 g | 258 g | 3.4 |
| Swim only (2 km) | 2469 | 150 g | 60 g | 332 g | 4.4 |
| **Swim + gym** | **2669** | **150 g** | **60 g** | **382 g** | **5.1** |

Rules used to build these rows:
- **Protein is held at 150 g (2.0 g/kg) on every day**, including rest days.
  Protein is not a variable. It does not flex with training load.
- **Fat drops to the 0.8 g/kg floor (60 g) on two-session days.** Carbs take
  priority when the work is there. Fat rises again on lighter days.
- **Carbs absorb all remaining calories.** They are the periodized lever.

The rest-day figure of 2.8 g/kg sits just under the 3-5 g/kg band in the
reference. That is a consequence of the calorie budget, not an error. Do not
force carbs up on a rest day by cutting protein.

### Swim coefficient — deviation from the reference, recorded

`references/nutrition.md` gives swim energy as `0.6-0.8 x kg x km`. That
formula contradicts the sentence beside it, which states that swimming costs
roughly 3 to 4 times running per km. Running is approximately 1.0 kcal/kg/km,
so swimming should be approximately 3 to 4 kcal/kg/km.

As written, the formula gives 105 kcal for a 2 km swim at 75 kg. A MET-based
check (MET 8, 75 kg, 30 min) gives approximately 300 kcal for 1.5 km, which is
2.7 kcal/kg/km. The formula appears to be low by a factor of about four.

**This plan uses 3.0 kcal/kg/km.** If the reference is later corrected, or if
device data contradicts this, revisit these targets.

## Safety floor — REDs

Energy availability must stay at or above **30 kcal/kg fat-free mass per day**.

Body fat is **not measured**. The figures below assume 15%, which is the
conservative choice — a lower body fat gives a higher fat-free mass and
therefore a higher floor.

- Assumed FFM = 75 x 0.85 = **63.8 kg**
- EA floor = 30 x 63.8 = **1912 kcal**

**On a swim + gym day:**
- Minimum intake = 1912 + 650 (exercise) = **2562 kcal**
- Maintenance = 2669 kcal
- **Room for a deficit = approximately 105 kcal**

This is the most important number in this file. There is effectively **no room
to diet on a two-session day.** A 15% deficit on such a day drops energy
availability to approximately 25 kcal/kg FFM, well below the floor.

If fat loss ever becomes a goal, the deficit goes on rest days and single-
session days only, and it stays small. Measure body fat before attempting it.

## Swim-to-gym bridge shake

Used on days when a gym session follows a swim class by 45 to 60 minutes.

**Design rule: choose each macro for its job. Do not chase a ratio.**
- Protein 28 g = 0.37 g/kg. This is the dose that triggers muscle protein
  synthesis. It is a floor, not a variable.
- Carbs are set by the work done and the work to come.
- The ratio is the output of those two numbers.

**Concentration rule: 10 g of carbs per 100 ml of finished shake.**
Gastric emptying follows concentration, not grams. A drink above
approximately 12% sits in the stomach. Scale the volume with the carbs.

### Standard version

| Item | Amount | Volume it adds |
|---|---|---|
| Marmum Fresh Protein Milk | 300 ml | 300 ml |
| Banana, ripe | 120 g | 120 ml |
| Date syrup | 25 g | 18 ml |
| Salt | 0.5 g | 0 ml |
| **Water and ice** | **165 ml** | **165 ml** |
| **Finished** | | **600 ml** |

60 g carbs, 28 g protein, 7 g fat, approximately 370 mg sodium, 415 kcal.
Ratio 2.1:1. Concentration 10.0%.

### Big-day version
For a swim of 90 minutes or more, followed by a heavy compound lift.

| Item | Amount | Volume it adds |
|---|---|---|
| Marmum Fresh Protein Milk | 300 ml | 300 ml |
| Banana, ripe | 150 g | 150 ml |
| Date syrup | 40 g | 29 ml |
| Salt | 0.5 g | 0 ml |
| **Water and ice** | **300 ml** | **300 ml** |
| **Finished** | | **780 ml** |

78 g carbs, 29 g protein, 7 g fat, 490 kcal. Ratio 2.7:1. Concentration 10.0%.

### Rules that control digestion speed
1. Blend it thin, not thick.
2. Serve it cold.
3. Use a ripe banana. A green banana has resistant starch and more fibre.
4. Add no fibre. No oats, no chia, no flax, no seeds, no whole dates.
5. Use date syrup, not whole dates. Whole dates carry approximately
   7 g of fibre per 100 g.

### Notes
- The milk protein is casein-dominant. Casein clots in stomach acid and
  digests slower than whey. Hold the milk at 300 ml for this reason.
- The 7 g of fat is the floor. All of it comes from the milk itself at
  2.1 g per 100 ml. Add no other fat before a lift.
- Optional: caffeine at 3 mg/kg = 225 mg, taken with the shake. The
  45 to 60 minute gap matches the blood peak. Test it on an easy day first.

## Protein distribution

150 g per day, over 4 or more feedings, at approximately 0.3 g/kg each.
That is approximately 22 g per feeding. The bridge shake supplies 28 g of it.

## Open actions
1. Record the actual swim distance per class. The 2.0 km assumption drives
   the whole swim+gym calorie figure.
2. Record actual gym working time. 40 minutes is an assumption.
3. Supply body-fat % if known. This firms up the REDs floor.
4. Define the goal. Until then every target stays at maintenance.
5. Run a sweat test before the next hot block. Weigh nude before and after
   a 60-minute steady session, with no drinking. A 1 kg loss is 1 L per hour.

## Recalculation triggers

Recompute when bodyweight moves more than 1-2%, the training phase changes,
the goal changes, appetite or energy complaints persist, or every 2-4 weeks
regardless. Log each version here with the reason.
