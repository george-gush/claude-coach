import { NextResponse } from "next/server";
import { loadAll, isRealActivity, SPORT, weekKey, iso, daysAgo } from "@/lib/intervals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RACE = { name: "T100 Dubai", date: "2026-11-14", start: "06:00" };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number | null, p = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? null : Math.round(n * 10 ** p) / 10 ** p;

export async function GET() {
  try {
    const { activities, wellness, events, sportSettings } = await loadAll(120);

    const acts = (activities || []).filter(isRealActivity).map((a: any) => ({
      id: a.id,
      date: (a.start_date_local || "").slice(0, 10),
      start: a.start_date_local,
      sport: SPORT(a.type),
      type: a.type,
      name: a.name,
      minutes: round((a.moving_time || 0) / 60, 0),
      km: round((a.distance || 0) / 1000, 2),
      hr: a.average_heartrate ?? null,
      maxHr: a.max_heartrate ?? null,
      load: a.icu_training_load ?? null,
      paceSecPerKm:
        a.average_speed > 0 && SPORT(a.type) === "Run" ? Math.round(1000 / a.average_speed) : null,
      kph: a.average_speed > 0 ? round(a.average_speed * 3.6, 1) : null,
    }));
    acts.sort((a, b) => (a.start < b.start ? 1 : -1));

    // ---- wellness -------------------------------------------------------
    const well = (wellness || [])
      .filter((w: any) => w && w.id)
      .map((w: any) => ({
        date: w.id,
        hrv: w.hrv ?? null,
        rhr: w.restingHR ?? null,
        sleepH: w.sleepSecs ? round(w.sleepSecs / 3600, 1) : null,
        readiness: w.readiness ?? null,
        ctl: w.ctl ?? null,
        atl: w.atl ?? null,
        form: w.ctl != null && w.atl != null ? round(w.ctl - w.atl, 1) : null,
        weight: w.weight ?? null,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const last = <T,>(xs: T[], n: number) => xs.slice(Math.max(0, xs.length - n));
    const vals = (xs: any[], k: string) =>
      xs.map((x) => x[k]).filter((v) => v !== null && v !== undefined) as number[];

    const hrv7 = round(avg(vals(last(well, 7), "hrv")));
    const hrv60 = round(avg(vals(last(well, 60), "hrv")));
    const sleep7 = round(avg(vals(last(well, 7), "sleepH")));
    const rhr7 = round(avg(vals(last(well, 7), "rhr")), 0);
    const latest = well[well.length - 1] || {};

    // ---- readiness verdict ---------------------------------------------
    const reasons: string[] = [];
    let status: "green" | "amber" | "red" = "green";
    if (hrv7 !== null && hrv60 !== null && hrv7 < hrv60 * 0.9) {
      status = "amber";
      reasons.push(`7-day HRV ${hrv7} is below the 60-day baseline of ${hrv60}`);
    }
    if (sleep7 !== null && sleep7 < 6.5) {
      status = status === "green" ? "amber" : status;
      reasons.push(`7-day sleep averaging ${sleep7} h, target 7.5 h`);
    }
    if (sleep7 !== null && sleep7 < 5.5) {
      status = "red";
    }
    if (latest.form !== null && latest.form !== undefined && latest.form < -20) {
      status = status === "green" ? "amber" : status;
      reasons.push(`form at ${latest.form} — heavy accumulated fatigue`);
    }
    if (!reasons.length) reasons.push("Recovery markers within normal range.");

    // ---- weekly rollup --------------------------------------------------
    const weeks: Record<string, any> = {};
    for (const a of acts) {
      if (!a.date) continue;
      const k = weekKey(a.date);
      weeks[k] = weeks[k] || { week: k, Swim: 0, Bike: 0, Run: 0, Strength: 0, Other: 0, runKm: 0, longestRunKm: 0, totalMin: 0 };
      weeks[k][a.sport] = round((weeks[k][a.sport] || 0) + (a.minutes || 0), 0);
      weeks[k].totalMin += a.minutes || 0;
      if (a.sport === "Run") {
        weeks[k].runKm = round(weeks[k].runKm + (a.km || 0), 2);
        weeks[k].longestRunKm = Math.max(weeks[k].longestRunKm, a.km || 0);
      }
    }
    const weekly = Object.values(weeks)
      .map((w: any) => ({ ...w, longestRunKm: round(w.longestRunKm, 2) }))
      .sort((a: any, b: any) => (a.week < b.week ? -1 : 1));

    // ---- run progression ------------------------------------------------
    const runs = acts
      .filter((a) => a.sport === "Run")
      .map((a) => ({ date: a.date, km: a.km, minutes: a.minutes, paceSecPerKm: a.paceSecPerKm, hr: a.hr }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // ---- planned vs actual, last 7 days ---------------------------------
    const since = iso(daysAgo(7));
    const planned = (events || []).filter(
      (e: any) => e.category === "WORKOUT" && (e.start_date_local || "").slice(0, 10) >= since
    );
    const compliance = planned.map((e: any) => {
      const d = (e.start_date_local || "").slice(0, 10);
      const done = acts.find((a) => a.date === d && a.sport === SPORT(e.type));
      return {
        date: d,
        name: e.name,
        sport: SPORT(e.type),
        plannedMin: Math.round((e.moving_time || 0) / 60),
        actualMin: done ? done.minutes : null,
        actualKm: done ? done.km : null,
        done: !!done,
      };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));

    const upcoming = (events || [])
      .filter((e: any) => e.category === "WORKOUT" && (e.start_date_local || "").slice(0, 10) >= iso(new Date()))
      .map((e: any) => ({
        date: (e.start_date_local || "").slice(0, 10),
        time: (e.start_date_local || "").slice(11, 16),
        name: e.name,
        sport: SPORT(e.type),
        minutes: Math.round((e.moving_time || 0) / 60),
        description: e.description || "",
      }))
      .sort((a: any, b: any) => (a.date + a.time < b.date + b.time ? -1 : 1));

    const today = iso(new Date());
    const daysToRace = Math.ceil(
      (new Date(RACE.date + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 864e5
    );

    const thresholds: any = {};
    for (const s of sportSettings || []) {
      const t = (s.types || [])[0];
      if (t === "Ride") { thresholds.ftp = s.ftp; thresholds.bikeLthr = s.lthr; thresholds.maxHr = s.max_hr; thresholds.bikeHrZones = s.hr_zones; }
      if (t === "Run") { thresholds.runThresholdPace = s.threshold_pace; thresholds.runHrZones = s.hr_zones; }
      if (t === "Swim") { thresholds.swimThresholdPace = s.threshold_pace; }
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      race: { ...RACE, daysToRace },
      readiness: {
        status,
        reasons,
        hrv7, hrv60, sleep7, rhr7,
        form: latest.form ?? null,
        ctl: round(latest.ctl),
        atl: round(latest.atl),
        lastNight: { sleepH: latest.sleepH ?? null, hrv: latest.hrv ?? null, rhr: latest.rhr ?? null },
      },
      thresholds,
      wellness: well,
      weekly,
      runs,
      activities: acts,
      compliance,
      upcoming,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
