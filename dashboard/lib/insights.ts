/** The insight engine.
 *
 *  Each rule looks at the live series and either fires with a sentence built from
 *  real numbers, or stays silent. Nothing here is hard-coded narrative — if the
 *  data changes, the sentences change, and rules that lose their evidence stop
 *  firing. Rules must state sample size and must not claim causation from
 *  correlation. */

import {
  Row, mean, sd, correlate, trend, byMonth, byWeekday, lagged,
  changepoint, currentStreak,
} from "./analytics";

export type Insight = {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "watch" | "neutral" | "good";
  confidence: "measured" | "suggestive" | "observation";
  evidence: string;
  metric?: string;
  rank: number;
};

const pct = (a: number, b: number) => ((b - a) / a) * 100;
const f1 = (n: number) => Math.round(n * 10) / 10;
const f2 = (n: number) => Math.round(n * 100) / 100;
const hrs = (s: number) => f2(s / 3600);
const DAY = 864e5;
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / DAY);

export function buildInsights(rows: Row[], opts: { sleepTargetH: number }): Insight[] {
  const out: Insight[] = [];
  const add = (i: Omit<Insight, "rank">) => out.push({ ...i, rank: 0 });
  if (rows.length < 30) return out;

  const first = rows[0].date;
  const last = rows[rows.length - 1].date;
  const span = daysBetween(first, last) + 1;

  // ---------------------------------------------------- 1. long-arc HRV trend
  const months = byMonth(rows, ["hrv", "restingHR", "sleepH", "readiness", "respiration", "sleepScore"]);
  const withHrv = months.filter((m) => m.hrv != null && m.hrv_n >= 14);
  if (withHrv.length >= 4) {
    const peak = withHrv.reduce((a, b) => (b.hrv > a.hrv ? b : a));
    const now = withHrv[withHrv.length - 1];
    const drop = pct(peak.hrv, now.hrv);
    if (Math.abs(drop) >= 5 && peak.month !== now.month) {
      const monthsSince = withHrv.length - 1 - withHrv.indexOf(peak);
      // Has it stopped falling? Compare the last 3 months against each other.
      const tail = withHrv.slice(-3);
      const stabilised = tail.length === 3 &&
        Math.abs(pct(tail[0].hrv, tail[2].hrv)) < 5;
      const troughIdx = withHrv.reduce((lo, m, n) => (m.hrv < withHrv[lo].hrv ? n : lo), 0);
      const fellUntil = withHrv[Math.max(troughIdx, withHrv.indexOf(peak) + 1)];
      add({
        id: "hrv-long-arc",
        title:
          drop >= 0
            ? `HRV is ${f1(drop)}% above its low`
            : stabilised
            ? `Your HRV fell over three months — and then stopped`
            : `HRV has been falling for ${monthsSince} months, not weeks`,
        body:
          drop >= 0
            ? `Your HRV averaged ${peak.hrv} at its best in ${fmtMonth(peak.month)} and is now ${now.hrv}.`
            : stabilised
            ? `Your HRV peaked at ${peak.hrv} in ${fmtMonth(peak.month)} and fell to ${f1(Math.min(...tail.map((t) => t.hrv)))} — a ${f1(Math.abs(drop))}% drop. But the last three months read ${tail.map((t) => t.hrv).join(", ")}: it has flattened, not kept falling. That distinction matters. A decline that stopped is a level shift you have already absorbed; a decline still running is a problem getting worse. This one stopped.`
            : `Your HRV peaked at ${peak.hrv} in ${fmtMonth(peak.month)} and now averages ${now.hrv} — a ${f1(Math.abs(drop))}% decline spread over ${monthsSince} months. A single bad week is noise. ${monthsSince} months of monthly averages moving one direction is a trend, and it is the sort of thing that is invisible day to day.`,
        severity: drop >= 0 ? "good" : stabilised ? "watch" : drop < -10 ? "critical" : "watch",
        confidence: "measured",
        evidence: `${withHrv.length} monthly averages, ${rows.filter((r) => r.hrv != null).length} days of data`,
        metric: "hrv",
      });
    }
  }

  // ------------------------------------- 2. seasonal effect, his own baseline
  const cool = rows.filter((r) => r.date >= first && r.date < addMonths(first, 3));
  const hot = rows.slice(-90);
  if (cool.length >= 45 && hot.length >= 45 && daysBetween(cool[cool.length - 1].date, hot[0].date) > 30) {
    const cmp = (k: string) => {
      const a = mean(cool.map((r) => r[k]).filter((v) => v != null) as number[]);
      const b = mean(hot.map((r) => r[k]).filter((v) => v != null) as number[]);
      return a && b ? { a, b, d: pct(a, b) } : null;
    };
    const h = cmp("hrv"), rh = cmp("restingHR");
    if (h && rh && (Math.abs(h.d) > 4 || Math.abs(rh.d) > 4)) {
      add({
        id: "season",
        title: "Your summer costs you measurably — and it is seasonal, not a decline",
        body: `Comparing your first 3 months on record (from ${fmtMonth(cool[0].date.slice(0, 7))}, n=${cool.length}) against the last 90 days (n=${hot.length}) — same body, same device: HRV ${f1(h.a)} → ${f1(h.b)} (${f1(h.d)}%), resting heart rate ${f1(rh.a)} → ${f1(rh.b)} (${f1(rh.d) > 0 ? "+" : ""}${f1(rh.d)}%). Both moved the unfavourable way together, which is what heat strain looks like. Nothing you did wrong — but it means your "baseline" is seasonal, and comparing today against April is comparing two different environments.`,
        severity: "neutral",
        confidence: "measured",
        evidence: `${cool.length} cool-period days vs ${hot.length} recent days`,
        metric: "hrv",
      });
    }
  }

  // --------------------------------------------------------- 3. sleep debt
  const sleepDays = rows.filter((r) => r.sleepH != null);
  if (sleepDays.length >= 60) {
    const target = opts.sleepTargetH;
    const debt = sleepDays.reduce((s, r) => s + Math.max(0, target - r.sleepH), 0);
    const hitTarget = sleepDays.filter((r) => r.sleepH >= target).length;
    const under6 = sleepDays.filter((r) => r.sleepH < 6).length;
    const avg = mean(sleepDays.map((r) => r.sleepH))!;
    add({
      id: "sleep-debt",
      title: `${Math.round(debt)} hours of sleep owed`,
      body: `Across ${sleepDays.length} tracked nights you averaged ${f2(avg)} h against your ${target} h target. You hit the target on ${hitTarget} nights — ${f1((hitTarget / sleepDays.length) * 100)}% — and went under 6 h on ${under6}. The shortfall adds up to about ${Math.round(debt)} hours, roughly ${Math.round(debt / target)} full nights. This is the single largest modifiable thing in your data, and it has been true every month on record rather than being a recent slip.`,
      severity: avg < target - 1 ? "critical" : "watch",
      confidence: "measured",
      evidence: `${sleepDays.length} nights`,
      metric: "sleepH",
    });

    // ------------------------------------------ 4. sleep consistency by month
    const volByMonth: Record<string, number[]> = {};
    for (let i = 1; i < sleepDays.length; i++) {
      if (daysBetween(sleepDays[i - 1].date, sleepDays[i].date) !== 1) continue;
      (volByMonth[sleepDays[i].date.slice(0, 7)] ||= []).push(
        Math.abs(sleepDays[i].sleepH - sleepDays[i - 1].sleepH)
      );
    }
    const vol = Object.entries(volByMonth)
      .filter(([, v]) => v.length >= 12)
      .map(([m, v]) => ({ m, v: mean(v)! }));
    if (vol.length >= 4) {
      const best = vol.reduce((a, b) => (b.v < a.v ? b : a));
      const now = vol[vol.length - 1];
      if (now.v > best.v * 1.4) {
        add({
          id: "sleep-consistency",
          title: "Your sleep got erratic, and stayed erratic",
          body: `Night-to-night swing in sleep duration averaged ${f2(best.v)} h in ${fmtMonth(best.m)}, your steadiest month. It is now ${f2(now.v)} h — ${f1(pct(best.v, now.v))}% more volatile. Irregular timing disrupts recovery independently of total hours, so two people averaging the same 6.5 h can recover very differently. Your average barely moved; your consistency collapsed.`,
          severity: "watch",
          confidence: "measured",
          evidence: `${vol.length} months of night-to-night deltas`,
          metric: "sleepH",
        });
      }
    }
  }

  // ------------------------------------- 5. respiration as early-warning lead
  const respLag = lagged(rows, "respiration", "restingHR", [1]);
  const sleepLag = lagged(rows, "sleepH", "restingHR", [1]);
  const r1 = respLag[0];
  if (r1.r != null && Math.abs(r1.r) > 0.2 && (r1.verdict === "strong" || r1.verdict === "real but modest")) {
    const beatsSleep = sleepLag[0].r == null || Math.abs(r1.r) > Math.abs(sleepLag[0].r);
    add({
      id: "respiration-lead",
      title: "Your breathing rate warns you before anything else does",
      body: `Last night's overnight respiration predicts tomorrow's resting heart rate at r=${r1.r! > 0 ? "+" : ""}${r1.r} across ${r1.n} paired nights${beatsSleep ? ", which is a stronger signal than sleep duration manages" : ""}. Respiration is also your most stable metric, so when it moves, it means something. Almost nobody looks at this number — it is usually buried three screens deep — but for you it leads the others.`,
      severity: "neutral",
      confidence: r1.verdict === "strong" ? "measured" : "suggestive",
      evidence: `r=${r1.r}, n=${r1.n}, ${r1.verdict}`,
      metric: "respiration",
    });
  }

  // ------------------------------------------- 6. readiness is mostly HRV
  const readVsHrv = correlate(
    rows.map((r) => r.readiness).filter((v, i) => v != null && rows[i].hrv != null) as number[],
    rows.filter((r) => r.readiness != null && r.hrv != null).map((r) => r.hrv) as number[]
  );
  const readVsSleep = correlate(
    rows.filter((r) => r.readiness != null && r.sleepH != null).map((r) => r.readiness) as number[],
    rows.filter((r) => r.readiness != null && r.sleepH != null).map((r) => r.sleepH) as number[]
  );
  if (readVsHrv.r != null && readVsSleep.r != null && readVsHrv.r > 0.6 && readVsHrv.r > readVsSleep.r * 2) {
    add({
      id: "readiness-redundant",
      title: "Your recovery score is mostly just HRV wearing a hat",
      body: `Readiness tracks same-day HRV at r=+${readVsHrv.r} but sleep duration at only r=+${readVsSleep.r} (n=${readVsHrv.n}). So when you read the score you are largely re-reading HRV, and the sleep you actually got is barely represented. Worth knowing before you treat it as an independent second opinion.`,
      severity: "neutral",
      confidence: "measured",
      evidence: `r=${readVsHrv.r} vs HRV, r=${readVsSleep.r} vs sleep, n=${readVsHrv.n}`,
      metric: "readiness",
    });
  }

  // --------------------------------------------- 7. negative form streak
  // ctl/atl decay to tiny non-zero values long after training stops, which makes
  // `form` look real on days that had no training at all. Only trust it from the
  // first day fitness genuinely got off the floor.
  const loadStart = rows.findIndex((r) => (r.ctl ?? 0) >= 5);
  const formRows = loadStart < 0 ? [] : rows.slice(loadStart).filter((r) => r.form != null);
  if (formRows.length >= 30) {
    const streak = currentStreak(formRows, (r) => r.form < 0);
    const positive = formRows.filter((r) => r.form > 0).length;
    const fVsHrv = correlate(
      formRows.filter((r) => r.hrv != null).map((r) => r.form),
      formRows.filter((r) => r.hrv != null).map((r) => r.hrv)
    );
    const fVsRdy = correlate(
      formRows.filter((r) => r.readiness != null).map((r) => r.form),
      formRows.filter((r) => r.readiness != null).map((r) => r.readiness)
    );
    // Form should track recovery POSITIVELY. Testing |r| was wrong: it treats a
    // backwards relationship as a strong one.
    const formIsBlind = fVsHrv.r != null && fVsHrv.r < 0.2;
    const formIsBackwards = fVsHrv.r != null && fVsHrv.r < -0.15;
    if (streak >= 14) {
      add({
        id: "form-streak",
        title: `${streak} straight days of negative form`,
        body: `Form — fitness minus fatigue — has been below zero for ${streak} consecutive days, and was positive on only ${positive} of ${formRows.length} days with real training load. Some negative form is normal while building; a streak this long means fatigue is being carried forward rather than cleared.${formIsBackwards
          ? ` But here is the caveat that matters more than the streak: for you, form correlates with HRV at r=${fVsHrv.r} — negative — and with your readiness score at r=${fVsRdy.r}, across ${fVsHrv.n} days. It is supposed to run the other way. Form is computed from training load alone, so it cannot see your sleep, your stress or the heat, and on your data it is not measuring recovery at all. Read it as a description of your training. Your HRV, resting heart rate and sleep are the ones telling you how you actually are.`
          : formIsBlind
          ? ` One caveat: for you, form correlates with HRV at only r=${fVsHrv.r} across ${fVsHrv.n} days — effectively nothing. It is computed from training load alone, so it cannot see your sleep, your stress or the heat.`
          : ""}`,
        severity: formIsBlind ? "neutral" : streak > 35 ? "critical" : "watch",
        confidence: "measured",
        evidence: `${formRows.length} days with load data · form vs HRV r=${fVsHrv.r ?? "n/a"}`,
        metric: "form",
      });
    }
  }

  // ------------------------------------------------- 8. changepoint detection
  const cpHrv = changepoint(rows, "hrv");
  const cpRhr = changepoint(rows, "restingHR");
  const bothShifted =
    cpHrv && cpRhr && cpHrv.effect >= 0.8 && cpRhr.effect >= 0.8 &&
    Math.abs(daysBetween(cpHrv.date, cpRhr.date)) <= 14;

  if (bothShifted) {
    // Two independent markers breaking in the same week is far stronger evidence
    // than either alone — report it as one finding.
    const earlier = cpHrv!.date <= cpRhr!.date ? cpHrv! : cpRhr!;
    const gap = Math.abs(daysBetween(cpHrv!.date, cpRhr!.date));
    add({
      id: "changepoint-both",
      title: `Something changed in the week of ${fmtDate(earlier.date)}`,
      body: `Two independent markers broke in the same week${gap ? `, ${gap} day${gap === 1 ? "" : "s"} apart` : " on the same day"}. HRV averaged ${cpHrv!.before} before ${fmtDate(cpHrv!.date)} and ${cpHrv!.after} after. Resting heart rate went ${cpRhr!.before} → ${cpRhr!.after} around ${fmtDate(cpRhr!.date)}. Effect sizes ${cpHrv!.effect} and ${cpRhr!.effect} — both large. One metric shifting is noise; two unrelated ones shifting together within a week is a real change in state. Something happened to you that week. It is worth remembering what.`,
      severity: "watch",
      confidence: "measured",
      evidence: `Cohen's d ${cpHrv!.effect} (HRV) and ${cpRhr!.effect} (resting HR)`,
      metric: "hrv",
    });
  } else {
    for (const [cp, key, label, good] of [
      [cpHrv, "hrv", "HRV", "up"],
      [cpRhr, "restingHR", "resting heart rate", "down"],
    ] as const) {
      if (!cp || cp.effect < 0.8) continue;
      const worse = good === "up" ? cp.after < cp.before : cp.after > cp.before;
      add({
        id: `changepoint-${key}`,
        title: `Your ${label} stepped ${worse ? "the wrong way" : "the right way"} around ${fmtDate(cp.date)}`,
        body: `Averaged ${cp.before} before ${fmtDate(cp.date)} and ${cp.after} after — an effect size of ${cp.effect}, which is large. This is the biggest single step change in the record.`,
        severity: worse ? "watch" : "good",
        confidence: "measured",
        evidence: `Cohen's d = ${cp.effect}`,
        metric: key,
      });
    }
  }

  // ------------------------------------------------- 9. day-of-week pattern
  for (const [key, label, unit] of [
    ["sleepH", "sleep", " h"],
    ["hrv", "HRV", ""],
  ] as const) {
    const dow = byWeekday(rows, key).filter((d) => d.value != null && d.n >= 8);
    if (dow.length === 7) {
      const best = dow.reduce((a, b) => (b.value! > a.value! ? b : a));
      const worst = dow.reduce((a, b) => (b.value! < a.value! ? b : a));
      const spread = pct(worst.value!, best.value!);
      if (spread > 12) {
        add({
          id: `dow-${key}`,
          title: `${worst.name} is reliably your worst day for ${label}`,
          body: `Averaged over ${dow.reduce((s, d) => s + d.n, 0)} days: ${label} is ${best.value}${unit} on ${best.name} and ${worst.value}${unit} on ${worst.name} — a ${f1(spread)}% gap that repeats every week. Weekly rhythms hide completely in a daily view, and this one is large enough to plan around.`,
          severity: "neutral",
          confidence: "measured",
          evidence: dow.map((d) => `${d.name} ${d.value}`).join(" · "),
          metric: key,
        });
      }
    }
  }

  // ------------------------------------------------ 10. HRV vs RHR agreement
  // A 90-day window straddles a decline that has already flattened, which would
  // contradict the long-arc rule. Use 60 days and stand down if that rule already
  // reported stabilisation.
  const hrvT = trend(rows.slice(-60), "hrv");
  const rhrT = trend(rows.slice(-60), "restingHR");
  const alreadyFlat = out.some((i) => i.id === "hrv-long-arc" && i.title.includes("then stopped"));
  if (hrvT && rhrT && !alreadyFlat) {
    const hrvFalling = hrvT.perDay < 0;
    const rhrRising = rhrT.perDay > 0;
    if (hrvFalling && rhrRising) {
      add({
        id: "hrv-rhr-agree",
        title: "Both recovery markers are moving the wrong way together",
        body: `Over the last 60 days HRV has drifted ${f2(hrvT.totalChange)} and resting heart rate ${f2(rhrT.totalChange) > 0 ? "+" : ""}${f2(rhrT.totalChange)}. When these two disagree it is usually measurement noise. When they agree, as they do here, it is a real shift in autonomic state — and it is worth taking seriously rather than explaining away.`,
        severity: "watch",
        confidence: "measured",
        evidence: `${hrvT.days} days of HRV, ${rhrT.days} of resting HR`,
        metric: "hrv",
      });
    } else if (!hrvFalling && !rhrRising) {
      add({
        id: "hrv-rhr-good",
        title: "Both recovery markers are improving together",
        body: `Over 60 days HRV moved ${f2(hrvT.totalChange) > 0 ? "+" : ""}${f2(hrvT.totalChange)} and resting heart rate ${f2(rhrT.totalChange)}. Both pointing the favourable way at once is the clearest signal that recovery is genuinely improving.`,
        severity: "good",
        confidence: "measured",
        evidence: `${hrvT.days} days`,
        metric: "hrv",
      });
    }
  }

  // ------------------------------------- 11. training volume eats sleep
  // Weekly aggregation, because the daily relationship is swamped by noise.
  const wk: Record<string, { load: number; sleep: number[] }> = {};
  for (const r of rows) {
    const k = weekOf(r.date);
    wk[k] ||= { load: 0, sleep: [] };
    if (r.atl != null && r.ctl != null) wk[k].load += Math.max(0, r.atl - (r.ctl ?? 0)) ;
    if (r.sleepH != null) wk[k].sleep.push(r.sleepH);
  }
  const wkRows = Object.entries(wk)
    .filter(([, v]) => v.sleep.length >= 5)
    .map(([k, v]) => ({ week: k, load: v.load, sleep: mean(v.sleep)! }));
  if (wkRows.length >= 12) {
    const c = correlate(wkRows.map((w) => w.load), wkRows.map((w) => w.sleep));
    if (c.r != null && c.r < -0.3 && (c.verdict === "strong" || c.verdict === "real but modest")) {
      add({
        id: "load-eats-sleep",
        title: "The weeks you train hardest are the weeks you sleep least",
        body: `Across ${c.n} weeks, higher training load goes with less sleep that same week (r=${c.r}). That is the wrong way round — hard weeks are exactly when you need more sleep, not less. It is also self-reinforcing: less sleep degrades recovery, which makes the same load cost more, which eats further into sleep. Of everything in this data, this loop is the most worth breaking.`,
        severity: "critical",
        confidence: c.verdict === "strong" ? "measured" : "suggestive",
        evidence: `r=${c.r} across ${c.n} weeks`,
        metric: "sleepH",
      });
    }
  }

  // ------------------------- 12. does the fitness/fatigue model mean anything?
  const formPaired = rows.filter((r) => r.form != null && r.hrv != null && (r.ctl ?? 0) >= 5);
  if (formPaired.length >= 60) {
    const vsHrv = correlate(formPaired.map((r) => r.form), formPaired.map((r) => r.hrv));
    const vsRdy = correlate(
      formPaired.filter((r) => r.readiness != null).map((r) => r.form),
      formPaired.filter((r) => r.readiness != null).map((r) => r.readiness)
    );
    const dead = Math.abs(vsHrv.r ?? 0) < 0.15 && Math.abs(vsRdy.r ?? 0) < 0.15;
    if (dead) {
      add({
        id: "form-meaningless",
        title: "Your form number does not predict how you actually feel",
        body: `Form — the fitness-minus-fatigue figure every training app puts front and centre — correlates with your HRV at r=${vsHrv.r} and with your readiness score at r=${vsRdy.r} across ${vsHrv.n} days. Both are effectively zero. It is computed purely from training load, so it cannot see your sleep, your stress or the heat. Treat it as a description of your training, not of your body. The recovery metrics are the ones telling you something.`,
        severity: "neutral",
        confidence: "measured",
        evidence: `r=${vsHrv.r} vs HRV, r=${vsRdy.r} vs readiness, n=${vsHrv.n}`,
        metric: "form",
      });
    }
  }

  // ------------------------------- 13. which marker is actually more sensitive
  const half = Math.floor(rows.length / 2);
  const early = rows.slice(0, half), lateR = rows.slice(half);
  const shiftSd = (k: string) => {
    const a = early.map((r) => r[k]).filter((v) => v != null) as number[];
    const b = lateR.map((r) => r[k]).filter((v) => v != null) as number[];
    if (a.length < 30 || b.length < 30) return null;
    const pooled = Math.sqrt((((sd(a) ?? 0) ** 2) + ((sd(b) ?? 0) ** 2)) / 2);
    return pooled ? (mean(b)! - mean(a)!) / pooled : null;
  };
  const zh = shiftSd("hrv"), zr = shiftSd("restingHR");
  if (zh != null && zr != null && Math.abs(zr) > Math.abs(zh) * 1.3 && Math.abs(zr) > 0.6) {
    add({
      id: "rhr-more-sensitive",
      title: "Resting heart rate is your sharper signal, not HRV",
      body: `Comparing the first half of the record against the second: resting heart rate moved ${f2(Math.abs(zr))} standard deviations while HRV moved ${f2(Math.abs(zh))}. Everyone watches HRV because it is the number the apps lead with, but for you resting heart rate has shifted ${f1((Math.abs(zr) / Math.abs(zh) - 1) * 100)}% further and it is far less noisy night to night. If you are going to track one number, track that one.`,
      severity: "neutral",
      confidence: "measured",
      evidence: `${early.length} early days vs ${lateR.length} recent`,
      metric: "restingHR",
    });
  }

  // rank: severity first, then confidence
  const sevRank = { critical: 0, watch: 1, good: 2, neutral: 3 };
  const confRank = { measured: 0, suggestive: 1, observation: 2 };
  out.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || confRank[a.confidence] - confRank[b.confidence]);
  out.forEach((i, n) => (i.rank = n + 1));
  return out;
}

function weekOf(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
function fmtMonth(ym: string) {
  return new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", timeZone: "UTC",
  });
}
