"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import {
  SPORT_VAR, METRIC_VAR, METRIC_LABEL, METRIC_INVERT, f1, f2, hm, pace, shortDate,
  Tip, Legend, Card, Explain, StatGrid, MetricTile, Spark, MonthlyChart, TrendLine,
  ScatterPlot, BarsChart, WeekdayChart, CorrBar, InsightTile, Sheet,
  MarkerChip, TargetBand, Badges, SessionRow, Headline, RaceBar,
} from "./ui";

const TABS = ["Today", "Critical Markers", "Recovery", "Sleep", "Training"] as const;

const CATEGORIES = [
  { key: "heart", label: "Heart", blurb: "HRV higher is better · resting HR lower is better" },
  { key: "sleep", label: "Sleep", blurb: "Duration and consistency both matter" },
  { key: "activity", label: "Activity", blurb: "Measured against your own trailing weeks, not a plan" },
  { key: "fitness", label: "Fitness", blurb: "Fitness is training load carried forward — not how you feel" },
] as const;

/** Plain-language meaning for each readiness driver, keyed by metric. */
const DRIVER_MEANING: Record<string, string> = {
  hrv: "Your readiness score is mostly this. They are one signal, not two.",
  restingHR: "A real second input — it moves your score independently of HRV.",
  sleepScore: "Whoop's own sleep grade nudges the score a little.",
  sleepH: "Sleep LENGTH barely moves your readiness score. How you slept counts more than how long.",
  respiration: "Almost no direct effect on the score — but it leads your resting HR by a day.",
};
type Tab = (typeof TABS)[number];

type View =
  | { kind: "insight"; i: any }
  | { kind: "metric"; key: string }
  | { kind: "session"; a: any }
  | null;

/** The one-line "what does this actually mean" under each metric chart. */
function DeduceLine({ d, metric }: any) {
  const g = (d.metricGuide || []).find((x: any) => x.metric === metric);
  if (!g) return null;
  return (
    <p className="deduce">
      <b>{g.better === "higher" ? "↑ higher is better." : "↓ lower is better."}</b> {g.deduce}
    </p>
  );
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("Today");
  const [cat, setCat] = useState<string | null>(null);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<View>(null);

  useEffect(() => {
    fetch("/api/data").then((r) => r.json())
      .then((x) => (x.error ? setErr(x.error) : setD(x)))
      .catch((e) => setErr(String(e)));
  }, []);

  const recent = useMemo(() => (d?.daily || []).slice(-60), [d]);

  if (err) return (
    <div className="wrap"><div className="err">
      <strong>Could not load your data.</strong><div style={{ marginTop: 6 }}>{err}</div>
      <div style={{ marginTop: 10, color: "var(--text-muted)" }}>
        If this says the key is missing, set <code>INTERVALS_API_KEY</code> on the Vercel project.
      </div></div></div>
  );
  if (!d) return <div className="wrap"><div className="skeleton">Reading {`>`}7 months of your data…</div></div>;

  const b = d.baseline;
  const insights = d.insights || [];
  const crit = insights.filter((i: any) => i.severity === "critical").length;
  const openMetric = (key: string) => setView({ kind: "metric", key });

  /* ------------------------------------------------------------ metric sheet */
  const metricSheet = (key: string) => {
    const label = METRIC_LABEL[key] || key;
    const color = METRIC_VAR[key] || "var(--swim)";
    const invert = !!METRIC_INVERT[key];
    const base = b[key];
    const t = d.trends?.[key];
    const wd = d.weekdays?.[key];
    const roll = d.rollups?.[key];
    const driver = (d.drivers || []).find((x: any) => x.metric === key);
    const stats = [
      { k: "Today", v: base?.today != null ? `${f2(base.today)}` : "not synced" },
      { k: "Typical (60d)", v: base?.mean != null ? `${f2(base.mean)}` : "—" },
      { k: "Against typical", v: base?.z != null ? `${base.z > 0 ? "+" : ""}${base.z} SD` : "—" },
      ...(t?.last90 ? [{ k: "Last 90 days", v: `${t.last90.change > 0 ? "+" : ""}${t.last90.change}` }] : []),
      ...(t?.all ? [{ k: "Whole record", v: `${t.all.change > 0 ? "+" : ""}${t.all.change}` }] : []),
      ...(driver?.r != null ? [{ k: "Drives readiness", v: `r=${driver.r > 0 ? "+" : ""}${driver.r}` }] : []),
    ];
    return (
      <>
        <StatGrid stats={stats} />
        <h4 className="sheeth">By month</h4>
        <MonthlyChart data={d.monthly} dataKey={key} color={color} invert={invert} />
        {!!roll?.length && (<>
          <h4 className="sheeth">Rolling 28-day trend</h4>
          <TrendLine height={200} series={[{ name: label, color, data: roll }]} />
        </>)}
        {!!wd?.length && (<>
          <h4 className="sheeth">By day of week</h4>
          <WeekdayChart data={wd} color={color} />
        </>)}
        <h4 className="sheeth">Related findings</h4>
        <div className="minitiles">
          {insights.filter((i: any) => i.metric === key).map((i: any) => (
            <button className="minitile" key={i.id} onClick={() => setView({ kind: "insight", i })}>
              <b>{i.headline.value}{i.headline.unit}</b><span>{i.claim}</span><span className="chev">→</span>
            </button>
          ))}
          {!insights.some((i: any) => i.metric === key) && <div className="empty">Nothing firing on this metric.</div>}
        </div>
      </>
    );
  };

  /* ----------------------------------------------------------- insight sheet */
  const insightChart = (i: any) => {
    const c = i.chart;
    if (!c) return null;
    if (c.kind === "monthly")
      return <MonthlyChart data={d.monthly} dataKey={c.key} color={METRIC_VAR[c.key] || "var(--swim)"}
        invert={c.invert} unit={c.unit || ""} />;
    if (c.kind === "rolling")
      return <TrendLine height={220} mark={c.mark} unit={c.unit || ""}
        series={c.keys.filter((k: string) => d.rollups?.[k]?.length)
          .map((k: string) => ({ name: METRIC_LABEL[k] || k, color: METRIC_VAR[k], data: d.rollups[k] }))} />;
    if (c.kind === "weekday")
      return d.weekdays?.[c.key] ? <WeekdayChart data={d.weekdays[c.key]} color={METRIC_VAR[c.key]} unit={c.unit || ""} /> : null;
    if (c.kind === "dist")
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={d.sleep.distribution} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="band" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip content={<Tip suffix=" nights" />} cursor={{ fill: "var(--surface-2)" }} />
            <ReferenceLine x={`${d.sleep.targetH}+`} stroke="var(--good)" strokeDasharray="4 4" />
            <Bar dataKey="n" name="nights" fill="var(--strength)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    if (c.kind === "scatter")
      return <ScatterPlot points={c.points} xLabel={c.xLabel} yLabel={c.yLabel} />;
    if (c.kind === "bars")
      return <BarsChart points={c.points} unit={c.unit || ""} />;
    return null;
  };

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Health Intelligence</h1>
          <div className="sub">
            {d.record.measuredDays ?? d.record.days} days measured · {shortDate(d.record.start)} – {shortDate(d.record.end)}
            {d.athleteCity ? ` · ${d.athleteCity}` : ""}
          </div>
        </div>
        <div className="toprt">
          {crit > 0 && (
            <button className="pill red" onClick={() => setTab("Critical Markers")}>
              <span className="dot" />{crit} need{crit === 1 ? "s" : ""} attention
            </button>
          )}
          <span className="sub">{d.race.daysToRace}d to {d.race.name}</span>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      {/* =============================================================== TODAY */}
      {tab === "Today" && (
        <>
          {d.latestIsStale && (
            <div className="stale">
              <b>Last night has not synced yet.</b> Showing {shortDate(d.latestDate)}, your most
              recent complete day. Today's row carries a daytime heart-rate sample and no overnight
              data, so it is not a reading.
            </div>
          )}
          <div className="metrics wide">
            {[["hrv", "HRV"], ["restingHR", "Resting HR"], ["sleepH", "Sleep"],
              ["readiness", "Readiness"], ["respiration", "Breathing"], ["spO2", "Blood oxygen"]]
              .map(([k, lab]) => (
                <MetricTile key={k} label={lab} value={k === "sleepH" ? f2(b[k]?.today) : f1(b[k]?.today)}
                  unit={k === "sleepH" ? " h" : k === "spO2" ? "%" : ""} base={b[k]}
                  invert={!!METRIC_INVERT[k]} onClick={() => openMetric(k)} />
              ))}
          </div>

          <h3 className="secth">Where you stand</h3>
          <div className="chips">
            {(d.markers || []).map((m: any) => (
              <MarkerChip key={m.key} m={m}
                onClick={() => { setCat(m.key); setTab("Critical Markers"); }} />
            ))}
          </div>

          <div className="grid two">
            <Card title="Coming up">
              <div className="list">
                {(d.upcoming || []).slice(0, 6).map((s: any, i: number) => (
                  <div className="item" key={i}>
                    <span className="when">{shortDate(s.date)} {s.time}</span>
                    <span className="what"><i className="sdot" style={{ background: SPORT_VAR[s.sport] }} />{s.name}</span>
                    <span className="dur">{hm(s.minutes)}</span>
                  </div>
                ))}
                {!d.upcoming?.length && <div className="empty">Nothing scheduled.</div>}
              </div>
            </Card>

            <Card title="Recent sessions" sub="tap one for detail">
              <div className="srows">
                {(d.activities || []).slice(0, 6).map((a: any, i: number) => (
                  <SessionRow key={i} a={a} onClick={() => setView({ kind: "session", a })} />
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ FINDINGS */}
      {tab === "Critical Markers" && (
        <>
          <p className="lede">
            {insights.length} markers across four areas, recomputed live. Tap any one for the numbers behind it.
          </p>
          {CATEGORIES.map((c) => {
            const mine = insights.filter((i: any) => i.category === c.key);
            const m = (d.markers || []).find((x: any) => x.key === c.key);
            const status = mine.filter((i: any) => !i.meta);
            const meta = mine.filter((i: any) => i.meta);
            const dim = cat && cat !== c.key;
            return (
              <section className={`catsec${dim ? " dim" : ""}`} key={c.key} id={`cat-${c.key}`}>
                <header className={`cathead ${m?.status || "unknown"}`}>
                  <div>
                    <h2><span className="sev" />{c.label}
                      <span className="catstatus">{m ? m.line : ""}</span>
                    </h2>
                    <div className="catblurb">{c.blurb}</div>
                  </div>
                  <div className="cathero">{m?.hero}<span>{m?.heroUnit}</span></div>
                </header>
                {status.length ? (
                  <div className="tiles">
                    {status.map((i: any) => (
                      <InsightTile key={i.id} i={i} onClick={() => setView({ kind: "insight", i })} />
                    ))}
                  </div>
                ) : (
                  <div className="empty">Nothing firing here — the status above is computed from the data directly.</div>
                )}
                {!!meta.length && (
                  <Explain label={`How to read your own ${c.label.toLowerCase()} numbers (${meta.length})`}>
                    <div className="tiles">
                      {meta.map((i: any) => (
                        <InsightTile key={i.id} i={i} onClick={() => setView({ kind: "insight", i })} />
                      ))}
                    </div>
                  </Explain>
                )}
              </section>
            );
          })}
          {!!d.quality?.length && (
            <Card title="What this dashboard cannot tell you" wide>
              <Explain label={`${d.quality.length} known gaps`}>
                <ul className="gaps">{d.quality.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul>
                <p>A missing metric shown as zero is worse than one shown as missing.</p>
              </Explain>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ RECOVERY */}
      {tab === "Recovery" && (
        <div className="grid two">
          <Card title="Where you are against where you should be" sub="tap any row" wide>
            <div className="bands">
              {(d.metricGuide || []).map((g: any) => (
                <TargetBand key={g.metric} g={g} onClick={() => openMetric(g.metric)} />
              ))}
            </div>
            <Explain label="Where these targets come from">
              <p>
                Every target is <b>your own 75th percentile over the last 60 days</b> (25th where lower
                is better) — the level you actually reach on your better days, not a population norm.
              </p>
              <p>
                Resting heart rate, breathing rate and blood oxygen also carry a general adult
                reference, shown in smaller text and marked as such. There is deliberately{" "}
                <b>no population HRV band</b>: HRV is strongly individual and age-dependent, so a
                "normal HRV" is not derivable from your data or from anything this app has.
              </p>
            </Explain>
          </Card>

          <Card title="Stress" sub="daytime, from Garmin" wide>
            {d.garminStress ? (
              <>
                <Headline
                  value={d.garminStress.latest?.avgStressLevel ?? "—"}
                  unit=" avg"
                  text={d.garminStress.scoreable
                    ? `Scored against your own ${d.garminStress.days} days of history.`
                    : `Building a baseline — ${d.garminStress.days} of ${d.garminStress.needed} days. Until there is enough of your own history to score against, this is the raw daily number rather than a score.`}
                />
                <BarsChart
                  points={d.garminStress.series.map((x: any) => ({ label: x.date.slice(5), value: x.stress }))}
                  color="var(--bike)" />
                <StatGrid stats={[
                  { k: "Days of history", v: `${d.garminStress.days} of ${d.garminStress.needed}` },
                  { k: "Range", v: `${shortDate(d.garminStress.start)} – ${shortDate(d.garminStress.end)}` },
                  { k: "Your average", v: `${d.garminStress.mean}` },
                  { k: "Shared with HRV", v: `${d.garminStress.independence.sharedWithHrv}%` },
                ]} />
                <Explain label="Why this is a separate signal and not HRV again">
                  <p>{d.garminStress.independence.note}</p>
                  <p>
                    A composite built from your Whoop fields alone shared <b>76%</b> of its variation
                    with HRV — it was HRV under another name. Everything Whoop sends is measured while
                    you sleep, so none of it can see daytime stress. This can.
                  </p>
                </Explain>
              </>
            ) : (
              <div className="notmeasured">
                <b>Not measured yet.</b> Every recovery field you currently have is recorded while you
                are asleep, so none of them can see daytime stress. Garmin's all-day stress feed can —
                it is being ingested, and this panel fills once a snapshot lands.
              </div>
            )}
          </Card>

          <Card title="What your readiness score is made of" sub="share of variation explained" wide>
            <div className="corrs">
              {d.drivers.map((x: any) => (
                <CorrBar key={x.metric} label={METRIC_LABEL[x.metric] || x.metric} r={x.r} n={x.n}
                  shared={x.shared} strength={x.strength} verdict={x.verdict}
                  meaning={DRIVER_MEANING[x.metric]} onClick={() => openMetric(x.metric)} />
              ))}
            </div>
            <Explain label="What the percentage means, and one caveat">
              <p>
                The percentage is how much of the variation in your readiness score is accounted for by
                that signal. HRV at 55% and sleep length at 6% is the whole story of this panel: the
                score is mostly one number.
              </p>
              <p className="dim">
                Caveat: Whoop computes readiness partly from HRV and resting heart rate, so the top two
                rows are partly arithmetic rather than discovery. The sleep rows are not.
              </p>
            </Explain>
          </Card>

          <Card title="How long last night follows you" sub="today's value against tomorrow's" wide>
            <div className="corrs">
              {d.leads.map((l: any) => {
                const one = l.lags.find((x: any) => x.lag === 1);
                return <CorrBar key={l.label} label={l.label} r={one?.r} n={one?.n}
                  shared={one?.shared} strength={one?.strength} verdict={one?.verdict}
                  onClick={() => openMetric(l.cause)} />;
              })}
            </div>
            <Explain>
              A row with a real percentage means that signal moves BEFORE the thing you care about, so
              it is an early warning. Rows marked "no reliable link" are the useful negative result:
              sleep length does not predict your next-day HRV at any lag across your whole record.
            </Explain>
          </Card>

          <Card title="HRV by month" sub="the long arc" wide onClick={() => openMetric("hrv")}>
            <DeduceLine d={d} metric="hrv" /><MonthlyChart data={d.monthly} dataKey="hrv" color="var(--swim)" />
          </Card>

          <Card title="Resting heart rate by month" wide onClick={() => openMetric("restingHR")}>
            <DeduceLine d={d} metric="restingHR" /><MonthlyChart data={d.monthly} dataKey="restingHR" color="var(--bike)" invert />
          </Card>

          <Card title="Rolling 28-day trend" sub="daily noise removed" wide>
            <TrendLine height={260} series={[
              { name: "HRV", color: "var(--swim)", data: d.rollups.hrv },
              { name: "Resting HR", color: "var(--bike)", data: d.rollups.restingHR },
            ]} />
            <Explain>
              These two normally move opposite each other. When they move the same way it is usually
              noise. When they diverge in the unfavourable direction together, it is real.
            </Explain>
          </Card>

          <Card title="Breathing rate by month" sub="your steadiest signal" onClick={() => openMetric("respiration")}>
            <DeduceLine d={d} metric="respiration" /><MonthlyChart data={d.monthly} dataKey="respiration" color="var(--bike)" invert />
          </Card>

          <Card title="Blood oxygen by month" onClick={() => openMetric("spO2")}>
            <DeduceLine d={d} metric="spO2" /><MonthlyChart data={d.monthly} dataKey="spO2" color="var(--run)" unit="%" domain={[92, 98]} />
          </Card>

          <Card title="HRV by day of week">
            <WeekdayChart data={d.weekdays.hrv} color="var(--swim)" />
          </Card>
          <Card title="Readiness by day of week">
            <WeekdayChart data={d.weekdays.readiness} color="var(--run)" />
          </Card>
        </div>
      )}

      {/* =============================================================== SLEEP */}
      {tab === "Sleep" && (
        <div className="grid two">
          <Card title="Where your sleep sits" wide>
            {(() => {
              const g = (d.metricGuide || []).find((x: any) => x.metric === "sleepH");
              return g ? <TargetBand g={g} /> : null;
            })()}
            <Explain label="Two numbers, deliberately">
              <p>
                The target on this bar is <b>your own good nights</b> — the level you actually reach
                about a quarter of the time. Your stated goal is {d.sleep.targetH} h, which you have
                hit on {d.sleep.hitTarget} of {d.sleep.nights} nights.
              </p>
              <p>
                A status that reads red every single day is one you stop seeing, so the marker is
                coloured against the reachable number and the goal stays visible beside it.
              </p>
            </Explain>
          </Card>

          <Card title="The debt" wide>
            <div className="metrics">
              <MetricTile label="Owed" value={d.sleep.debtH} unit=" h" hint={`vs ${d.sleep.targetH} h target`} />
              <MetricTile label="Average" value={f2(d.sleep.meanH)} unit=" h" base={b.sleepH}
                onClick={() => openMetric("sleepH")} />
              <MetricTile label="Nights on target" value={d.sleep.hitTarget}
                hint={`of ${d.sleep.nights} (${f1((d.sleep.hitTarget / d.sleep.nights) * 100)}%)`} />
              <MetricTile label="Nights under 6 h" value={d.sleep.under6}
                hint={d.sleep.under5 ? `${d.sleep.under5} under 5 h` : undefined} />
            </div>
          </Card>

          <Card title="How your nights distribute" wide>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.sleep.distribution} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="band" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={<Tip suffix=" nights" />} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="n" name="nights" fill="var(--strength)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Explain>
              The shape matters more than the average. A pile at 6–7 h with a thin tail above the target
              means the target is not being missed narrowly — it is rarely being aimed at.
            </Explain>
          </Card>

          <Card title="Sleep by month" wide onClick={() => openMetric("sleepH")}>
            <MonthlyChart data={d.monthly} dataKey="sleepH" color="var(--strength)" unit=" h" domain={[0, 9]} />
          </Card>

          <Card title="Rolling 28-day sleep" wide>
            <TrendLine height={220} unit=" h" refLine={d.sleep.targetH} refLabel={`${d.sleep.targetH} h target`}
              domain={[4, 9]} series={[{ name: "Sleep", color: "var(--strength)", data: d.rollups.sleepH }]} />
          </Card>

          <Card title="Sleep by day of week">
            <WeekdayChart data={d.weekdays.sleepH} color="var(--strength)" unit="h" />
          </Card>

          <Card title="Sleep score by month" onClick={() => openMetric("sleepScore")}>
            <MonthlyChart data={d.monthly} dataKey="sleepScore" color="var(--run)" />
          </Card>
        </div>
      )}

      {/* ============================================================ TRAINING */}
      {tab === "Training" && (
        <div className="grid two">
          <Card title="Race readiness" sub={`${d.race.daysToRace} days to ${d.race.name}`} wide>
            <div className="races">
              {(d.raceReadiness || []).map((r: any) => <RaceBar key={r.sport} r={r} />)}
            </div>
            <Explain label="What these mean, and what they do not">
              <p>
                Longest single session in each discipline against the Olympic race distance. The bike
                is covered. The run is the one that decides your day.
              </p>
              <p className="dim">
                Run distance here includes walk breaks — it is session distance, not continuous
                running. Continuous distance is not derivable from this API without a lap-level fetch.
              </p>
            </Explain>
          </Card>

          <Card title="Weekly training" sub="includes sessions the API hides" wide>
            {(() => {
              const m = (d.markers || []).find((x: any) => x.key === "activity");
              const ramp = (d.insights || []).find((i: any) => i.id === "activity-ramp");
              return <Headline
                value={m?.hero ?? "—"} unit={m?.heroUnit ?? ""}
                tone={ramp && ramp.severity === "watch" ? "warn" : undefined}
                text={`${m?.line ?? ""}${ramp ? ` ${ramp.claim}.` : ""}`} />;
            })()}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(d.trueWeekly || []).filter((w: any) => w.hours > 0)} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} unit=" h" />
                <Tooltip content={<Tip />} labelFormatter={shortDate} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="hours" name="Hours" fill="var(--swim)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Explain label={`Why ${d.sessionCounts?.actual} sessions but only ${d.sessionCounts?.visible} detailed`}>
              {d.sessionCounts?.actual} sessions since {shortDate(d.record.start)}, of which intervals.icu will
              only describe {d.sessionCounts?.visible} in detail — the rest came through Strava, which the API
              returns as empty stubs. These hours and loads are the complete figure. Training genuinely began
              in mid-June; everything before that is real absence, not missing data.
            </Explain>
          </Card>

          <Card title="Volume by sport" sub={`the ${d.sessionCounts?.visible} of ${d.sessionCounts?.actual} sessions with full detail`} wide>
            {d.strengthTracking?.note && (
              <div className="notmeasured small"><b>Strength is not tracked.</b> {d.strengthTracking.note}</div>
            )}
            <Legend items={[["Swim", "var(--swim)"], ["Bike", "var(--bike)"], ["Run", "var(--run)"], ["Strength", "var(--strength)"]]} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(d.weekly || []).slice(-12)} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} unit="m" />
                <Tooltip content={<Tip fmt={(v: number) => hm(v)} />} labelFormatter={shortDate} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="Swim" stackId="a" fill="var(--swim)" />
                <Bar dataKey="Bike" stackId="a" fill="var(--bike)" />
                <Bar dataKey="Run" stackId="a" fill="var(--run)" />
                <Bar dataKey="Strength" stackId="a" fill="var(--strength)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Longest run each week" wide>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(d.weekly || []).slice(-12)} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} unit=" km" domain={[0, (m: number) => Math.max(11, Math.ceil(m))]} />
                <Tooltip content={<Tip suffix=" km" />} labelFormatter={shortDate} cursor={{ fill: "var(--surface-2)" }} />
                <ReferenceLine y={10} stroke="var(--critical)" strokeDasharray="4 4"
                  label={{ value: "race distance", position: "insideTopRight", fill: "var(--text-muted)", fontSize: 11 }} />
                <Bar dataKey="longestRunKm" name="Longest run" fill="var(--run)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Explain>Session distance including walk breaks, not continuous running.</Explain>
          </Card>

          <Card title="Fitness, fatigue and form" wide onClick={() => openMetric("form")}>
            {(() => {
              const f = (d.markers || []).find((x: any) => x.key === "fitness");
              return <Headline value={f?.hero ?? "—"} unit={f?.heroUnit ?? ""} text={f?.line ?? ""} />;
            })()}
            <MonthlyChart data={d.monthly.filter((m: any) => m.ctl)} dataKey="form" color="var(--run)" />
            <Explain label="What form is, and why yours is misleading">
              <p>Form is fitness minus fatigue. Below zero means you are carrying more fatigue than fitness, which is what building looks like.</p>
              <p><b>But for you it runs backwards.</b> Form correlates <b>negatively</b> with your HRV, so it is not measuring your recovery at all. Read it as a description of your training. Your HRV, resting heart rate and sleep are what tell you how you actually are.</p>
            </Explain>
          </Card>

          <Card title="Planned against actual" sub="last 14 days" wide>
            {(() => {
              const c = d.compliance || [];
              const done = c.filter((x: any) => x.done).length;
              const shortBy = c.reduce((s: number, x: any) => s + Math.max(0, (x.plannedMin || 0) - (x.actualMin || 0)), 0);
              if (!c.length) return null;
              return <Headline value={`${done}/${c.length}`} unit=" done"
                text={`${Math.round((done / c.length) * 100)}% of planned sessions completed, ${shortBy} minutes short.`} />;
            })()}
            <table>
              <thead><tr><th>Date</th><th>Session</th><th className="num">Planned</th><th className="num">Actual</th></tr></thead>
              <tbody>
                {(d.compliance || []).length ? d.compliance.map((c: any, i: number) => (
                  <tr key={i}>
                    <td>{shortDate(c.date)}</td>
                    <td><i className="sdot" style={{ background: SPORT_VAR[c.sport] }} />{c.name}</td>
                    <td className="num">{hm(c.plannedMin)}</td>
                    <td className="num" style={{ color: c.done ? "var(--good)" : "var(--text-muted)" }}>
                      {c.actualMin != null ? hm(c.actualMin) : "missed"}
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="empty">No planned sessions in this window.</td></tr>}
              </tbody>
            </table>
          </Card>

          <Card title="Every session" sub="tap a row" wide>
            <div className="srows">
              {(d.activities || []).slice(0, 40).map((a: any, i: number) => (
                <SessionRow key={i} a={a} onClick={() => setView({ kind: "session", a })} />
              ))}
            </div>
          </Card>
        </div>
      )}

      <footer className="foot">
        Live from intervals.icu — Whoop recovery and Garmin activities.
        Recomputed {new Date(d.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.
      </footer>

      {/* =============================================================== SHEETS */}
      <Sheet open={view?.kind === "insight"} onClose={() => setView(null)}
        eyebrow={view?.kind === "insight" ? view.i.headline.caption : ""}
        title={view?.kind === "insight" ? view.i.claim : ""}>
        {view?.kind === "insight" && (
          <>
            <div className="sheethero">
              {view.i.headline.value}<span className="tunit">{view.i.headline.unit}</span>
            </div>
            {view.i.action && <p className="sheetaction">{view.i.action}</p>}
            <StatGrid stats={view.i.stats} />
            {view.i.chart && <div className="sheetchart">{insightChart(view.i)}</div>}
            <Explain>{view.i.body}</Explain>
            <Explain label="How this was computed">
              <p>{view.i.method}</p>
              <p className="dim">Evidence: {view.i.evidence} · confidence: {view.i.confidence}</p>
            </Explain>
            {view.i.metric && (
              <button className="morebtn" onClick={() => openMetric(view.i.metric)}>
                Open {METRIC_LABEL[view.i.metric] || view.i.metric} in full →
              </button>
            )}
          </>
        )}
      </Sheet>

      <Sheet open={view?.kind === "metric"} onClose={() => setView(null)} eyebrow="Metric"
        title={view?.kind === "metric" ? (METRIC_LABEL[view.key] || view.key) : ""}>
        {view?.kind === "metric" && metricSheet(view.key)}
      </Sheet>

      <Sheet open={view?.kind === "session"} onClose={() => setView(null)}
        eyebrow={view?.kind === "session" ? shortDate(view.a.date) : ""}
        title={view?.kind === "session" ? (view.a.name || view.a.sport) : ""}>
        {view?.kind === "session" && (
          <>
            <p className="sessiondesc">{view.a.describe}</p>
            <Badges items={view.a.badges} />
            <div style={{ height: 14 }} />
            <StatGrid stats={[
              { k: "Sport", v: view.a.sport },
              { k: "Duration", v: view.a.minutes ? hm(view.a.minutes) : "—" },
              { k: "Distance", v: view.a.km ? `${view.a.km} km` : "—" },
              { k: view.a.pace?.kind === "speed" ? "Speed" : "Pace",
                v: view.a.pace ? `${view.a.pace.text}${view.a.pace.unit}` : "—" },
              { k: "Average HR", v: view.a.hr != null ? `${view.a.hr} bpm` : "—" },
              { k: "Max HR", v: view.a.maxHr != null ? `${view.a.maxHr} bpm` : "—" },
              { k: "Elapsed", v: view.a.elapsed ? hm(Math.round(view.a.elapsed / 60)) : "—" },
              { k: "Training load", v: view.a.load != null ? `${view.a.load}` : "—" },
            ]} />
          </>
        )}
      </Sheet>
    </div>
  );
}
