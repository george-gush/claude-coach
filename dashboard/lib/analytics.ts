/** Statistics and insight detection over daily health series.
 *  Everything here is deliberately conservative: it refuses to report a
 *  relationship it does not have the sample size to support. */

export type Row = Record<string, any> & { date: string };

// ---------------------------------------------------------------- primitives

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function sd(xs: number[]) {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
}

/** Pearson r, with SIGNIFICANCE and EFFECT SIZE reported separately.
 *
 *  These are different questions and conflating them misleads. The old version
 *  returned "strong" off a t-test alone, so at n=228 it called breathing rate
 *  (r=-0.225) exactly as strong as HRV (r=+0.741) — a significance test wearing
 *  an effect-size word. Significance says "this is unlikely to be chance";
 *  effect size says "this actually matters". Both are reported, and the plain
 *  verdict is built from both.
 *
 *  `shared` is r squared as a percentage: how much of one series' variation is
 *  accounted for by the other. It is the number a non-statistician can actually
 *  use, and it is brutal about weak correlations — r=0.245 is 6%, not "a link". */
export function correlate(a: number[], b: number[]) {
  const pairs = a.map((x, i) => [x, b[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = pairs.length;
  if (n < 8) return {
    r: null, n, shared: null, significant: false,
    strength: "unknown" as const, verdict: "too few paired days" as const,
  };
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = mean(xs)!;
  const my = mean(ys)!;
  const num = pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  const r = den ? num / den : 0;
  // t = r*sqrt(n-2)/sqrt(1-r^2); |t| > ~2 is p<0.05 for n>30
  const t = Math.abs(r) >= 1 ? Infinity : Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r));
  const significant = n >= 20 && t > 2.0;
  const abs = Math.abs(r);
  // Effect-size bands. Conventional for behavioural data, where r=0.5 is already
  // a powerful relationship and r=0.2 is real but nearly useless for prediction.
  const strength =
    abs >= 0.5 ? ("strong" as const)
    : abs >= 0.3 ? ("moderate" as const)
    : abs >= 0.1 ? ("weak" as const)
    : ("negligible" as const);
  const verdict =
    n < 20 ? ("sample too small to call" as const)
    : !significant ? ("no reliable relationship" as const)
    : strength === "strong" ? ("strong link" as const)
    : strength === "moderate" ? ("moderate link" as const)
    : ("real but weak" as const);
  return {
    r: Math.round(r * 1000) / 1000,
    n,
    shared: Math.round(r * r * 1000) / 10, // percent of shared variation, 1dp
    significant,
    strength,
    verdict,
  };
}

/** Rolling mean over the previous `win` values, aligned to the last element. */
export function rolling(rows: Row[], key: string, win: number) {
  return rows.map((row, i) => {
    const slice = rows.slice(Math.max(0, i - win + 1), i + 1)
      .map((r) => r[key]).filter((v) => v != null) as number[];
    return { date: row.date, value: slice.length >= Math.ceil(win / 2) ? mean(slice) : null };
  });
}

/** Ordinary least squares slope per day, plus total change across the window. */
export function trend(rows: Row[], key: string) {
  const pts = rows.map((r, i) => [i, r[key]]).filter(([, v]) => v != null) as number[][];
  if (pts.length < 10) return null;
  const mx = mean(pts.map((p) => p[0]))!;
  const my = mean(pts.map((p) => p[1]))!;
  const num = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
  const den = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  const slope = den ? num / den : 0;
  const span = pts[pts.length - 1][0] - pts[0][0];
  return { perDay: slope, totalChange: slope * span, days: pts.length, startValue: my - slope * (mx - pts[0][0]) };
}

/** Group by YYYY-MM and average each key. */
export function byMonth(rows: Row[], keys: string[]) {
  const groups: Record<string, Row[]> = {};
  for (const r of rows) (groups[r.date.slice(0, 7)] ||= []).push(r);
  return Object.entries(groups)
    .map(([month, rs]) => {
      const out: any = { month, n: rs.length };
      for (const k of keys) {
        const v = rs.map((r) => r[k]).filter((x) => x != null) as number[];
        out[k] = v.length ? Math.round(mean(v)! * 100) / 100 : null;
        out[`${k}_n`] = v.length;
      }
      return out;
    })
    .sort((a, b) => (a.month < b.month ? -1 : 1));
}

/** Day-of-week means. 0 = Monday. */
export function byWeekday(rows: Row[], key: string) {
  const NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const groups: number[][] = [[], [], [], [], [], [], []];
  for (const r of rows) {
    if (r[key] == null) continue;
    const d = new Date(r.date + "T00:00:00Z").getUTCDay();
    groups[(d + 6) % 7].push(r[key]);
  }
  return NAMES.map((name, i) => ({
    name,
    value: groups[i].length ? Math.round(mean(groups[i])! * 100) / 100 : null,
    n: groups[i].length,
  }));
}

/** Does `cause` on day N move `effect` on day N+lag? Returns correlation at each lag. */
export function lagged(rows: Row[], cause: string, effect: string, lags = [0, 1, 2]) {
  return lags.map((lag) => {
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i + lag < rows.length; i++) {
      const c = rows[i][cause];
      const e = rows[i + lag][effect];
      if (c != null && e != null) { a.push(c); b.push(e); }
    }
    return { lag, ...correlate(a, b) };
  });
}

/** Split the series at every candidate point and find where the mean shifts most.
 *  Crude but honest changepoint detection — reports effect size, not a p-value. */
export function changepoint(rows: Row[], key: string, minSegment = 21) {
  const pts = rows.filter((r) => r[key] != null);
  if (pts.length < minSegment * 2) return null;
  let best: any = null;
  for (let i = minSegment; i < pts.length - minSegment; i++) {
    const before = pts.slice(0, i).map((r) => r[key]) as number[];
    const after = pts.slice(i).map((r) => r[key]) as number[];
    const mb = mean(before)!, ma = mean(after)!;
    const pooled = Math.sqrt(((sd(before) ?? 0) ** 2 + (sd(after) ?? 0) ** 2) / 2);
    const effect = pooled ? Math.abs(ma - mb) / pooled : 0;
    if (!best || effect > best.effect) {
      best = { date: pts[i].date, before: Math.round(mb * 100) / 100, after: Math.round(ma * 100) / 100, effect: Math.round(effect * 100) / 100 };
    }
  }
  // Cohen's d < 0.5 is not worth showing as a "shift"
  return best && best.effect >= 0.5 ? best : null;
}

/** Where does today sit against this athlete's own history? */
export function zScore(rows: Row[], key: string, value: number | null, window = 60) {
  if (value == null) return null;
  const hist = rows.slice(-window).map((r) => r[key]).filter((v) => v != null) as number[];
  if (hist.length < 20) return null;
  const m = mean(hist)!, s = sd(hist);
  if (!s) return null;
  return Math.round(((value - m) / s) * 100) / 100;
}

/** Longest run of consecutive days satisfying a predicate, ending at the last row. */
export function currentStreak(rows: Row[], pred: (r: Row) => boolean) {
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (pred(rows[i])) n++;
    else break;
  }
  return n;
}

/** Consistency of a daily clock-time value (minutes past midnight), handling wrap. */
export function circularSd(minutes: number[]) {
  if (minutes.length < 3) return null;
  const rad = minutes.map((m) => (m / 1440) * 2 * Math.PI);
  const s = mean(rad.map(Math.sin))!, c = mean(rad.map(Math.cos))!;
  const R = Math.sqrt(s * s + c * c);
  if (R >= 1) return 0;
  return Math.round(Math.sqrt(-2 * Math.log(R)) * (1440 / (2 * Math.PI)));
}
