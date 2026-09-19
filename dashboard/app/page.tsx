"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import {
  SPORT_VAR, f1, f2, hm, pace, shortDate, monthLabel, Tip, Legend, Card, Metric,
  Spark, MonthlyChart, TrendLine, InsightCard, CorrBar, WeekdayChart,
} from "./ui";

const TABS = ["Today", "Insights", "Recovery", "Sleep", "Training", "Body"] as const;
type Tab = (typeof TABS)[number];

const LEAD_LABEL: Record<string, string> = {
  hrv: "HRV", restingHR: "Resting HR", sleepH: "Sleep duration",
  sleepScore: "Sleep score", respiration: "Breathing rate",
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("Insights");
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

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
  const crit = (d.insights || []).filter((i: any) => i.severity === "critical").length;

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
          {crit > 0 && <span className="pill red"><span className="dot" />{crit} need{crit === 1 ? "s" : ""} attention</span>}
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
        <div className="grid two">
          <Card title="Where you are today" sub="against your own last 60 days" wide>
            <div className="metrics">
              <Metric label="HRV" value={f1(b.hrv.today)} base={b.hrv} />
              <Metric label="Resting HR" value={f1(b.restingHR.today)} base={b.restingHR} invert />
              <Metric label="Sleep" value={f2(b.sleepH.today)} unit=" h" base={b.sleepH} />
              <Metric label="Readiness" value={f1(b.readiness.today)} base={b.readiness} />
              <Metric label="Breathing" value={f2(b.respiration.today)} base={b.respiration} invert />
              <Metric label="Blood oxygen" value={f1(b.spO2.today)} unit="%" base={b.spO2} />
            </div>
            <p className="note">
              σ is how far today sits from your own recent normal — not a population average.
              Beyond ±1σ is genuinely unusual for you.
            </p>
          </Card>

          <Card title="Last 60 days at a glance" wide>
            <div className="sparkgrid">
              {[["hrv", "HRV", "var(--swim)"], ["restingHR", "Resting HR", "var(--bike)"],
                ["sleepH", "Sleep", "var(--strength)"], ["readiness", "Readiness", "var(--run)"]].map(([k, lab, c]) => (
                <div className="sparkbox" key={k}>
                  <div className="sparkhead"><span>{lab}</span><b>{f1(b[k]?.today)}</b></div>
                  <Spark data={recent} dataKey={k} color={c} />
                </div>
              ))}
            </div>
          </Card>

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

          <Card title="Recent sessions">
            <div className="list">
              {(d.activities || []).slice(0, 6).map((a: any, i: number) => (
                <div className="item" key={i}>
                  <span className="when">{shortDate(a.date)}</span>
                  <span className="what"><i className="sdot" style={{ background: SPORT_VAR[a.sport] }} />{a.name || a.sport}</span>
                  <span className="dur">{hm(a.minutes)}{a.km ? ` · ${a.km}km` : ""}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ INSIGHTS */}
      {tab === "Insights" && (
        <>
          <p className="lede">
            {d.insights.length} findings from {d.record.measuredDays ?? d.record.days} days of daily measurement. Each one is recomputed from live data
            every time this page loads — if the pattern goes away, so does the card.
          </p>
          <div className="insights">
            {d.insights.map((i: any) => <InsightCard key={i.id} i={i} />)}
          </div>
          {!!d.quality?.length && (
            <Card title="What this dashboard cannot tell you" wide>
              <ul className="gaps">{d.quality.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul>
              <p className="note">
                Stated plainly because a missing metric shown as zero is worse than one shown as missing.
              </p>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ RECOVERY */}
      {tab === "Recovery" && (
        <div className="grid two">
          <Card title="HRV by month" sub="the long arc" wide>
            <MonthlyChart data={d.monthly} dataKey="hrv" color="var(--swim)" />
            <p className="note">
              Monthly averages, not daily readings. A single night tells you almost nothing;
              a month tells you where your system actually sits.
            </p>
          </Card>

          <Card title="Resting heart rate by month" wide>
            <MonthlyChart data={d.monthly} dataKey="restingHR" color="var(--bike)" invert />
          </Card>

          <Card title="Rolling 28-day trend" sub="daily noise removed" wide>
            <TrendLine height={260} series={[
              { name: "HRV", color: "var(--swim)", data: d.rollups.hrv },
              { name: "Resting HR", color: "var(--bike)", data: d.rollups.restingHR },
            ]} />
            <p className="note">
              These two normally move opposite each other. When they move the same way, it is
              usually noise. When they diverge in the unfavourable direction together, it is real.
            </p>
          </Card>

          <Card title="What actually drives your readiness score" wide>
            <div className="corrs">
              {d.drivers.map((x: any) => (
                <CorrBar key={x.metric} label={LEAD_LABEL[x.metric] || x.metric} r={x.r} n={x.n} verdict={x.verdict} />
              ))}
            </div>
            <p className="note">
              Correlation of each metric against your daily readiness. Grey bars are relationships
              too weak or too thinly sampled to trust.
            </p>
          </Card>

          <Card title="Which signal leads which" sub="next-day prediction" wide>
            <div className="corrs">
              {d.leads.map((l: any) => {
                const one = l.lags.find((x: any) => x.lag === 1);
                return <CorrBar key={l.label} label={l.label} r={one?.r} n={one?.n} verdict={one?.verdict} />;
              })}
            </div>
            <p className="note">
              Today's value against tomorrow's. A strong bar means that metric is an early warning —
              it moves before the thing you actually care about does.
            </p>
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
              <Metric label="Owed" value={d.sleep.debtH} unit=" h" hint={`vs ${d.sleep.targetH} h target`} />
              <Metric label="Average" value={f2(d.sleep.meanH)} unit=" h" base={b.sleepH} />
              <Metric label="Nights on target" value={d.sleep.hitTarget} hint={`of ${d.sleep.nights} (${f1((d.sleep.hitTarget / d.sleep.nights) * 100)}%)`} />
              <Metric label="Nights under 6 h" value={d.sleep.under6} hint={d.sleep.under5 ? `${d.sleep.under5} under 5 h` : undefined} />
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
            <p className="note">
              The shape matters more than the average. A pile at 6–7 h with a thin tail above 7.5 h
              means the target is not being missed narrowly — it is rarely being aimed at.
            </p>
          </Card>

          <Card title="Sleep by month" wide>
            <MonthlyChart data={d.monthly} dataKey="sleepH" color="var(--strength)" unit=" h" domain={[0, 9]} />
          </Card>

          <Card title="Rolling 28-day sleep" wide>
            <TrendLine height={220} unit=" h" refLine={d.sleep.targetH} refLabel={`${d.sleep.targetH} h target`}
              domain={[4, 9]}
              series={[{ name: "Sleep", color: "var(--strength)", data: d.rollups.sleepH }]} />
          </Card>

          <Card title="Sleep by day of week">
            <WeekdayChart data={d.weekdays.sleepH} color="var(--strength)" unit="h" />
          </Card>

          <Card title="Sleep score by month">
            <MonthlyChart data={d.monthly} dataKey="sleepScore" color="var(--run)" />
          </Card>
        </div>
      )}

      {/* ============================================================ TRAINING */}
      {tab === "Training" && (
        <div className="grid two">
          <Card title="Weekly training" sub="complete — includes sessions the API hides" wide>
            <Legend items={[["Hours", "var(--swim)"], ["Training load", "var(--bike)"]]} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(d.trueWeekly || []).filter((w: any) => w.hours > 0)} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} unit=" h" />
                <Tooltip content={<Tip />} labelFormatter={shortDate} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="hours" name="Hours" fill="var(--swim)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="note">
              {d.sessionCounts?.actual} sessions since {shortDate(d.record.start)}, of which intervals.icu
              will only describe {d.sessionCounts?.visible} in detail — the rest came through Strava,
              which the API will not return. These hours and loads are the complete figure.
              Training genuinely began in mid-June; the two stray May entries aside, everything before
              that is real absence rather than missing data.
            </p>
          </Card>

          <Card title="Volume by sport" sub={`only the ${d.sessionCounts?.visible} sessions with full detail`} wide>
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
            <p className="note">Session distance including walk breaks, not continuous running.</p>
          </Card>

          <Card title="Fitness, fatigue and form" wide>
            <MonthlyChart data={d.monthly.filter((m: any) => m.ctl)} dataKey="form" color="var(--run)" />
            <p className="note">
              Form is fitness minus fatigue. Below zero means fatigue is winning. It only exists for
              months where training was actually recorded.
            </p>
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

          <Card title="Every session" wide>
            <table>
              <thead><tr><th>Date</th><th>Session</th><th className="num">Time</th><th className="num">km</th><th className="num">Pace</th></tr></thead>
              <tbody>
                {(d.activities || []).slice(0, 40).map((a: any, i: number) => (
                  <tr key={i} className="crow" onClick={() => setOpen(open === i ? null : i)}>
                    <td>{shortDate(a.date)}</td>
                    <td><i className="sdot" style={{ background: SPORT_VAR[a.sport] }} />{a.name || a.sport}
                      {open === i && <div className="sub" style={{ marginTop: 4 }}>
                        {a.type} · avg HR {a.hr ?? "—"} · max {a.maxHr ?? "—"} · load {a.load ?? "—"}
                      </div>}
                    </td>
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

      {/* ================================================================ BODY */}
      {tab === "Body" && (
        <div className="grid two">
          <Card title="Breathing rate by month" sub="your steadiest signal" wide>
            <MonthlyChart data={d.monthly} dataKey="respiration" color="var(--bike)" invert />
            <p className="note">
              Overnight breathing barely moves month to month, which is exactly what makes a shift
              meaningful. It is also the metric that leads your others — see Recovery.
            </p>
          </Card>

          <Card title="Blood oxygen by month" wide>
            <MonthlyChart data={d.monthly} dataKey="spO2" color="var(--run)" unit="%" domain={[92, 98]} />
          </Card>

          <Card title="Data coverage" sub="what is actually measured" wide>
            <div className="coverage">
              {Object.entries(d.record.coverage).map(([k, n]: any) => {
                const p = Math.round((n / d.record.days) * 100);
                return (
                  <div className="covrow" key={k}>
                    <span className="covlab">{LEAD_LABEL[k] || k}</span>
                    <span className="covtrack"><span className="covfill" style={{ width: `${p}%`, background: p > 80 ? "var(--good)" : p > 40 ? "var(--warning)" : "var(--critical)" }} /></span>
                    <span className="covval">{n}<small>/{d.record.days}</small></span>
                  </div>
                );
              })}
            </div>
            <p className="note">
              Anything under about 80% cannot support a trend claim. This is here so you know which
              charts to trust.
            </p>
          </Card>
        </div>
      )}

      <footer className="foot">
        Live from intervals.icu — Whoop recovery and Garmin activities.
        Recomputed {new Date(d.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.
      </footer>
    </div>
  );
}
