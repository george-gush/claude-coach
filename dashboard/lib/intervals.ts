const BASE = "https://intervals.icu/api/v1";

function auth() {
  const key = process.env.INTERVALS_API_KEY;
  if (!key) throw new Error("INTERVALS_API_KEY is not set");
  return "Basic " + Buffer.from(`API_KEY:${key}`).toString("base64");
}
const ATHLETE = () => process.env.INTERVALS_ATHLETE_ID || "i119853";

async function get(path: string) {
  const r = await fetch(`${BASE}/athlete/${ATHLETE()}${path}`, {
    headers: { Authorization: auth() },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`intervals.icu ${path} -> ${r.status}`);
  return r.json();
}

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};
export const daysAhead = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** intervals.icu returns artefact rows with a null type and no duration. Drop them. */
export const isRealActivity = (a: any) =>
  a && a.type && (a.moving_time || 0) > 0;

export const SPORT = (t: string) =>
  t === "Run" || t === "VirtualRun" || t === "TrailRun" ? "Run"
  : t === "Ride" || t === "VirtualRide" || t === "GravelRide" || t === "MountainBikeRide" ? "Bike"
  : t === "Swim" || t === "OpenWaterSwim" ? "Swim"
  : t === "WeightTraining" ? "Strength"
  : "Other";

/** Monday-start ISO week key, e.g. 2026-09-21 */
export function weekKey(dateStr: string) {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return iso(d);
}

export async function loadAll(historyDays = 120) {
  const oldest = iso(daysAgo(historyDays));
  const newest = iso(daysAhead(1));

  const [activities, wellness, events, sportSettings] = await Promise.all([
    get(`/activities?oldest=${oldest}&newest=${newest}`),
    get(`/wellness?oldest=${oldest}&newest=${newest}`),
    get(`/events?oldest=${iso(daysAgo(35))}&newest=${iso(daysAhead(21))}`),
    get(`/sport-settings`).catch(() => []),
  ]);

  return { activities, wellness, events, sportSettings };
}
