"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import {
  SPORT_VAR, METRIC_VAR, METRIC_LABEL, METRIC_INVERT, f1, f2, hm, pace, shortDate,
  Tip, Legend, Card, Explain, StatGrid, MetricTile, Spark, MonthlyChart, TrendLine,
  ScatterPlot, BarsChart, WeekdayChart, CorrBar, InsightTile, Sheet,
} from "./ui";

const TABS = ["Today", "Findings", "Recovery", "Sleep", "Training"] as const;
type Tab = (typeof TABS)[number];

type View =
  | { kind: "insight"; i: any }
  | { kind: "metric"; key: string }
  | { kind: "session"; a: any }
  | null;

export default function Page() {
  const [tab, setTab] = useState<Tab>("Today");
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
            <button className="pill red" onClick={() => setTab("Findings")}>
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

          <h3 className="secth">What matters most right now</h3>
          <div className="tiles">
            {insights.slice(0, 3).map((i: any) => (
              <InsightTile key={i.id} i={i} onClick={() => setView({ kind: "insight", i })} />
            ))}
          </div>
          <button className="morebtn" onClick={() => setTab("Findings")}>
            See all {insights.length} findings →
          </button>

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
              <div className="list">
                {(d.activities || []).slice(0, 6).map((a: any, i: number) => (
                  <button className="item clickable" key={i} onClick={() => setView({ kind: "session", a })}>
                    <span className="when">{shortDate(a.date)}</span>
                    <span className="what"><i className="sdot" style={{ background: SPORT_VAR[a.sport] }} />{a.name || a.sport}</span>
                    <span className="dur">{hm(a.minutes)}{a.km ? ` · ${a.km}km` : ""}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ FINDINGS */}
      {tab === "Findings" && (
        <>
          <p className="lede">
            {insights.length} findings, recomputed live. Tap any one for the numbers behind it.
          </p>
          <div className="tiles">
            {insights.map((i: any) => (
              <InsightTile key={i.id} i={i} onClick={() => setView({ kind: "insight", i })} />
            ))}
          </div>
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
          <Card title="HRV by month" sub="the long arc" wide onClick={() => openMetric("hrv")}>
            <MonthlyChart data={d.monthly} dataKey="hrv" color="var(--swim)" />
          </Card>

          <Card title="Resting heart rate by month" wide onClick={() => openMetric("restingHR")}>
            <MonthlyChart data={d.monthly} dataKey="restingHR" color="var(--bike)" invert />
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

          <Card title="What drives your readiness score" sub="tap a bar" wide>
            <div className="corrs">
              {d.drivers.map((x: any) => (
                <CorrBar key={x.metric} label={METRIC_LABEL[x.metric] || x.metric} r={x.r} n={x.n}
                  verdict={x.verdict} onClick={() => openMetric(x.metric)} />
              ))}
            </div>
            <Explain>Grey bars are relationships too weak or too thinly sampled to trust.</Explain>
          </Card>

          <Card title="Which signal leads which" sub="next-day prediction" wide>
            <div className="corrs">
              {d.leads.map((l: any) => {
                const one = l.lags.find((x: any) => x.lag === 1);
                return <CorrBar key={l.label} label={l.label} r={one?.r} n={one?.n} verdict={one?.verdict}
                  onClick={() => openMetric(l.cause)} />;
              })}
            </div>
            <Explain>
              Today's value against tomorrow's. A strong bar means that metric is an early warning —
              it moves before the thing you care about does.
            </Explain>
          </Card>

          <Card title="Breathing rate by month" sub="your steadiest signal" onClick={() => openMetric("respiration")}>
            <MonthlyChart data={d.monthly} dataKey="respiration" color="var(--bike)" invert />
          </Card>

          <Card title="Blood oxygen by month" onClick={() => openMetric("spO2")}>
            <MonthlyChart data={d.monthly} dataKey="spO2" color="var(--run)" unit="%" domain={[92, 98]} />
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
          <Card title="Weekly training" sub="includes sessions the API hides" wide>
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

          <Card title="Volume by sport" sub={`the ${d.sessionCounts?.visible} sessions with full detail`} wide>
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
            <MonthlyChart data={d.monthly.filter((m: any) => m.ctl)} dataKey="form" color="var(--run)" />
          </Card>

          <Card title="Planned against actual" sub="last 14 days" wide>
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
            <table>
              <thead><tr><th>Date</th><th>Session</th><th className="num">Time</th><th className="num">km</th><th className="num">Pace</th></tr></thead>
              <tbody>
                {(d.activities || []).slice(0, 40).map((a: any, i: number) => (
                  <tr key={i} className="crow" onClick={() => setView({ kind: "session", a })}>
                    <td>{shortDate(a.date)}</td>
                    <td><i className="sdot" style={{ background: SPORT_VAR[a.sport] }} />{a.name || a.sport}</td>
                    <td className="num">{hm(a.minutes)}</td>
                    <td className="num">{a.km || "—"}</td>
                    <td className="num">{a.sport === "Run" ? pace(a.paceSecPerKm) : a.kph ? `${a.kph} kph` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <StatGrid stats={[
            { k: "Sport", v: view.a.sport },
            { k: "Type", v: view.a.type || "—" },
            { k: "Duration", v: hm(view.a.minutes) },
            { k: "Distance", v: view.a.km ? `${view.a.km} km` : "—" },
            { k: "Pace", v: view.a.sport === "Run" ? pace(view.a.paceSecPerKm) : view.a.kph ? `${view.a.kph} kph` : "—" },
            { k: "Average HR", v: view.a.hr != null ? `${view.a.hr} bpm` : "—" },
            { k: "Max HR", v: view.a.maxHr != null ? `${view.a.maxHr} bpm` : "—" },
            { k: "Training load", v: view.a.load != null ? `${view.a.load}` : "—" },
          ]} />
        )}
      </Sheet>
    </div>
  );
}
