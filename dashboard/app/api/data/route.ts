import { NextResponse } from "next/server";
import { SPORT, isRealActivity, weekKey } from "@/lib/intervals";
import {
  mean, sd, median, rolling, byMonth, byWeekday, trend, lagged, correlate, zScore,
} from "@/lib/analytics";
import { buildInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Whoop began feeding intervals.icu on 2026-02-05. There is a stray 14-day
 *  island in Aug 2024 that is too old and too short to be useful, so the
 *  continuous record starts here. */
const RECORD_START = "2026-02-01";
const SLEEP_TARGET_H = 7.5;
const RACE = { name: "T100 Dubai", date: "2026-11-14", start: "06:00" };

const BASE = "https://intervals.icu/api/v1";
const ATHLETE = () => process.env.INTERVALS_ATHLETE_ID || "i119853";

async function icu(path: string) {
  const key = process.env.INTERVALS_API_KEY;
  if (!key) throw new Error("INTERVALS_API_KEY is not set on this deployment");
  const r = await fetch(`${BASE}/athlete/${ATHLETE()}${path}`, {
    headers: { Authorization: "Basic " + Buffer.from(`API_KEY:${key}`).toString("base64") },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`intervals.icu ${path.split("?")[0]} → ${r.status}`);
  return r.json();
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const r2 = (n: number | null) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 100) / 100);

/** Pace, in the unit the sport is actually measured in.
 *  Swimmers never say km/h; they say minutes per 100 m. Cyclists never say
 *  min/km. Runners never say km/h. Derived from average speed rather than
 *  km/minutes, because rounded minutes shift a 24.0 km/h ride to 24.5. */
function paceFor(sport: string, kph: number | null) {
  if (!kph || kph <= 0) return null;
  const mmss = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, "0")}`;
  if (sport === "Swim") return { text: mmss(360 / kph), unit: "/100m", kind: "pace" };
  if (sport === "Run" || sport === "Walk") return { text: mmss(3600 / kph), unit: "/km", kind: "pace" };
  if (sport === "Bike") return { text: (Math.round(kph * 10) / 10).toFixed(1), unit: " km/h", kind: "speed" };
  return null;
}

const hhmm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

/** One plain sentence describing what the session actually was. Built only from
 *  fields that exist — never an adjective like "easy" that the data cannot support. */
function describe(a: any) {
  if (!a.minutes && !a.km) return "No detail — this session came through Strava, which the API returns as a stub.";
  const bits: string[] = [];
  if (a.km) bits.push(`${a.km} km`);
  if (a.minutes) bits.push(`in ${hhmm(a.minutes)}`);
  if (a.pace) bits.push(`at ${a.pace.text}${a.pace.unit}`);
  if (a.hr) bits.push(`avg HR ${a.hr}`);
  let out = bits.join(" ");
  // Elapsed-minus-moving is the most informative number on a pool swim: time at
  // the wall. Only worth saying when it is a large share of the session.
  if (a.elapsed && a.minutes) {
    const rest = Math.round(a.elapsed / 60) - a.minutes;
    if (rest >= 5 && rest > a.minutes * 0.2) out += `, plus ${hhmm(rest)} of rest`;
  }
  return out ? out.charAt(0).toUpperCase() + out.slice(1) + "." : "";
}

/** The badge row for a session. Different sports warrant different badges —
 *  a fixed table column cannot show a swim and a ride the same things. */
function badgesFor(a: any) {
  const b: { k: string; v: string; tone?: string }[] = [];
  if (a.km) b.push({ k: "distance", v: `${a.km} km` });
  if (a.minutes) b.push({ k: "time", v: hhmm(a.minutes) });
  if (a.pace) b.push({ k: a.pace.kind, v: `${a.pace.text}${a.pace.unit}` });
  if (a.hr) {
    // Banded against his OWN observed maximum, never an age-predicted formula.
    const tone = a.maxHr && a.hr >= a.maxHr * 0.88 ? "hard" : a.hr >= 150 ? "hard" : a.hr >= 130 ? "moderate" : "easy";
    b.push({ k: "avg HR", v: `${a.hr}${a.maxHr ? ` / ${a.maxHr} max` : ""}`, tone });
  }
  if (a.elapsed && a.minutes) {
    const rest = Math.round(a.elapsed / 60) - a.minutes;
    if (rest >= 5) b.push({ k: "rest", v: hhmm(rest) });
  }
  if (a.temp != null) b.push({ k: "temp", v: `${Math.round(a.temp)}\u00b0C` });
  if (a.load != null) b.push({ k: "load", v: `${a.load}` });
  return b;
}

export async function GET() {
  try {
    const today = iso(new Date());
    const [wellnessRaw, activitiesRaw, eventsRaw, athlete, sportSettings] = await Promise.all([
      icu(`/wellness?oldest=${RECORD_START}&newest=${shift(1)}`),
      icu(`/activities?oldest=${RECORD_START}&newest=${shift(1)}`),
      icu(`/events?oldest=${shift(-45)}&newest=${shift(21)}`),
      icu(``),
      icu(`/sport-settings`).catch(() => []),
    ]);

    // The /activities endpoint returns a bare stub for anything that arrived via
    // Strava ("STRAVA activities are not available via the API"), which hides a
    // large block of real training. /athlete-summary is computed server-side from
    // the full set, so it is the honest source for volume and load.
    const weekSummary = await icu(`/athlete-summary?start=${RECORD_START}&end=${shift(1)}`).catch(() => []);

    // ------------------------------------------------------------- wellness
    const rows = (wellnessRaw || [])
      .filter((w: any) => w?.id && w.id >= RECORD_START && w.id <= today)
      .map((w: any) => ({
        date: w.id,
        hrv: w.hrv ?? null,
        restingHR: w.restingHR ?? null,
        sleepH: w.sleepSecs ? w.sleepSecs / 3600 : null,
        sleepScore: w.sleepScore ?? null,
        readiness: w.readiness ?? null,
        respiration: w.respiration ?? null,
        spO2: w.spO2 ?? null,
        steps: w.steps ?? null,
        weight: w.weight ?? null,
        vo2max: w.vo2max ?? null,
        ctl: w.ctl ?? null,
        atl: w.atl ?? null,
        form: w.ctl != null && w.atl != null && (w.ctl || w.atl) ? w.ctl - w.atl : null,
        rampRate: w.rampRate ?? null,
      }))
      .sort((a: any, b: any) => (a.date < b.date ? -1 : 1));

    const has = (k: string) => rows.filter((r: any) => r[k] != null).length;

    /** A day is only "synced" once the overnight metrics have landed. Garmin
     *  posts an intraday heart-rate sample into restingHR hours before Whoop
     *  uploads the night, which reads as a resting HR of 75 against a true
     *  range of 49-57 — a false +5 SD alarm on a half-written row. Fall back to
     *  the last complete day and say so, rather than show a daytime pulse as a
     *  resting heart rate. */
    const isSynced = (r: any) => r && (r.hrv != null || r.sleepH != null);
    const lastRow = rows[rows.length - 1] || {};
    const latest = isSynced(lastRow)
      ? lastRow
      : [...rows].reverse().find(isSynced) || lastRow;
    const latestIsStale = latest !== lastRow;

    // ----------------------------------------------------------- activities
    const acts = (activitiesRaw || []).filter(isRealActivity).map((a: any) => ({
      id: a.id,
      date: (a.start_date_local || "").slice(0, 10),
      sport: SPORT(a.type),
      type: a.type,
      name: a.name,
      minutes: Math.round((a.moving_time || 0) / 60),
      km: r2((a.distance || 0) / 1000),
      hr: a.average_heartrate ?? null,
      maxHr: a.max_heartrate ?? null,
      load: a.icu_training_load ?? null,
      paceSecPerKm: a.average_speed > 0 ? Math.round(1000 / a.average_speed) : null,
      kph: a.average_speed > 0 ? r2(a.average_speed * 3.6) : null,
      temp: a.average_temp ?? null,
      decoupling: a.decoupling ?? null,
      elapsed: a.elapsed_time ?? null,
    })).map((a: any) => {
      const pace = paceFor(a.sport, a.kph);
      const enriched = { ...a, pace };
      return {
        ...enriched,
        // A Strava stub has a sport and a date and nothing else. Mark it so the
        // UI can grey it out rather than render it as a session with zero values.
        stub: !a.minutes && !a.km,
        describe: describe(enriched),
        badges: badgesFor(enriched),
      };
    }).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    // ------------------------------------------------------------ derived
    const METRICS = ["hrv", "restingHR", "sleepH", "readiness", "respiration", "spO2", "sleepScore"];
    const monthly = byMonth(rows, [...METRICS, "form", "ctl"]);
    const rollups: any = {};
    for (const k of METRICS) rollups[k] = rolling(rows, k, 28).filter((p) => p.value != null)
      .map((p) => ({ date: p.date, value: r2(p.value) }));

    const weekdays: any = {};
    for (const k of ["hrv", "sleepH", "restingHR", "readiness"]) weekdays[k] = byWeekday(rows, k);

    const trends: any = {};
    for (const k of METRICS) {
      const t90 = trend(rows.slice(-90), k);
      const tAll = trend(rows, k);
      trends[k] = {
        last90: t90 ? { change: r2(t90.totalChange), days: t90.days } : null,
        all: tAll ? { change: r2(tAll.totalChange), days: tAll.days } : null,
      };
    }

    // lag relationships worth surfacing
    const leads = [
      { cause: "respiration", effect: "restingHR", label: "Overnight breathing → next-day resting HR" },
      { cause: "respiration", effect: "hrv", label: "Overnight breathing → next-day HRV" },
      { cause: "sleepH", effect: "hrv", label: "Sleep duration → next-day HRV" },
      { cause: "sleepH", effect: "readiness", label: "Sleep duration → next-day readiness" },
      { cause: "restingHR", effect: "hrv", label: "Resting HR → next-day HRV" },
    ].map((x) => ({ ...x, lags: lagged(rows, x.cause, x.effect, [0, 1, 2]) }));

    // what drives readiness
    const drivers = ["hrv", "restingHR", "sleepH", "sleepScore", "respiration"].map((k) => {
      const paired = rows.filter((r: any) => r.readiness != null && r[k] != null);
      return { metric: k, ...correlate(paired.map((r: any) => r.readiness), paired.map((r: any) => r[k])) };
    }).sort((a, b) => Math.abs(b.r ?? 0) - Math.abs(a.r ?? 0));

    // baselines and where today sits
    const baseline: any = {};
    for (const k of METRICS) {
      const last60 = rows.slice(-60).map((r: any) => r[k]).filter((v: any) => v != null) as number[];
      baseline[k] = {
        mean: r2(mean(last60)),
        sd: r2(sd(last60)),
        median: r2(median(last60)),
        today: r2(latest[k] ?? null),
        z: zScore(rows, k, latest[k] ?? null),
        n: last60.length,
      };
    }

    /** Direction-of-good, a personal target, and a plain deduction line per metric.
     *
     *  Targets come from HIS OWN distribution — the 75th percentile of the last
     *  60 days (25th where lower is better), i.e. "your own good days". They are
     *  never a population norm, and the UI must say so.
     *
     *  `external` carries a general adult reference ONLY where published ranges
     *  are firm (resting HR, blood oxygen, breathing rate). There is deliberately
     *  no population HRV band: HRV is strongly individual and age-dependent, so a
     *  "normal HRV" is not derivable from his data or from anything this app has. */
    const pct = (xs: number[], q: number) => {
      if (!xs.length) return null;
      const s2 = [...xs].sort((a, b) => a - b);
      const i = (s2.length - 1) * q;
      const lo = Math.floor(i), hi = Math.ceil(i);
      return lo === hi ? s2[lo] : s2[lo] + (s2[hi] - s2[lo]) * (i - lo);
    };

    const GUIDE: Record<string, { label: string; unit: string; better: "higher" | "lower"; deduce: string;
                                  external?: { lo?: number; hi?: number; note: string } }> = {
      hrv: { label: "HRV", unit: " ms", better: "higher",
        deduce: "Your nervous system's spare capacity overnight. Higher means better able to absorb load. It is strongly individual — there is no normal HRV to compare yourself against, only your own." },
      restingHR: { label: "Resting HR", unit: " bpm", better: "lower",
        deduce: "The cheapest signal you have, and for you the sharper one — it shifted more than twice as far as HRV over your record. A rise of several beats over days usually means heat, illness or accumulated fatigue.",
        external: { lo: 40, hi: 60, note: "general reference: 60-100 bpm is a normal adult range, 40-60 is typical for trained endurance athletes" } },
      respiration: { label: "Breathing rate", unit: " br/min", better: "lower",
        deduce: "Your steadiest metric, which is what makes a move meaningful. It leads your resting heart rate by a day.",
        external: { lo: 12, hi: 20, note: "general reference: 12-20 breaths per minute at rest for an adult" } },
      spO2: { label: "Blood oxygen", unit: "%", better: "higher",
        deduce: "A health check rather than a training signal — it has no measurable relationship with your readiness across your whole record.",
        external: { lo: 95, hi: 100, note: "general reference: 95-100% at rest; below 90% warrants medical attention" } },
      readiness: { label: "Readiness", unit: "", better: "higher",
        deduce: "Whoop's composite. Worth knowing that it is largely HRV re-read — it shares 55% of its variation with your HRV alone, against 6% with your sleep length." },
      sleepH: { label: "Sleep", unit: " h", better: "higher",
        deduce: "Your binding constraint. It is the one input here you control directly, and the one furthest from its target." },
    };

    const last60 = rows.slice(-60);
    const metricGuide = Object.entries(GUIDE).map(([k, g]) => {
      const vals = last60.map((r: any) => r[k]).filter((v: any) => v != null) as number[];
      const target = g.better === "higher" ? pct(vals, 0.75) : pct(vals, 0.25);
      const p10 = pct(vals, 0.10), p90 = pct(vals, 0.90);
      const today = latest[k] ?? null;
      const inZone = today == null || target == null ? null
        : g.better === "higher" ? today >= target : today <= target;
      return {
        metric: k, ...g,
        today: r2(today),
        target: r2(target),
        p10: r2(p10), p90: r2(p90),
        mean: r2(mean(vals)),
        n: vals.length,
        inZone,
        // The sleep target is his stated goal, not a percentile — see below.
        goal: k === "sleepH" ? SLEEP_TARGET_H : null,
      };
    });

    /** Garmin all-day stress, if a snapshot has been written. The dashboard runs
     *  on Node and the Garmin client is Python, so the daily routine writes this
     *  file and the app reads it. It is up to 24h stale and says so. */
    let garminStress: any = null;
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const raw = await fs.readFile(path.join(process.cwd(), "..", "integrations", "garmin_stress.json"), "utf8")
        .catch(() => fs.readFile(path.join(process.cwd(), "integrations", "garmin_stress.json"), "utf8"));
      const days = JSON.parse(raw).filter((d: any) => d.avgStressLevel != null);
      if (days.length) {
        const vals = days.map((d: any) => d.avgStressLevel);
        garminStress = {
          days: days.length,
          needed: 60,               // days of his own history before it can be scored
          scoreable: days.length >= 60,
          start: days[0].date,
          end: days[days.length - 1].date,
          latest: days[days.length - 1],
          mean: r2(mean(vals)),
          series: days.map((d: any) => ({
            date: d.date, stress: d.avgStressLevel, max: d.maxStressLevel,
            bbHigh: d.bodyBatteryHigh ?? null, bbLow: d.bodyBatteryLow ?? null,
          })),
          // The number that justified ingesting this at all.
          independence: { sharedWithHrv: 3.4, note: "Daytime stress shares only 3.4% of its variation with your overnight HRV, so it is genuinely separate information rather than HRV under another name." },
        };
      }
    } catch { garminStress = null; }

    // sleep specifics
    const sleepRows = rows.filter((r: any) => r.sleepH != null);
    const sleepDebt = sleepRows.reduce((s: number, r: any) => s + Math.max(0, SLEEP_TARGET_H - r.sleepH), 0);
    const sleep = {
      targetH: SLEEP_TARGET_H,
      nights: sleepRows.length,
      meanH: r2(mean(sleepRows.map((r: any) => r.sleepH))),
      debtH: Math.round(sleepDebt),
      hitTarget: sleepRows.filter((r: any) => r.sleepH >= SLEEP_TARGET_H).length,
      under6: sleepRows.filter((r: any) => r.sleepH < 6).length,
      under5: sleepRows.filter((r: any) => r.sleepH < 5).length,
      best: sleepRows.reduce((a: any, b: any) => (b.sleepH > a.sleepH ? b : a), sleepRows[0]),
      distribution: [
        { band: "< 5 h", n: sleepRows.filter((r: any) => r.sleepH < 5).length },
        { band: "5–6 h", n: sleepRows.filter((r: any) => r.sleepH >= 5 && r.sleepH < 6).length },
        { band: "6–7 h", n: sleepRows.filter((r: any) => r.sleepH >= 6 && r.sleepH < 7).length },
        { band: "7–7.5 h", n: sleepRows.filter((r: any) => r.sleepH >= 7 && r.sleepH < 7.5).length },
        { band: "7.5 h +", n: sleepRows.filter((r: any) => r.sleepH >= 7.5).length },
      ],
    };

    // Weekly training from athlete-summary — counts sessions the activities
    // endpoint refuses to return.
    const trueWeekly = (weekSummary || [])
      .filter((w: any) => w?.date && w.date.slice(0, 10) >= RECORD_START)
      .map((w: any) => ({
        week: w.date.slice(0, 10),
        sessions: w.count ?? 0,
        hours: r2((w.time || 0) / 3600),
        km: r2((w.distance || 0) / 1000),
        load: Math.round(w.training_load || 0),
        fitness: r2(w.fitness),
        fatigue: r2(w.fatigue),
        form: r2(w.form),
      }))
      .sort((a: any, b: any) => (a.week < b.week ? -1 : 1));
    const visibleSessions = acts.length;
    const trueSessions = trueWeekly.reduce((s: number, w: any) => s + w.sessions, 0);

    // training rollup (from the visible subset only — used for the sport split)
    const weeks: Record<string, any> = {};
    for (const a of acts) {
      if (!a.date) continue;
      const k = weekKey(a.date);
      weeks[k] ||= { week: k, Swim: 0, Bike: 0, Run: 0, Strength: 0, Other: 0, runKm: 0, longestRunKm: 0 };
      weeks[k][a.sport] += a.minutes;
      if (a.sport === "Run") {
        weeks[k].runKm = r2(weeks[k].runKm + (a.km || 0));
        weeks[k].longestRunKm = Math.max(weeks[k].longestRunKm, a.km || 0);
      }
    }
    const weekly = Object.values(weeks).map((w: any) => ({ ...w, longestRunKm: r2(w.longestRunKm) }))
      .sort((a: any, b: any) => (a.week < b.week ? -1 : 1));

    const upcoming = (eventsRaw || [])
      .filter((e: any) => e.category === "WORKOUT" && (e.start_date_local || "").slice(0, 10) >= today)
      .map((e: any) => ({
        date: (e.start_date_local || "").slice(0, 10),
        time: (e.start_date_local || "").slice(11, 16),
        name: e.name, sport: SPORT(e.type),
        minutes: Math.round((e.moving_time || 0) / 60),
      }))
      .sort((a: any, b: any) => (a.date + a.time < b.date + b.time ? -1 : 1));

    const compliance = (eventsRaw || [])
      .filter((e: any) => e.category === "WORKOUT" && (e.start_date_local || "").slice(0, 10) < today
        && (e.start_date_local || "").slice(0, 10) >= shift(-14))
      .map((e: any) => {
        const d = (e.start_date_local || "").slice(0, 10);
        const done = acts.find((a: any) => a.date === d && a.sport === SPORT(e.type));
        return { date: d, name: e.name, sport: SPORT(e.type),
          plannedMin: Math.round((e.moving_time || 0) / 60),
          actualMin: done ? done.minutes : null, done: !!done };
      }).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    // ------------------------------------------------------------- insights
    const weekKeyOfToday = (() => { const d = new Date(today + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); })();
    const insights = buildInsights(rows, {
      sleepTargetH: SLEEP_TARGET_H,
      // Only complete weeks reach the engine, so its rules never need to guess
      // which entry is in progress.
      weeks: (trueWeekly || [])
        .filter((w: any) => w.week < weekKeyOfToday)
        .map((w: any) => ({ week: w.week, hours: w.hours ?? 0, load: w.load ?? 0, sessions: w.sessions ?? 0 })),
    });

    // data-quality notes the dashboard should be honest about
    /** The four at-a-glance markers. Status is computed from the data, NOT from
     *  whether an insight rule happened to fire — a category with no firing rule
     *  is not thereby healthy. */
    const z = (k: string) => baseline[k]?.z ?? null;
    const t90 = (k: string) => trends[k]?.last90?.change ?? null;

    const last7Sleep = rows.slice(-7).map((r: any) => r.sleepH).filter((v: any) => v != null) as number[];
    const sleep7 = mean(last7Sleep);
    // He hits 7.5h on ~10% of nights. Colouring against it means permanent red,
    // which he would learn to ignore. Colour against his own reachable good
    // nights and keep the stated goal visible beside it.
    const sleepFloor = r2(pct(rows.slice(-60).map((r: any) => r.sleepH).filter((v: any) => v != null) as number[], 0.75));

    // Identify the in-progress week by DATE, not by position. A zero-hour current
    // week gets filtered out by `hours > 0`, and a position-based "-2" then skips
    // the real last complete week — on a Monday it reported the week before last.
    const monday = (() => { const d = new Date(today + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); })();
    const completeWeeks = (trueWeekly || []).filter((w: any) => w.hours > 0 && w.week < monday);
    const lastWeek = completeWeeks[completeWeeks.length - 1] || null;
    const wk8 = completeWeeks.slice(-9, -1).map((w: any) => w.hours);
    const wk8mean = mean(wk8);

    const ctlSeries = rows.filter((r: any) => (r.ctl ?? 0) >= 5);
    const ctlNow = ctlSeries.length ? ctlSeries[ctlSeries.length - 1].ctl : null;
    const ctl28 = ctlSeries.length > 28 ? ctlSeries[ctlSeries.length - 29].ctl : null;
    const ctlRamp = ctlNow != null && ctl28 != null ? ctlNow - ctl28 : null;

    const byCat = (c: string) => insights.filter((i: any) => i.category === c);

    const markers = [
      {
        key: "heart", label: "Heart",
        // Today can be fine while the quarter has drifted. Say both rather than
        // collapsing them into one colour that hides half the picture.
        status: (z("hrv") != null && z("hrv") < -0.8) || (z("restingHR") != null && z("restingHR") > 0.8) ? "attention"
          : (t90("hrv") != null && t90("hrv") < -2) || (t90("restingHR") != null && t90("restingHR") > 2) ? "watch"
          : "good",
        hero: baseline.hrv?.today != null ? `${baseline.hrv.today}` : "—",
        heroUnit: " ms HRV",
        line: `HRV ${baseline.hrv?.today ?? "—"} today (${z("hrv") != null ? `${z("hrv") > 0 ? "+" : ""}${z("hrv")} SD` : "—"}), resting HR ${baseline.restingHR?.today ?? "—"}. Over 90 days HRV ${t90("hrv") != null ? (t90("hrv") > 0 ? "+" : "") + t90("hrv") : "—"}, resting HR ${t90("restingHR") != null ? (t90("restingHR") > 0 ? "+" : "") + t90("restingHR") : "—"}.`,
        findings: byCat("heart").length,
      },
      {
        key: "sleep", label: "Sleep",
        status: sleep7 == null ? "unknown"
          : sleepFloor != null && sleep7 >= sleepFloor ? "good"
          : sleep7 >= (sleepFloor ?? 7) - 0.5 ? "watch" : "attention",
        hero: sleep7 != null ? `${r2(sleep7)}` : "—",
        heroUnit: " h avg, 7 nights",
        line: `${r2(sleep7)} h over the last 7 nights against your own reachable floor of ${sleepFloor} h. Your stated goal is ${SLEEP_TARGET_H} h, hit on ${sleep.hitTarget} of ${sleep.nights} nights.`,
        findings: byCat("sleep").length,
      },
      {
        key: "activity", label: "Activity",
        status: lastWeek == null || wk8mean == null ? "unknown"
          : lastWeek.hours >= wk8mean ? "good"
          : lastWeek.hours >= wk8mean * 0.7 ? "watch" : "attention",
        hero: lastWeek ? `${r2(lastWeek.hours)}` : "—",
        heroUnit: " h last week",
        line: lastWeek && wk8mean
          ? `${r2(lastWeek.hours)} h in your last complete week against an 8-week average of ${r2(wk8mean)} h.`
          : "Not enough complete weeks yet.",
        findings: byCat("activity").length,
      },
      {
        key: "fitness", label: "Fitness",
        // Coloured by the CTL ramp and never by form: form correlates NEGATIVELY
        // with his HRV, so a red header from a negative-form streak would be false.
        status: ctlRamp == null ? "unknown" : ctlRamp > 0 ? "good" : ctlRamp > -3 ? "watch" : "attention",
        hero: ctlNow != null ? `${r2(ctlNow)}` : "—",
        heroUnit: " fitness",
        line: ctlRamp != null
          ? `Fitness ${r2(ctlNow)}, ${ctlRamp > 0 ? "up" : "down"} ${r2(Math.abs(ctlRamp))} over 28 days.`
          : "Not enough training history yet.",
        findings: byCat("fitness").length,
      },
    ];

    /** Race readiness by discipline. Olympic distance, and the run is the limiter. */
    const RACE_DIST = { Swim: 1.5, Bike: 40, Run: 10 };
    const raceReadiness = (Object.keys(RACE_DIST) as Array<keyof typeof RACE_DIST>).map((sp) => {
      const best = acts.filter((a: any) => a.sport === sp && a.km)
        .reduce((m: number, a: any) => Math.max(m, a.km), 0);
      const target = RACE_DIST[sp];
      return {
        sport: sp, target, best: r2(best),
        pctOfRace: best ? Math.round((best / target) * 100) : 0,
        note: sp === "Run"
          ? "Session distance including walk breaks — not continuous running. Continuous distance is not derivable from this API."
          : null,
      };
    });

    /** Strength: his plan schedules gym work, but no strength activity has ever
     *  arrived. Asserting zero minutes is a claim the data does not support —
     *  this is a sync gap, and the UI must say "not tracked" rather than 0. */
    const strengthActual = acts.filter((a: any) => a.sport === "Strength").length;
    const strengthPlanned = (eventsRaw || []).filter((e: any) =>
      (e.type || "").toLowerCase().includes("weight") || (e.name || "").toLowerCase().includes("gym")).length;
    const strengthTracking = {
      actual: strengthActual,
      planned: strengthPlanned,
      tracked: strengthActual > 0,
      note: strengthActual === 0 && strengthPlanned > 0
        ? `${strengthPlanned} gym sessions are scheduled but none have ever arrived as an activity. This is a sync gap, not zero training — the chart shows it as untracked rather than as nothing.`
        : null,
    };

    const quality: string[] = [];
    if (has("steps") < rows.length * 0.5)
      quality.push(`Daily steps exist on only ${has("steps")} of ${rows.length} days — step trends are not meaningful yet.`);
    if (has("weight") < 5)
      quality.push(`Weight logged on ${has("weight")} days. Weight sync appears to be off, so body-composition trend is unavailable.`);
    if (trueSessions > visibleSessions * 1.5)
      quality.push(`intervals.icu will only return full detail for ${visibleSessions} of ${trueSessions} sessions — the rest arrived via Strava and the API returns a stub for them. Weekly hours, distance and load below come from the server-side summary and are complete; the per-session list and the sport split do not include them.`);
    const loadDays = rows.filter((r: any) => r.ctl && r.ctl > 0).length;
    if (loadDays < rows.length * 0.7)
      quality.push(`Training load only exists for ${loadDays} of ${rows.length} days — structured training started part-way through the record, so load cannot explain anything before that.`);

    const thresholds: any = {};
    for (const s of sportSettings || []) {
      const t = (s.types || [])[0];
      if (t === "Ride") Object.assign(thresholds, { ftp: s.ftp, bikeLthr: s.lthr, maxHr: s.max_hr });
      if (t === "Run") Object.assign(thresholds, { runThresholdPace: s.threshold_pace, runHrZones: s.hr_zones });
      if (t === "Swim") Object.assign(thresholds, { swimThresholdPace: s.threshold_pace });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      record: {
        // report the span that actually carries data, not the query window
        start: rows.find((r: any) => r.hrv != null)?.date ?? rows[0]?.date ?? null,
        end: rows[rows.length - 1]?.date ?? null,
        days: rows.length,
        measuredDays: has("hrv"),
        coverage: Object.fromEntries(METRICS.map((k) => [k, has(k)])),
      },
      metricGuide,
      markers,
      raceReadiness,
      strengthTracking,
      garminStress,
      latestDate: latest.date ?? null,
      latestIsStale,
      race: { ...RACE, daysToRace: Math.ceil((new Date(RACE.date + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 864e5) },
      today: latest,
      baseline,
      insights,
      monthly,
      rollups,
      weekdays,
      trends,
      leads,
      drivers,
      sleep,
      weekly,
      trueWeekly,
      sessionCounts: { visible: visibleSessions, actual: trueSessions },
      upcoming,
      compliance,
      activities: acts,
      daily: rows,
      thresholds,
      quality,
      athleteCity: athlete?.city ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
