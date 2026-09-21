# Nutrition Plan

Last updated: 2026-09-21
Bodyweight of record: **74.0 kg** (Garmin, all 7 swims)
Built from measured intervals.icu data. Supersedes the estimate-based version.

## Energy targets

**BMR** (Mifflin-St Jeor, male, 74 kg, 174 cm, 32) = **1672 kcal**
**Baseline** (BMR x 1.2, daily living, no training) = **2007 kcal**

### Session energy — measured, not estimated

Device calories are **gross**: they include the resting energy the athlete
would have spent anyway. The baseline above already counts that. So the
figures below are **net**: gross minus (elapsed minutes x 1.16 kcal/min).
Add net figures only. Do not add gross figures to the baseline.

| Session | Net energy | Basis |
|---|---|---|
| **Morning swim class** | **200 kcal** | Mean of 09-01 (231) and 09-10 (172) |
| Afternoon swim, ~1125 m | 240 kcal | Mean of 09-06 (216) and 09-20 (262) |
| Run, ~5 km | 350 kcal | From the 09-07 and 09-12 records |
| Long ride (09-14, 54.8 km) | 1114 kcal | Measured |
| **Gym session** | **200 kcal (ESTIMATE)** | Not in the API. 40 min working time x 5 |

### Daily targets by day type

Goal undefined, so every row is **maintenance**.

| Day | kcal | Protein | Fat | Carbs | Carbs g/kg |
|---|---|---|---|---|---|
| Rest | 2007 | 148 g | 65 g | 208 g | 2.8 |
| Gym only | 2207 | 148 g | 65 g | 258 g | 3.5 |
| Swim class only | 2207 | 148 g | 65 g | 258 g | 3.5 |
| **Swim class + gym** | **2407** | **148 g** | **65 g** | **308 g** | **4.2** |
| Run ~5 km | 2357 | 148 g | 65 g | 295 g | 4.0 |
| Long ride day | 3121 | 148 g | 60 g | 497 g | 6.7 |

Rules: protein is fixed at 148 g (2.0 g/kg) every day. Fat drops to the
0.8 g/kg floor only on days above ~400 kcal of training. Carbs take the rest.

### Correction log — 2026-09-21

The previous version of this file assumed a 2.0 km swim at 3.0 kcal/kg/km,
giving 450 kcal and a swim+gym day of 2669 kcal. The measured class is
**200 m**, not 2 km, and costs **200 kcal net**, not 450. The swim+gym day
is **2407 kcal**. The earlier figure was 262 kcal too high.

The earlier dispute over the reference's swim coefficient (0.6-0.8 vs 3.0
kcal/kg/km) does not apply to these sessions at all. A distance-based
formula cannot model a 63-minute class that covers 200 m. **Use measured
device calories for this athlete's swims. The coefficient question is moot.**

## Safety floor — REDs

Body fat is not measured. 15% is assumed, which is the conservative choice.

- FFM = 74 x 0.85 = **62.9 kg**
- EA floor = 30 x 62.9 = **1887 kcal**
- Swim + gym day: minimum intake **2287 kcal**, maintenance 2407 kcal
- **Deficit room on such a day: approximately 120 kcal**

There is effectively no room to diet on a two-session day. Any deficit goes
on rest days, stays small, and waits until body fat is measured.

## The swim-to-gym bridge shake

### What this shake actually is

The morning class costs approximately **200 kcal net**. A 416 kcal shake
more than replaces it. So this shake is **not** a recovery drink for the
swim. It is **breakfast, plus fuel for the lift that follows.**

That distinction changes how the rest of the day is built. If the shake is
treated as an extra on top of a normal breakfast, the day overshoots its
2407 kcal target by roughly 400 kcal.

- **Shake replaces breakfast** -> use version A.
- **Breakfast already eaten** -> use version B.

### Version A — breakfast shake

| Item | Amount | Volume it adds |
|---|---|---|
| Marmum Fresh Protein Milk | 300 ml | 300 ml |
| Banana, ripe | 120 g | 120 ml |
| Date syrup | 25 g | 18 ml |
| Salt | 0.5 g | 0 ml |
| **Water and ice** | **165 ml** | **165 ml** |
| **Finished** | | **605 ml** |

61 g carbs, 28 g protein (0.38 g/kg), 7 g fat, **416 kcal**. Ratio 2.1:1.
Concentration 10.0%.

### Version B — top-up shake

| Item | Amount | Volume it adds |
|---|---|---|
| Marmum Fresh Protein Milk | 250 ml | 250 ml |
| Banana, ripe | 100 g | 100 ml |
| Date syrup | 12 g | 9 ml |
| Salt | 0.5 g | 0 ml |
| **Water and ice** | **80 ml** | **80 ml** |
| **Finished** | | **440 ml** |

44 g carbs, 24 g protein (0.32 g/kg), 6 g fat, **321 kcal**. Ratio 1.9:1.
Concentration 10.0%. Protein sits at the lower limit of an effective dose.
Do not cut it further.

### Design rules (unchanged)

- **Set each macro for its job. Do not chase a ratio.** Protein at or above
  0.3 g/kg is a floor. Carbs follow the work. The ratio is the output.
- **Concentration: 10 g of carbs per 100 ml.** Gastric emptying follows
  concentration, not grams. Scale volume with carbs.
  `Target ml = carbs g x 10` and
  `Water = Target - (milk ml + banana g + syrup g x 0.73)`.
- Ice counts as water. 100 g of ice becomes 100 ml on melting.
- Date syrup is 1.37 g/ml, so 25 g occupies only 18 ml.

### Digestion speed
1. Blend it thin, not thick.  2. Serve it cold.  3. Ripe banana only.
4. No added fibre.  5. Date syrup, never whole dates.

### Notes
- Milk protein is casein-dominant and clots in stomach acid. Hold the milk
  at 300 ml or less.
- 7 g of fat is the floor and all of it is from the milk. Add no other fat.
- Optional caffeine: 3 mg/kg = **222 mg** at 74 kg, taken with the shake.

## The larger point

The measured data shows an athlete with a **rising CTL, a 6.4 h mean sleep,
and 5 of 14 nights under 6 hours.** Sleep is a bigger lever than any change
available in this file. Fix sleep before tuning the shake further.

## Recalculation triggers

Recompute when bodyweight moves more than 1-2%, the phase or goal changes,
gym sessions become measurable, or every 2-4 weeks regardless.
