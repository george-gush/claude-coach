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
    const latest = rows[rows.length - 1] || {};

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
      paceSecPerKm: a.average_speed > 0 && SPORT(a.type) === "Run" ? Math.round(1000 / a.average_speed) : null,
      kph: a.average_speed > 0 ? r2(a.average_speed * 3.6) : null,
      temp: a.average_temp ?? null,
      decoupling: a.decoupling ?? null,
      elapsed: a.elapsed_time ?? null,
    })).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

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
    const insights = buildInsights(rows, { sleepTargetH: SLEEP_TARGET_H });

    // data-quality notes the dashboard should be honest about
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
